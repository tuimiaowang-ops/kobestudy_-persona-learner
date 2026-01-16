
export enum CharacterId {
  ASUKA = 'asuka',
  HIKARI = 'hikari',
  REI = 'rei',
  REN = 'ren',
  HAKU = 'haku'
}

export type EmotionType = 'neutral' | 'happy' | 'angry' | 'sad' | 'shy' | 'surprised';
export type Language = 'zh' | 'en';

export interface Character {
  id: CharacterId;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  description: string;
  descriptionEn: string;

  // --- 视觉相关 ---
  avatarUrl: string;
  // 必须有的表情映射表
  emotionMap: Record<string, string>;
  // 以前可能叫 accentColor，现在统一叫 color
  color: string;

  // --- AI 与对话相关 ---
  // 以前可能叫 greeting，现在统一叫 firstMessage
  firstMessage: string;
  // 以前可能叫 basePrompt，现在统一叫 systemPrompt
  systemPrompt: string;

  // ❌ 删掉了 basePrompt (因为我们用本地图片了，不需要 AI 画图提示词)
  // ❌ 删掉了 seed (同上)
  // ❌ 删掉了 greeting (被 firstMessage 取代)
  // ❌ 删掉了 accentColor (被 color 取代)
}

export enum GameMode {
  SETUP = 'SETUP',
  LOBBY = 'LOBBY',
  CHAT = 'CHAT'
}

export enum ChatMode {
  FREE_TALK = 'FREE_TALK',
  STUDY = 'STUDY'
}

export enum N3GrammarTopic {
  PASSIVE = '受身形 (Passive Form)',
  CAUSATIVE = '使役形 (Causative Form)',
  CAUSATIVE_PASSIVE = '使役受身 (Causative-Passive)',
  GIVING_RECEIVING = '授受表現 (Giving & Receiving)',
  KEIGO = '敬語 (Honorifics)',
  CONJECTURE = '様態・推量 (Conjecture/Appearance)',
  GENERAL = '综合复习 (General N3 Review)'
}

export interface DialoguePage {
  type: 'action' | 'speech';
  text: string;
}

export interface WordReading {
  word: string;
  reading: string;
}

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CollectedWord {
  id: string;
  original: string;
  translation: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string; 
  pages?: DialoguePage[];
  vocabulary?: WordReading[];
  quiz?: QuizData;
  emotion?: string; // Will now map to EmotionType keys
  senderName?: string; 
}

export interface UserState {
  learningGoal: string;
  grammarTopic: N3GrammarTopic;
  playerName: string;
  collectedWords: CollectedWord[];
  language: Language;
}

export interface CustomAssets {
  backgroundImage: string | null;
  characters: Record<CharacterId, string | null>;
}
