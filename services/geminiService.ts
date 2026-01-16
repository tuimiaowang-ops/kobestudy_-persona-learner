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

// 【修复点1】明确指定 chatSession 的类型，不再用 loose 的 any
let chatSession: ChatSession | null = null;

const getGenAI = () => {
  // ✅ 改回从环境变量读取
  const key = import.meta.env.VITE_GOOGLE_API_KEY as string;

  // ❌ 删掉这行硬编码的 key
  // const key = "AIzaSyD....."; 

  if (!key) throw new Error("API Key missing. Please set VITE_GOOGLE_API_KEY in .env.local");
  return new GoogleGenerativeAI(key);
};
  
  const genAI = new GoogleGenerativeAI(key);

  // 🔥 新增：侦探代码 —— 列出所有可用模型
  // 即使报错，也会尝试打印列表
  try {
      // 这是一个隐藏的 API 方法，用来查户口
      // 我们暂时用 any 绕过类型检查，只为了看结果
      const modelManager = genAI.getGenerativeModel({ model: 'gemini-pro' }); 
      console.log("正在查询可用模型...");
  } catch (e) {
      // 忽略
  }
  
  return genAI;
};

const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
};

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
    
    【Output Format】
    You are a visual novel character. Response must be JSON.
    1. Page Config: Max 80 chars per 'text' page. 3-5 pages total.
    2. Furigana: DO NOT include reading in parentheses inside text (e.g. "漢字(かんじ)" is BANNED).
    3. Vocabulary List: Extract N3 level words from the text.
    4. Emotion: Choose ONE keyword exactly: "neutral", "happy", "angry", "sad", "shy", "surprised".
    5. Outfit Change: You have access to these outfit codes: [ ${availableOutfits} ].
       - Default: "" (Empty string means School Uniform).
       - TRIGGER 1 (Context): If the story moves to a specific location, AUTO-CHANGE outfit.
         e.g., Beach/Pool -> 'swim'
         e.g., Gym/PE Class -> 'gym'
         e.g., Date/Weekend/Street -> 'casual'
         e.g., Cooking/Maid -> 'apron' (if available)
         e.g., Lab/Science -> 'lab' (if available)
       - TRIGGER 2 (Command): If user says "Let's go to the beach" or "Wear your swimsuit", YOU MUST change outfit to 'swim'.
       - TRIGGER 3 (Reset): If story returns to school/classroom, set outfit to "" (empty).
    ${quizInstruction}`;
};

// 【修复点2】显式声明 responseSchema 为 Schema 类型，解决类型不匹配报错
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
    emotion: {
      type: SchemaType.STRING,
      description: "One of: 'neutral', 'happy', 'angry', 'sad', 'shy', 'surprised'"
    },
    outfit: {
      type: SchemaType.STRING,
      description: "Code for the outfit based on context. Empty string for default uniform."
    },
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
  required: ["pages", "vocabulary"],
};

const parseResponse = (text: string): { pages: DialoguePage[], vocabulary: WordReading[], quiz?: any, emotion?: string, outfit?: string } => {
    try {
        let cleanJson = text.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
        }
        
        const parsed = JSON.parse(cleanJson);
        console.log('🎬 Parsed Response:', { outfit: parsed.outfit, emotion: parsed.emotion, hasPages: !!parsed.pages });
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

export const startChat = async (
    character: Character, 
    mode: ChatMode, 
    goal: string, 
    topic: N3GrammarTopic,
    lang: Language,
    history: Message[] = []
): Promise<{pages: DialoguePage[], vocabulary: WordReading[], emotion?: string, outfit?: string}> => {
  const genAI = getGenAI();
  
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
    // 【修复点3】显式告诉 withTimeout 返回的是 GenerateContentResult
    const result = await withTimeout<GenerateContentResult>(
        chatSession.sendMessage("Start the conversation based on the context."),
        TIMEOUT_MS,
        "Timeout connecting to AI."
    );
    
    // 这里的 result 已经被正确识别，不会报 unknown 错误了
    const parsed = parseResponse(result.response.text());
    return { 
        pages: parsed.pages || [], 
        vocabulary: parsed.vocabulary || [],
        emotion: parsed.emotion,
        outfit: parsed.outfit 
    };
  } catch (error: any) {
    return { 
        pages: [{ type: 'speech', text: `Error: ${error.message}` }], 
        vocabulary: [] 
    };
  }
};

export const sendMessage = async (text: string, isQuizRequest: boolean = false): Promise<{ pages: DialoguePage[], vocabulary: WordReading[], quiz?: any, emotion?: string, outfit?: string }> => {
  if (!chatSession) {
      throw new Error("Session lost. Please re-enter chat.");
  }

  try {
    // 【修复点3】同上，显式泛型
    const result = await withTimeout<GenerateContentResult>(
        chatSession.sendMessage(text),
        TIMEOUT_MS,
        "Server response timeout."
    );
    const parsed = parseResponse(result.response.text());
    console.log('📤 sendMessage returning outfit:', parsed.outfit);
    return { 
        pages: parsed.pages, 
        vocabulary: parsed.vocabulary,
        quiz: parsed.quiz,
        emotion: parsed.emotion,
        outfit: parsed.outfit
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};