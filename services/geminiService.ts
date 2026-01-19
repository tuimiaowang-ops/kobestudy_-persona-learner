import { 
  GoogleGenerativeAI, 
  SchemaType, 
  Schema, 
  ChatSession, 
  GenerateContentResult 
} from "@google/generative-ai";
import { Character, ChatMode, N3GrammarTopic, DialoguePage, WordReading, Message, Language } from '../types';

// 定义超时时间
const TIMEOUT_MS = 15000;

// 定义每个角色拥有的服装代码 (对应你文件名及其前缀)
const WARDROBE: Record<string, string[]> = {
  'asuka':  ['casual', 'gym', 'swim', 'maid', 'autumn'],
  'hikari': ['casual', 'gym', 'swim', 'yukata', 'autumn'],
  'rei':    ['casual', 'lab', 'gym', 'swim', 'kimono'],
  'ren':    ['casual', 'gym', 'fantasy', 'butler', 'lecturing'],
  'haku':   ['casual', 'apron', 'summer', 'prince']
};

// 全局对话 Session
let chatSession: ChatSession | null = null;

// 1. 获取 AI 实例
const getGenAI = () => {
  const key = import.meta.env.VITE_GOOGLE_API_KEY as string;
  if (!key) throw new Error("API Key missing. Please set VITE_GOOGLE_API_KEY in .env.local");
  return new GoogleGenerativeAI(key);
};

// 2. 超时控制辅助函数
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
};

// 3. 生成系统提示词 (包含强力的场景和换装逻辑)
const getSystemInstruction = (character: Character, mode: ChatMode, goal: string, topic: N3GrammarTopic, lang: Language) => {
  const personaBase = character.systemPrompt;
  const pedagogicalLang = lang === 'en' ? 'English' : 'Chinese (Simplified)';
  const availableOutfits = WARDROBE[character.id] ? WARDROBE[character.id].join(', ') : 'none';
  const quizInstruction = mode === ChatMode.STUDY 
    ? `4. Quiz (quiz): Include 1 multiple-choice question (4 options) related to the grammar topic "${topic}". The explanation must be in ${pedagogicalLang}.`
    : `4. Quiz (quiz): Not needed for FREE_TALK. Set quiz field to null.`;

  return `${personaBase}
    【IMPORTANT: Research Level】
    Target Level: JLPT N3 Fixed.
    Vocabulary: Use N3 level Kanji and vocabulary mainly.
    Grammar Focus: ${topic}
    Current Mode: ${mode === ChatMode.STUDY ? 'STUDY Mode' : 'FREE_TALK Mode'}
    User Language: ${pedagogicalLang} (Use this language for explanations/feedback)

    [SCENE & OUTFIT RULES - HIGH PRIORITY]
    1. LOCATION (Field: 'location'):
       You MUST change the 'location' field IMMEDIATELY if the topic touches these keywords:
       - Study/Homework/Exam/Book -> 'library'
       - Rest/Sleep/Home/Visit -> 'room'
       - Eat/Cook/Hungry -> 'kitchen' or 'cafe'
       - Walk/Date/Meet -> 'street' or 'park'
       - Exercise/Sport/Run -> 'gym' or 'park'
       - Swim/Beach/Sea -> 'beach'
       - Class/School/Morning -> 'classroom'
       - Secret/Talk/Wind -> 'rooftop'
       - Pray/Luck/New Year -> 'shrine'
       - Fantasy/Magic/Battle -> 'castle'
       - Science/Experiment -> 'lab'
       - Festival/Fireworks -> 'festival'
       
       *Logic*: If user says "Let's study", respond with location: "library". Do NOT wait.

    2. OUTFIT (Field: 'outfit'):
       Change outfit ONLY if logical context requires it (e.g., swimming -> 'swim').
       - Default: "" (School Uniform)
       - Codes: [ ${availableOutfits} ]
       - TRIGGER: If user commands "Change to casual" or "Wear swimsuit", OBEY immediately.
       - TRIGGER: If location changes to 'beach', set outfit to 'swim'.
       - TRIGGER: If location changes to 'gym', set outfit to 'gym'.

    3. OUTPUT FORMAT:
       You are a visual novel character. Response must be JSON.
       1. Page Config: Max 80 chars per 'text' page. 3-5 pages total.
       2. Furigana: DO NOT include reading in parentheses inside text.
       3. Vocabulary List: Extract N3 level words.
       4. Emotion: Choose ONE keyword exactly: "neutral", "happy", "angry", "sad", "shy", "surprised".
       5. Location: REQUIRED. Current scene ID from the rules above.
       6. Outfit: Code for outfit change.
    ${quizInstruction}`;
};

// 4. 定义返回数据的格式 (包含 outfit 和 location)
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    pages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "'action' or 'speech'" },
          text: { type: SchemaType.STRING, description: "Dialogue content" },
        },
        required: ["type", "text"],
      },
    },
    vocabulary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          reading: { type: SchemaType.STRING },
        },
        required: ["word", "reading"],
      },
    },
    emotion: { type: SchemaType.STRING },
    // 🔥 新增：独立的场景字段 (必填)
    location: { 
      type: SchemaType.STRING, 
      description: "Scene ID based on conversation topic. E.g., 'library', 'beach', 'room'." 
    },
    outfit: { type: SchemaType.STRING, description: "Code for the outfit based on context. Empty string for default uniform." },
    quiz: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING },
        options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        correctIndex: { type: SchemaType.NUMBER },
        explanation: { type: SchemaType.STRING },
      },
      required: ["question", "options", "correctIndex", "explanation"],
    },
  },
  required: ["pages", "vocabulary", "location"], // 👈 这里 location 是必须的
};

// 5. 解析 AI 返回的 JSON
const parseResponse = (text: string): { pages: DialoguePage[], vocabulary: WordReading[], quiz?: any, emotion?: string, outfit?: string, location?: string } => {
    try {
        let cleanJson = text.trim();
        // 清理 markdown 标记
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
        }
        
        const parsed = JSON.parse(cleanJson);
        console.log('🎬 Parsed Response:', { location: parsed.location, outfit: parsed.outfit, emotion: parsed.emotion });
        
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
            parsed.pages = [{ type: 'speech', text: "（静かに頷く）" }];
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", e);
        return {
            pages: [{ type: 'speech', text: "..." }],
            vocabulary: [],
            emotion: "neutral"
        };
    }
};

// 6. 翻译功能
export const translateText = async (text: string, targetLang: Language): Promise<string> => {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const target = targetLang === 'en' ? 'English' : 'Chinese (Simplified)';
    try {
        const result = await model.generateContent(
            `Translate the following Japanese text to ${target}. Only provide the translation text: "${text}"`
        );
        return result.response.text().trim() || "Translation failed.";
    } catch (error) {
        console.error("Translation error:", error);
        return "Error occurred during translation.";
    }
};

// 7. 开始对话 (初始化)
export const startChat = async (
    character: Character, 
    mode: ChatMode, 
    goal: string, 
    topic: N3GrammarTopic,
    lang: Language,
    history: Message[] = []
): Promise<{pages: DialoguePage[], vocabulary: WordReading[], emotion?: string, outfit?: string, location?: string}> => {
  const genAI = getGenAI();
  
  // 使用 gemini-flash-latest
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: getSystemInstruction(character, mode, goal, topic, lang),
    generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
  });

  chatSession = model.startChat({
      history: [], 
  });

  if (history.length > 0) {
      return { pages: [], vocabulary: [] };
  }

  try {
    const result = await withTimeout<GenerateContentResult>(
        chatSession.sendMessage("Start the conversation based on the context. Set initial location."),
        TIMEOUT_MS,
        "Timeout connecting to AI."
    );
    
    const parsed = parseResponse(result.response.text());
    return { 
        pages: parsed.pages || [], 
        vocabulary: parsed.vocabulary || [],
        emotion: parsed.emotion,
        outfit: parsed.outfit,
        location: parsed.location // 返回 location
    };
  } catch (error: any) {
    return { 
        pages: [{ type: 'speech', text: `Error: ${error.message}` }], 
        vocabulary: [] 
    };
  }
};

// 8. 发送消息
export const sendMessage = async (text: string, isQuizRequest: boolean = false): Promise<{ pages: DialoguePage[], vocabulary: WordReading[], quiz?: any, emotion?: string, outfit?: string, location?: string }> => {
  if (!chatSession) {
      throw new Error("Session lost. Please re-enter chat.");
  }

  try {
    const result = await withTimeout<GenerateContentResult>(
        chatSession.sendMessage(text),
        TIMEOUT_MS,
        "Server response timeout."
    );
    const parsed = parseResponse(result.response.text());
    
    // 调试日志
    console.log('📤 sendMessage response:', { 
        outfit: parsed.outfit, 
        location: parsed.location 
    });

    return { 
        pages: parsed.pages, 
        vocabulary: parsed.vocabulary, 
        quiz: parsed.quiz,
        emotion: parsed.emotion,
        outfit: parsed.outfit,
        location: parsed.location // 返回 location
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};