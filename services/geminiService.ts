import { 
  GoogleGenerativeAI, 
  SchemaType, 
  Schema, 
  ChatSession, 
  GenerateContentResult 
} from "@google/generative-ai";
import { Character, ChatMode, N3GrammarTopic, DialoguePage, WordReading, Message, Language } from '../types';

const TIMEOUT_MS = 30000; 

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

// 3. Prompt (🔥 核心修改：大幅增强单词提取指令)
const getSystemInstruction = (character: Character, mode: ChatMode, goal: string, topic: N3GrammarTopic, lang: Language) => {
  const personaBase = character.systemPrompt;
  const pedagogicalLang = lang === 'en' ? 'English' : 'Chinese (Simplified)';
  const availableOutfits = WARDROBE[character.id] ? WARDROBE[character.id].join(', ') : 'none';
  const quizInstruction = mode === ChatMode.STUDY 
    ? `4. Quiz (quiz): Include 1 multiple-choice question related to "${topic}". Explanation in ${pedagogicalLang}.`
    : `4. Quiz (quiz): Set to null.`;

  return `${personaBase}
    【IMPORTANT: VISUAL NOVEL NARRATIVE MODE】
    Target Level: JLPT N3.
    Current Mode: ${mode === ChatMode.STUDY ? 'STUDY Mode' : 'FREE_TALK Mode'}
    User Language: ${pedagogicalLang}

    [WRITING STYLE - LIGHT NOVEL / GALGAME]
    You are writing a script for a high-quality Japanese visual novel.
    
    **RULES FOR "PAGES" (CRITICAL):**
    1. **Output Length**: You MUST generate **5 to 6 pages** (array items) for every single turn. Do not be short.
    2. **Separate Action & Speech**:
       - **Do NOT** put actions in parentheses inside speech.
       - **INSTEAD**, create a separate "narration" page BEFORE or AFTER the speech.
    
    **PAGE TYPES:**
    - **Type "narration"**: Third-person descriptive text. Describe facial expressions, body language, atmosphere, or internal thoughts.
      - Example: "明日香は頬を赤らめ、机の上にちょこんと座った。上目遣いでこちらを見つめ、もじもじしている。"
    - **Type "speech"**: The character's spoken line. Use brackets.
      - Example: "「……ねえ、私のこと、どう思ってるの？」"

    **FLOW EXAMPLE:**
    Page 1 (narration): "She sighed deeply and looked out the window."
    Page 2 (speech): "I really don't want to study today..."
    Page 3 (narration): "Suddenly, she turned around with a mischievous smile."
    Page 4 (speech): "Let's escape, just the two of us!"
    Page 5 (narration): "She grabbed my hand tightly."

    [SCENE & OUTFIT]
    1. Location: Update 'location' if the narrative moves to a new place.
    2. Outfit: Update 'outfit' only if the narrative justifies a change. Codes: [${availableOutfits}]

    [VOCABULARY EXTRACTION RULES - HIGH PRIORITY]
    You MUST populate the 'vocabulary' array heavily. 
    **DO NOT BE LAZY.**
    1. Extract **6 to 12 words** per response.
    2. Include ANY Kanji compound (Kanji word) used in your "narration" or "speech" pages.
    3. Target Difficulty: JLPT N4, N3, N2. If a word has Kanji, include it so the user can check the reading.
    4. Format: { "word": "漢字", "reading": "かんじ" }

    [OUTPUT FORMAT - JSON]
    {
      "pages": [
        { "type": "narration", "text": "..." },
        { "type": "speech", "text": "..." }
      ],
      "vocabulary": [ 
         { "word": "頬", "reading": "ほほ" },
         { "word": "赤らめ", "reading": "あからめ" },
         ... (List ALL Kanji words used in the text above)
      ],
      "emotion": "neutral",
      "location": "classroom",
      "outfit": "casual",
      "quiz": null
    }`;
};

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    pages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Must be 'narration' or 'speech'" }, 
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

// 6. 翻译功能 (🔥 强制使用 Flash，省流不超额)
export const translateText = async (
    text: string, 
    targetLang: Language, 
    apiKey?: string,
    // modelName 参数在这里被忽略，强制内部使用 flash
    modelName?: string 
): Promise<string> => {
    const genAI = getGenAI(apiKey);
    // 🔥 强制翻译只用最便宜、最快的 Flash-latest
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }); 
    
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
        temperature: 0.85, 
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
        chatSession.sendMessage("Start the Visual Novel scene. Describe the situation first (narration), then speak. Generate 5-6 pages. EXTRACT MANY VOCABULARY WORDS."),
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