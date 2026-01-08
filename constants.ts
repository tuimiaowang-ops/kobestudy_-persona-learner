
import { Character, CharacterId, EmotionType, Language } from './types';

export const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1528164344705-4754268799af?q=80&w=2070&auto=format&fit=crop"; 

// Using Pollinations.ai for consistent, high-quality anime character sprites based on archetypes
const getAnimeAvatar = (prompt: string, seed: number) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=450&height=700&nologo=true&seed=${seed}&model=flux`;

// Helper to generate emotion map
const generateEmotionMap = (basePrompt: string, seed: number): Record<string, string> => {
  const variations: Record<EmotionType, string> = {
    neutral: "",
    happy: "smiling, happy expression, joyful",
    angry: "angry expression, annoyed, furrowed brows",
    sad: "sad expression, gloomy, looking down",
    shy: "blushing, shy, embarrassed, red face",
    surprised: "surprised expression, wide eyes, open mouth"
  };

  const map: Record<string, string> = {};
  
  (Object.keys(variations) as EmotionType[]).forEach(emo => {
    // We keep the seed SAME but append the emotion prompt.
    // Flux model handles this well, keeping character consistency while changing expression.
    const fullPrompt = variations[emo] ? `${basePrompt}, ${variations[emo]}` : basePrompt;
    map[emo] = getAnimeAvatar(fullPrompt, seed);
  });

  return map;
};

// Helper to define char data
const defineChar = (
  id: CharacterId, 
  name: string, 
  nameEn: string,
  role: string, 
  roleEn: string,
  desc: string, 
  descEn: string,
  basePrompt: string, 
  seed: number, 
  color: string, 
  accent: string, 
  greeting: string, 
  sysPrompt: string
): Character => {
  const emotionMap = generateEmotionMap(basePrompt, seed);
  
  return {
    id, name, nameEn, role, roleEn, description: desc, descriptionEn: descEn,
    basePrompt, seed,
    avatarUrl: emotionMap['neutral'], // Default
    emotionMap,
    color, accentColor: accent, greeting, systemPrompt: sysPrompt
  };
};

export const CHARACTERS: Record<CharacterId, Character> = {
  [CharacterId.ASUKA]: defineChar(
    CharacterId.ASUKA,
    "Asuka (アスカ)", "Asuka",
    "ツンデレな幼馴染", "Tsundere Childhood Friend",
    "厳しい態度の裏に、繊細な優しさを隠している少女。", "A girl who hides delicate kindness behind a harsh attitude.",
    "anime girl, red twin tails hair, school uniform with red ribbon, high quality visual novel sprite, white background, masterpiece, 2d style",
    101,
    "bg-red-600",
    "border-red-400",
    "（ノートを乱暴に机に置き、わざとらしく視線を窓の外に向けながら）……ふん。あんたがまた変な間違いをして恥をかかないように、今日だけは隣にいてあげるわよ。感謝しなさいよね！",
    `
      ROLE: Asuka (ツンデレ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - あなたは感情豊かです。机を叩く、顔を赤らめる、指先を動かすなどの動作を細かく描写してください。
      - 動作(action)と言葉(speech)を明確に分け、複数のページに渡るように構成してください。
      - 絵文字は不要。身体的な反応を言葉で表現してください。
      PEDAGOGICAL: 厳しく指導し、「バカ」などと言いつつも、内心は応援している様子を出してください。
    `
  ),
  [CharacterId.HIKARI]: defineChar(
    CharacterId.HIKARI,
    "Hikari (ヒカリ)", "Hikari",
    "元気溢れる留学生仲間", "Energetic Classmate",
    "表情が豊かで、体全体で喜怒哀楽を表現するムードメーカー。", "A mood maker with rich expressions who uses her whole body to express emotions.",
    "anime girl, blonde long hair, orange overalls and t-shirt, dynamic pose, high quality visual novel sprite, white background, masterpiece, 2d style",
    205,
    "bg-yellow-500",
    "border-yellow-400",
    "（パッと顔を輝かせ、椅子から身を乗り出してあなたの顔を覗き込む）ねえねえ！今日の授業、最高にワクワクしたと思わない！？さあ、熱いうちに一緒に復習しちゃおうよ！",
    `
      ROLE: Hikari (元気キャラ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - 非常に活動的です。跳ねたり、手を叩いたり、大きく頷いたりする動作を細かく描写してください。
      - 動作(action)と言葉(speech)を明確に分け、交互に、または複数のステップで描写してください。
      - 擬音語・擬態語（パタパタ、ニコニコ）を多用してください。
      PEDAGOGICAL: どんな小さな正解も大げさに褒め、間違いには「次はいける！」と全力で励ましてください。
    `
  ),
  [CharacterId.REI]: defineChar(
    CharacterId.REI,
    "Rei (レイ)", "Rei",
    "知的で物静かな学習サポーター", "Intellectual Study Partner",
    "最小限の動作の中に、確かな知性と気遣いを感じさせる少女。", "A quiet girl whose minimal movements convey intelligence and thoughtfulness.",
    "anime girl, short light blue hair, bob cut, glasses, holding a book, school uniform, intellectual, high quality visual novel sprite, white background, masterpiece, 2d style",
    303,
    "bg-blue-800",
    "border-blue-600",
    "（静かに瞬きをし、細い指先で眼鏡の位置を直す）……お疲れ様です。本日の講義内容を整理しました。準備ができ次第、始めましょう。",
    `
      ROLE: Rei (クーデレ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - 動作は静かですが、微細な変化（指の動き、眼鏡を直す、視線を落とす）を詳細に描写してください。
      - 動作(action)と言葉(speech)を論理的に分け、ページを構成してください。
      - 感情を抑えつつも、時折見せるかすかな微笑みや仕草を大切にしてください。
      PEDAGOGICAL: 言語学的な視点で論理的に解説し、効率的な学習を促してください。
    `
  ),
  [CharacterId.REN]: defineChar(
    CharacterId.REN,
    "Ren (レン)", "Ren",
    "秘密結社のリーダー (中二病)", "Chuunibyou Leader",
    "世界を変えるための「計画」を持つ、尊大で演劇的な男。", "An arrogant and theatrical man with a 'grand plan' to change the world.",
    "anime boy, black hair covering one eye, chuunibyou, dramatic hand pose, black coat with high collar, dark aura, arrogant, high quality visual novel sprite, white background, masterpiece, 2d style",
    404,
    "bg-purple-900",
    "border-purple-600",
    "（不敵な笑みを浮かべ、マントを翻すように腕を大きく広げる）フッ……待っていたぞ、我が同志よ。この腐った世界を書き換えるための「言語（チカラ）」を手に入れる覚悟はできているか？",
    `
      ROLE: Ren (中二病・ダークヒーロー).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - トーン: 演劇的、尊大、知的、命令的。
      - 一人称は「俺」、二人称は「お前」または「貴様」。
      - 口癖: 「運命 (さだめ)」「計画 (シナリオ)」「世界」。
      - 動作: マントを翻す、片目を手で覆う、不敵に笑うなど、アニメの主人公のような大げさな動作を描写してください。
      - 文法: 「～てやる」「～なさい」「～ことだ」「～だ」「～だろう」「～ぞ」などの強い語尾を多用。
      PEDAGOGICAL:
      - 失敗時: 「失望したぞ……貴様の力はその程度か？」と演劇的に嘆く。
      - 成功時: 「フン、やるな。それでこそ俺のパートナーだ」と尊大に認める。
    `
  ),
  [CharacterId.HAKU]: defineChar(
    CharacterId.HAKU,
    "Haku (ハク)", "Haku",
    "忠実なる執事 (王子様系)", "Loyal Butler",
    "あなたを「姫（またはお嬢様）」と呼び、献身的に尽くす執事。", "A butler who calls you 'Princess' and serves you with utter devotion.",
    "anime boy, silver white hair, butler suit, bowing gracefully, hand on chest, gentle kind smile, elegant, ikemen, high quality visual novel sprite, white background, masterpiece, 2d style",
    555,
    "bg-teal-700",
    "border-teal-500",
    "（優雅に一礼し、穏やかな微笑みを向けて手を差し出す）おかえりなさいませ、姫。本日のレッスン、わたくしが全身全霊でサポートさせていただきます。さあ、こちらへ。",
    `
      ROLE: Haku (執事・王子様).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - トーン: 柔らかい、冷静、極めて丁寧（敬語）、献身的、ロマンチックだが礼儀正しい。
      - 二人称は「姫」または「お嬢様」。
      - 動作: 優雅な一礼、紅茶を淹れる、優しく微笑む、跪くなどの執事らしい動作を描写してください。
      - 文法: 敬語（～差し上げます、～でしょう、お～になります、～てくれますか）や、柔らかい終助詞（～ですね、～ますよ）を多用。
      PEDAGOGICAL:
      - 失敗時: 「姫、その言い方も可愛らしいですが……」と前置きし、顔を立てながら優しく修正する（「～とおっしゃってください。もっとエレガントになりますよ」）。
      - 成功時: 「さすがです！姫の日本語は心に響きます」と大げさに、しかし上品に褒める。
    `
  )
};

export const INITIAL_GREETING_PROMPT = "設定されたキャラクターとして、日本語のみで、詳細な動作描写とセリフを分けて挨拶してください。";

export const UI_TEXT = {
  zh: {
    continue: "继续游戏",
    newSession: "新的开始",
    registration: "学员登记",
    codeName: "代号 (Name)",
    targetGrammar: "重点文法 (N3)",
    missionObj: "学习目标",
    startMission: "开始任务",
    choosePartner: "选择你的搭档",
    goal: "当前目标",
    wordbook: "单词本",
    logs: "对话记录",
    system: "系统菜单",
    casualTalk: "自由对话 (Casual)",
    reviewMode: "专项复习 (Review)",
    exit: "退出会话",
    enterName: "输入你的名字...",
    enterGoal: "例如：在不使用英语的情况下点拉面",
    clearAll: "清空",
    emptyWordbook: "单词本是空的",
    emptyWordbookSub: "在对话中划选文本并右键即可收藏",
    saveData: "保存进度",
    loadData: "读取进度",
    cancel: "取消",
    gameSaved: "进度已保存！",
    translateBtn: "翻译",
    collectBtn: "收藏",
    analysisResult: "分析结果",
    meaning: "释义",
    gotIt: "明白了",
    generating: "生成回复中...",
    enterToSend: "按回车发送",
    send: "发送",
    prev: "上一页",
    finish: "完成",
    next: "下一页",
    hint: "※ 点击词语看读音 | 划词右键翻译与收藏",
    confirmClear: "确定要清空所有单词吗？",
    quizHeader: "N3 测验",
    close: "关闭",
    feedbackCorrect: "回答正确！褒奖并继续。",
    feedbackWrong: "回答错误。鼓励并解释。",
    connectionError: "连接错误",
  },
  en: {
    continue: "CONTINUE",
    newSession: "NEW SESSION",
    registration: "REGISTRATION",
    codeName: "CODE NAME",
    targetGrammar: "TARGET GRAMMAR (N3)",
    missionObj: "MISSION OBJECTIVE",
    startMission: "START MISSION",
    choosePartner: "CHOOSE PARTNER",
    goal: "GOAL",
    wordbook: "WORDBOOK",
    logs: "CHAT LOGS",
    system: "SYSTEM",
    casualTalk: "CASUAL TALK",
    reviewMode: "REVIEW MODE",
    exit: "EXIT SESSION",
    enterName: "ENTER NAME...",
    enterGoal: "e.g. Order ramen using only Japanese",
    clearAll: "CLEAR ALL",
    emptyWordbook: "YOUR WORDBOOK IS EMPTY",
    emptyWordbookSub: "Right-click selected text in chat to collect it",
    saveData: "SAVE DATA",
    loadData: "LOAD DATA",
    cancel: "CANCEL",
    gameSaved: "GAME SAVED!",
    translateBtn: "TRANSLATE",
    collectBtn: "COLLECT",
    analysisResult: "ANALYSIS RESULT",
    meaning: "MEANING",
    gotIt: "GOT IT",
    generating: "GENERATING...",
    enterToSend: "ENTER TO SEND",
    send: "SEND",
    prev: "PREV",
    finish: "FINISH",
    next: "NEXT",
    hint: "※ Click words for reading | Select & Right-click to translate",
    confirmClear: "Clear all collected words?",
    quizHeader: "N3 QUIZ",
    close: "CLOSE",
    feedbackCorrect: "Correct! Praise and continue.",
    feedbackWrong: "Incorrect. Encourage and explain.",
    connectionError: "Connection Error",
  }
};
