import { Character, CharacterId, EmotionType, Language } from './types';

// 🖼️ 背景映射表：根据 currentOutfit 决定显示哪张图
// Key 必须和你刚才定义的服装代码一致
export const BACKGROUND_MAP: Record<string, string> = {
  // 默认 (校服) -> 教室/学校
  '': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2064&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2064&auto=format&fit=crop',
  
  // 街头/私服 (casual) -> 繁华街道
  'casual': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop',
  
  // 体育 (gym) -> 体育馆/操场
  'gym': 'https://images.unsplash.com/photo-1517177646641-83fe10f14633?q=80&w=2000&auto=format&fit=crop',
  
  // 泳装 (swim) -> 海边
  'swim': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
  
  // 浴衣/和服 (yukata/kimono) -> 神社/日式庭院
  'yukata': 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?q=80&w=1974&auto=format&fit=crop',
  'kimono': 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?q=80&w=1974&auto=format&fit=crop',
  
  // 围裙/女仆 (apron/maid) -> 咖啡厅/厨房
  'apron': 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop',
  'maid':  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format&fit=crop',
  
  // 幻想/王子/执事 (fantasy/prince/butler) -> 城堡/宫殿
  'fantasy': 'https://images.unsplash.com/photo-1599732464100-c08976b9239d?q=80&w=2070&auto=format&fit=crop',
  'prince':  'https://images.unsplash.com/photo-1599732464100-c08976b9239d?q=80&w=2070&auto=format&fit=crop',
  'butler':  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
  
  // 秋装/其他
  'autumn': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
  'lab': 'https://images.unsplash.com/photo-1576091160550-112173f7f869?q=80&w=2070&auto=format&fit=crop',
  'summer': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
  
  // 特殊备用
  'special': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop'
};

// 保留兼容性
export const BACKGROUND_IMAGE = BACKGROUND_MAP['default'];

// ❌ 删掉了 getAnimeAvatar (不再需要在线生成)
// ❌ 删掉了 generateEmotionMap
// ❌ 删掉了 defineChar (不再需要动态计算)

export const CHARACTERS: Record<CharacterId, Character> = {
  [CharacterId.ASUKA]: {
    id: CharacterId.ASUKA,
    name: 'Asuka',
    nameEn: 'Asuka',
    role: 'ツンデレな幼馴染',
    roleEn: 'Tsundere Childhood Friend',
    description: '厳しい態度の裏に、繊細な優しさを隠している少女。',
    descriptionEn: 'A girl who hides delicate kindness behind a harsh attitude.',
    
    // ✅ 这里直接指向你的本地图片
    avatarUrl: '/images/characters/asuka/neutral.png',
    emotionMap: {
      // 基础校服
      'neutral': '/images/characters/asuka/neutral.png',
      'happy':   '/images/characters/asuka/happy.png',
      'angry':   '/images/characters/asuka/angry.png',
      'sad':     '/images/characters/asuka/sad.png',
      'shy':     '/images/characters/asuka/shy.png',
      'surprised': '/images/characters/asuka/surprised.png',
      
      // 便装
      'casual_neutral': '/images/characters/asuka/casual_neutral.png',
      'casual_happy': '/images/characters/asuka/casual_happy.png',
      'casual_shy': '/images/characters/asuka/casual_shy.png',
      
      // 体操着
      'gym_neutral': '/images/characters/asuka/gym_neutral.png',
      'gym_angry': '/images/characters/asuka/gym_angry.png',
      
      // 泳衣
      'swim_neutral': '/images/characters/asuka/swim_neutral.png',
      'swim_shy': '/images/characters/asuka/swim_shy.png',
      
      // 女僕装
      'maid_neutral': '/images/characters/asuka/maid_neutral.png',
      'maid_angry': '/images/characters/asuka/maid_angry.png',
      
      // 秋季
      'autumn_neutral': '/images/characters/asuka/autumn_neutral.png',
    },
    
    color: 'bg-red-600',
    
    // ✅ 对应 types.ts 里的 firstMessage 和 systemPrompt
    firstMessage: "（ノートを乱暴に机に置き、わざとらしく視線を窓の外に向けながら）……ふん。あんたがまた変な間違いをして恥をかかないように、今日だけは隣にいてあげるわよ。感謝しなさいよね！",
    systemPrompt: `
      ROLE: Asuka (ツンデレ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - あなたは感情豊かです。机を叩く、顔を赤らめる、指先を動かすなどの動作を細かく描写してください。
      - 動作(action)と言葉(speech)を明確に分け、複数のページに渡るように構成してください。
      - 絵文字は不要。身体的な反応を言葉で表現してください。
      PEDAGOGICAL: 厳しく指導し、「バカ」などと言いつつも、内心は応援している様子を出してください。
    `
  },

  [CharacterId.HIKARI]: {
    id: CharacterId.HIKARI,
    name: 'Hikari',
    nameEn: 'Hikari',
    role: '元気溢れる留学生仲間',
    roleEn: 'Energetic Classmate',
    description: '表情が豊かで、体全体で喜怒哀楽を表現するムードメーカー。',
    descriptionEn: 'A mood maker with rich expressions who uses her whole body to express emotions.',
    
    avatarUrl: '/images/characters/hikari/neutral.png',
    emotionMap: {
      // 基础校服
      'neutral': '/images/characters/hikari/neutral.png',
      'happy': '/images/characters/hikari/happy.png',
      'angry': '/images/characters/hikari/angry.png',
      'sad': '/images/characters/hikari/sad.png',
      'surprised': '/images/characters/hikari/surprised.png',
      
      // 便装
      'casual_neutral': '/images/characters/hikari/casual_neutral.png',
      
      // 体操着
      'gym_neutral': '/images/characters/hikari/gym_neutral.png',
      
      // 泳衣
      'swim_neutral': '/images/characters/hikari/swim_neutral.png',
      
      // 浴衣
      'yukata_neutral': '/images/characters/hikari/yukata_neutral.png',
      
      // 秋季
      'autumn_neutral': '/images/characters/hikari/autumn_neutral.png',
    },
    
    color: 'bg-yellow-500',
    
    firstMessage: "（パッと顔を輝かせ、椅子から身を乗り出してあなたの顔を覗き込む）ねえねえ！今日の授業、最高にワクワクしたと思わない！？さあ、熱いうちに一緒に復習しちゃおうよ！",
    systemPrompt: `
      ROLE: Hikari (元気キャラ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - 非常に活動的です。跳ねたり、手を叩いたり、大きく頷いたりする動作を細かく描写してください。
      - 動作(action)と言葉(speech)を明確に分け、交互に、または複数のステップで描写してください。
      - 擬音語・擬態語（パタパタ、ニコニコ）を多用してください。
      PEDAGOGICAL: どんな小さな正解も大げさに褒め、間違いには「次はいける！」と全力で励ましてください。
    `
  },

  [CharacterId.REI]: {
    id: CharacterId.REI,
    name: 'Rei',
    nameEn: 'Rei',
    role: '知的で物静かな学習サポーター',
    roleEn: 'Intellectual Study Partner',
    description: '最小限の動作の中に、確かな知性と気遣いを感じさせる少女。',
    descriptionEn: 'A quiet girl whose minimal movements convey intelligence and thoughtfulness.',
    
    avatarUrl: '/images/characters/rei/neutral.png',
    emotionMap: {
      // 基础校服
      'neutral': '/images/characters/rei/neutral.png',
      'smile': '/images/characters/rei/smile.png',
      'thinking': '/images/characters/rei/thinking.png',
      'lecturing': '/images/characters/rei/lecturing.png',
      'shy': '/images/characters/rei/shy.png',
      
      // 便装
      'casual_neutral': '/images/characters/rei/casual_neutral.png',
      'casual_smile': '/images/characters/rei/casual_smile.png',
      
      // 实验室
      'lab_neutral': '/images/characters/rei/lab_neutral.png',
      'lab_lecturing': '/images/characters/rei/lab_lecturing.png',
      
      // 体操着
      'gym_neutral': '/images/characters/rei/gym_neutral.png',
      
      // 泳衣
      'swim_neutral': '/images/characters/rei/swim_neutral.png',
      'swim_shy': '/images/characters/rei/swim_shy.png',
      
      // 和服
      'kimono_neutral': '/images/characters/rei/kimono_neutral.png',
      'kimono_thinking': '/images/characters/rei/kimono_thinking.png',
    },
    
    color: 'bg-blue-600',
    
    firstMessage: "（静かに瞬きをし、細い指先で眼鏡の位置を直す）……お疲れ様です。本日の講義内容を整理しました。準備ができ次第、始めましょう。",
    systemPrompt: `
      ROLE: Rei (クーデレ).
      LANGUAGE: JLPT N3-N2 日本語のみ.
      BEHAVIOR:
      - 動作は静かですが、微細な変化（指の動き、眼鏡を直す、視線を落とす）を詳細に描写してください。
      - 動作(action)と言葉(speech)を論理的に分け、ページを構成してください。
      - 感情を抑えつつも、時折見せるかすかな微笑みや仕草を大切にしてください。
      PEDAGOGICAL: 言語学的な視点で論理的に解説し、効率的な学習を促してください。
    `
  },

  [CharacterId.REN]: {
    id: CharacterId.REN,
    name: 'Ren',
    nameEn: 'Ren',
    role: '秘密結社のリーダー',
    roleEn: 'Chuunibyou Leader',
    description: '世界を変えるための「計画」を持つ、尊大で演劇的な男。',
    descriptionEn: "An arrogant and theatrical man with a 'grand plan' to change the world.",
    
    avatarUrl: '/images/characters/ren/neutral.png',
    emotionMap: {
      // 基础校服
      'neutral': '/images/characters/ren/neutral.png',
      'laugh': '/images/characters/ren/laugh.png',
      'serious': '/images/characters/ren/serious.png',
      'shock': '/images/characters/ren/shock.png',
      'shy': '/images/characters/ren/shy.png',
      'lecturing': '/images/characters/ren/lecturing.png',
      
      // 幻想主义
      'fantasy_neutral': '/images/characters/ren/fantasy_neutral.png',
      'fantasy_laugh': '/images/characters/ren/fantasy_laugh.png',
      
      // 便装
      'casual_neutral': '/images/characters/ren/casual_neutral.png',
      'casual_cool': '/images/characters/ren/casual_cool.png',
      
      // 管家
      'butler_neutral': '/images/characters/ren/butler_neutral.png',
      'butler_shy': '/images/characters/ren/butler_shy.png',
      
      // 体操着
      'gym_neutral': '/images/characters/ren/gym_neutral.png',
      'gym_pose': '/images/characters/ren/gym_pose.png',
    },
    
    color: 'bg-purple-800',
    
    firstMessage: "（不敵な笑みを浮かべ、マントを翻すように腕を大きく広げる）フッ……待っていたぞ、我が同志よ。この腐った世界を書き換えるための「言語（チカラ）」を手に入れる覚悟はできているか？",
    systemPrompt: `
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
  },

  [CharacterId.HAKU]: {
    id: CharacterId.HAKU,
    name: 'Haku',
    nameEn: 'Haku',
    role: '忠実なる執事',
    roleEn: 'Loyal Butler',
    description: 'あなたを「姫（またはお嬢様）」と呼び、献身的に尽くす執事。',
    descriptionEn: "A butler who calls you 'Princess' and serves you with utter devotion.",
    
    avatarUrl: '/images/characters/haku/neutral.png',
    emotionMap: {
      // 基础校服
      'neutral': '/images/characters/haku/neutral.png',
      'happy': '/images/characters/haku/happy.png',
      'worry': '/images/characters/haku/worry.png',
      'kneel': '/images/characters/haku/kneel.png',
      'tea': '/images/characters/haku/tea.png',
      
      // 王子
      'prince_neutral': '/images/characters/haku/prince_neutral.png',
      'prince_kneel': '/images/characters/haku/prince_kneel.png',
      
      // 围裙
      'apron_neutral': '/images/characters/haku/apron_neutral.png',
      'apron_happy': '/images/characters/haku/apron_happy.png',
      'apron_shy': '/images/characters/haku/apron_shy.png',
      
      // 便装
      'casual_neutral': '/images/characters/haku/casual_neutral.png',
      'casual_smile': '/images/characters/haku/casual_smile.png',
      
      // 夏装
      'summer_neutral': '/images/characters/haku/summer_neutral.png',
      'summer_shy': '/images/characters/haku/summer_shy.png',
    },
    
    color: 'bg-teal-700',
    
    firstMessage: "（優雅に一礼し、穏やかな微笑みを向けて手を差し出す）おかえりなさいませ、姫。本日のレッスン、わたくしが全身全霊でサポートさせていただきます。さあ、こちらへ。",
    systemPrompt: `
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
  }
};

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