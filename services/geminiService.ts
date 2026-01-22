import { 
  GoogleGenerativeAI, 
  SchemaType, 
  Schema, 
  ChatSession, 
  GenerateContentResult 
} from "@google/generative-ai";
import { Character, ChatMode, N3GrammarTopic, DialoguePage, WordReading, Message, Language } from '../types';

const TIMEOUT_MS = 25000; // 稍微延长超时，因为生成的文本变长了

const WARDROBE: Record<string, string[]> = {
  'asuka':  ['casual', 'gym', 'swim', 'maid', 'autumn'],
  'hikari': ['casual', 'gym', 'swim', 'yukata', 'autumn'],
  'rei':    ['casual', 'lab', 'gym', 'swim', 'kimono'],
  'ren':    ['casual', 'gym', 'fantasy', 'butler', 'lecturing'],
  'haku':   ['casual', 'apron', 'summer', 'prince']
};

let chatSession: ChatSession | null = null;

// 1. 获取 AI 实例
const getGenAI = (userApiKey?: string) => {
  const key = userApiKey || (import.meta.env.VITE_GOOGLE_API_KEY as string);
  if (!key) {
    throw new Error("No API Key found. Please provide a key in settings or .env file.");
  }
  return new GoogleGenerativeAI(key);
};

// 2. 超时控制
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
};

// 3. Prompt (🔥 核心修改：大幅增强了演技指导)
const getSystemInstruction = (character: Character, mode: ChatMode, goal: string, topic: N3GrammarTopic, lang: Language) => {
  const personaBase = character.systemPrompt;
  const pedagogicalLang = lang === 'en' ? 'English' : 'Chinese (Simplified)';
  const availableOutfits = WARDROBE[character.id] ? WARDROBE[character.id].join(', ') : 'none';
  const quizInstruction = mode === ChatMode.STUDY 
    ? `4. Quiz (quiz): Include 1 multiple-choice question (4 options) related to the grammar topic "${topic}". The explanation must be in ${pedagogicalLang}.`
    : `4. Quiz (quiz): Not needed for FREE_TALK. Set quiz field to null.`;

  return `${personaBase}
    【IMPORTANT: VISUAL NOVEL ROLEPLAY】
    Target Level: JLPT N3 Fixed.
    Vocabulary: Use N3 level Kanji and vocabulary mainly.
    Grammar Focus: ${topic}
    Current Mode: ${mode === ChatMode.STUDY ? 'STUDY Mode' : 'FREE_TALK Mode'}
    User Language: ${pedagogicalLang} (Use this language for explanations/feedback)

    [ACTING INSTRUCTIONS - CRITICAL]
    You are a character in a high-quality visual novel.
    1. **Rich Descriptions**: EVERY text box MUST start with a vivid description of actions, expressions, or feelings in parentheses.
       - BAD: "こんにちは。元気？"
       - GOOD: "（目を輝かせて、あなたの手を取りながら）こんにちは！ねえ、元気だった？"
    2. **Length**: Do NOT be brief. Split your response into 2-4 separate 'pages' (array items) to create a rhythmic conversation flow.
    3. **Personality**: Emphasize your specific character traits (Tsundere/Energetic/Kuudere/Chuunibyou/Butler) in every sentence.

    [SCENE & OUTFIT RULES]
    1. LOCATION (Field: 'location'):
       Change 'location' IMMEDIATELY if the conversation topic implies moving.
       - Keywords: Study/Library, Home/Room, Eat/Kitchen/Cafe, Walk/Street/Park, Swim/Beach, Class/School, Roof/Rooftop, Shrine, Castle, Lab.
    
    2. OUTFIT (Field: 'outfit'):
       Change outfit ONLY if context requires it (e.g. swimming -> 'swim', sleeping -> 'casual').
       - Available codes: [ ${availableOutfits} ]

    3. OUTPUT FORMAT (JSON ONLY):
       Response must be strict JSON.
       1. pages: Array of objects. Each object has "text". Max 120 chars per page. Generate 2-4 pages per turn.
       2. vocabulary: Extract N3 words used.
       3. emotion: EXACTLY ONE of: "neutral", "happy", "angry", "sad", "shy", "surprised".
       4. location: Current scene ID.
       5. outfit: Outfit code (or empty string).
    ${quizInstruction}`;
};

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    pages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          text: { type: SchemaType.STRING },
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
    location: { type: SchemaType.STRING },
    outfit: { type: SchemaType.STRING },
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
  required: ["pages", "vocabulary", "location"],
};

const parseResponse = (text: string) => {
    try {
        let cleanJson = text.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
        }
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return { pages: [{ type: 'speech', text: "..." }], vocabulary: [], emotion: "neutral" };
    }
};

// 6. 翻译功能
export const translateText = async (
    text: string, 
    targetLang: Language, 
    apiKey?: string,
    modelName: string = 'gemini-1.5-flash-latest'
): Promise<string> => {
    const genAI = getGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
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

// 7. 开始对话
export const startChat = async (
    character: Character, 
    mode: ChatMode, 
    goal: string, 
    topic: N3GrammarTopic,
    lang: Language,
    apiKey?: string,
    modelName: string = 'gemini-1.5-flash-latest',
    history: Message[] = []
) => {
  const genAI = getGenAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: getSystemInstruction(character, mode, goal, topic, lang),
    generationConfig: {
        temperature: 0.75, // 🔥稍微提高温度，增加创造性和丰富度
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
  });

  chatSession = model.startChat({ history: [] });

  if (Array.isArray(history) && history.length > 0) {
      return { pages: [], vocabulary: [] };
  }

  try {
    const result = await withTimeout<GenerateContentResult>(
        chatSession.sendMessage("Start the conversation based on the context. Remember to use vivid action descriptions in parentheses."),
        TIMEOUT_MS,
        "Timeout connecting to AI."
    );
    
    const parsed = parseResponse(result.response.text());
    return { 
        pages: parsed.pages || [], 
        vocabulary: parsed.vocabulary || [],
        emotion: parsed.emotion,
        outfit: parsed.outfit,
        location: parsed.location
    };
  } catch (error: any) {
    return { pages: [{ type: 'speech', text: `Error: ${error.message}` }], vocabulary: [] };
  }
};

// 8. 发送消息
export const sendMessage = async (text: string, isQuizRequest: boolean = false) => {
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
    
    return { 
        pages: parsed.pages, 
        vocabulary: parsed.vocabulary, 
        quiz: parsed.quiz,
        emotion: parsed.emotion,
        outfit: parsed.outfit,
        location: parsed.location
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};