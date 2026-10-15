import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const SLEEP_FILE = path.join(DATA_DIR, 'sleep.json');
const REFLECTIONS_FILE = path.join(DATA_DIR, 'reflections.json');
const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json');

// Load from disk on startup
const loadJSON = (file) => {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) { console.warn(`[data] Could not load ${file}:`, e.message); }
  return {};
};

const saveJSON = (file, data) => {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8'); }
  catch (e) { console.warn(`[data] Could not save ${file}:`, e.message); }
};

// In-memory maps backed by disk
const conversationsStore = loadJSON(CONVERSATIONS_FILE); // { [userId]: thread[] }
const logsStore = loadJSON(LOGS_FILE);                    // { [userId]: log[] }
const sleepStore = loadJSON(SLEEP_FILE);                  // { [userId]: sleepLog[] }
const reflectionsStore = loadJSON(REFLECTIONS_FILE);      // { [userId]: reflection[] }

const getUserThreads = (userId) => {
  if (!conversationsStore[userId]) conversationsStore[userId] = [];
  return conversationsStore[userId];
};

const saveThreads = () => saveJSON(CONVERSATIONS_FILE, conversationsStore);

const getLogsHistory = (userId) => logsStore[userId] || [];
const getSleepHistory = (userId) => sleepStore[userId] || [];
const getReflectionsHistory = (userId) => reflectionsStore[userId] || [];

// Language detection
const detectLanguage = (text) => {
  const portugueseWords = /\b(olá|oi|como|está|você|para|uma|que|não|sim|obrigado|porém|também|podem|estou|triste|feliz|ansioso|medo|ajuda|quero|preciso|muito|pouco|bem|mal|hoje|agora|eu|ele|ela|nós)\b/gmi;
  const englishWords = /\b(hello|hi|how|are|you|thank|why|what|can|would|could|should|sad|happy|anxious|help|want|need|very|little|good|bad|today|now|i|he|she|we)\b/gmi;
  const ptMatches = (text.match(portugueseWords) || []).length;
  const enMatches = (text.match(englishWords) || []).length;
  return ptMatches >= enMatches ? 'pt' : 'en';
};

const createAssistantReply = async (message, userId, history, languageOverride = null) => {
  try {
    const language = languageOverride || detectLanguage(message);
    const recentLogs = getLogsHistory(userId).slice(0, 5);
    
    // Format the user's personal context
    let logsContext = "The user has not logged any mood or sleep data yet. Encourage them to use the daily tracker in the dashboard.";
    if (recentLogs.length > 0) {
      const formattedLogs = recentLogs.map((log, index) => 
        `- [Log ${index + 1} from today/past] Mood Score: ${log.mood_score}/5 | Sleep: ${log.sleep_hours}h | Notes: ${log.notes || 'None'}`
      ).join('\\n');
      logsContext = `Here are the user's most recent mood and sleep logs:\\n${formattedLogs}`;
    }

    // Try Google Gemini API first
    try {
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.message }]
      }));

      const systemPrompt = `[System Instruction: You are the 'AURA Assistant', an empathetic and intelligent mental wellness companion embedded directly inside the AURA application.
You are NOT a generic chatbot; you are an AURA expert.
You MUST respond in the EXACT same language that the user used in their message.
Keep your response concise (max 3-4 sentences). Be warm, reflective, and validating.

*** AURA APP FEATURES & KNOWLEDGE ***
If the user mentions or asks about:
- Anxiety: Recommend they take the "GAD-7" questionnaire.
- Depression / Sadness: Recommend they take the "PHQ-9" questionnaire.
- Stress / Overwhelmed: Recommend they take the "PSS-10" questionnaire.
- General Well-being: Recommend the "WHO-5" questionnaire.
*Always tell them they can find these questionnaires in the "Inquéritos" (Questionnaires) page.*
- Trouble sleeping or high stress: Suggest they visit the "Meditations" or "Sleep" pages in the app for guided audio exercises.

*** USER DATA MEMORY ***
If the user asks to check their progress, summarize the following data:
${logsContext}]

User message: ${message}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.G_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...formattedHistory, {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiResponse) return aiResponse;
      }
    } catch (apiErr) {
      console.warn('Gemini API unavailable, using intelligent fallback');
    }

    // Intelligent fallback responses based on message keywords
    const lowerMsg = message.toLowerCase();
    
    if (language === 'pt') {
      const responses = {
        anxious: [
          'Entendo que está ansioso(a). Termos um momento de respiração profunda pode ajudar. O que você acha que está causando essa ansiedade?',
          'A ansiedade é uma sensação comum. Pode me dizer mais sobre o que está passando pela sua mente?',
          'Está tudo bem sentir-se ansioso. Vamos trabalhar isso juntos. Qual é a sua preocupação principal neste momento?'
        ],
        sad: [
          'Sinto que está triste. Essas emoções são válidas e importantes. Quer compartilhar o que está afetando você?',
          'A tristeza é uma parte natural do ser humano. Estou aqui para ouvir. O que está no seu coração?',
          'Vejo que está passando por um momento difícil. Sabe que você não está sozinho. Como posso ajudar?'
        ],
        stress: [
          'Stress é algo que muitos enfrentam. Que tal fazermos uma pausa e respirarmos juntos?',
          'Entendo o stress. Às vezes, pequenas ações como meditação ou movimento podem ajudar. Já tentou algo assim?',
          'O stress avisa que precisamos cuidar de nós. Que atividade o relaxa?'
        ],
        grateful: [
          'Que maravilhoso estar grato(a)! A gratidão é fundamental para o bem-estar. O que mais o felicita?',
          'É lindo ver sua gratidão. Esses sentimentos positivos são bênçãos. Como isso muda sua perspectiva?',
          'Agradeço seu optimismo! Gratidão é transformadora. Que outras coisas o(a) inspiram?'
        ]
      };

      let response = responses.other || [];
      if (lowerMsg.includes('ansied') || lowerMsg.includes('nervos') || lowerMsg.includes('preocup')) {
        response = responses.anxious;
      } else if (lowerMsg.includes('triste') || lowerMsg.includes('deprim') || lowerMsg.includes('sofrendo')) {
        response = responses.sad;
      } else if (lowerMsg.includes('stress') || lowerMsg.includes('pressão') || lowerMsg.includes('sobrecarr')) {
        response = responses.stress;
      } else if (lowerMsg.includes('grat') || lowerMsg.includes('feliz') || lowerMsg.includes('bom')) {
        response = responses.grateful;
      }

      if (!response.length) {
        response = [
          'Obrigado por compartilhar. Estou aqui para ouvir e apoiar você. Como está se sentindo agora?',
          'Entendo seus sentimentos. Que mais você gostaria de conversar?',
          'Sua saúde mental é importante. Vamos continuar essa conversa?'
        ];
      }

      return response[Math.floor(Math.random() * response.length)];
    } else {
      const responses = {
        anxious: [
          'I understand you\'re feeling anxious. Taking some deep breaths can help. What do you think is causing this anxiety?',
          'Anxiety is a common feeling. Can you tell me more about what\'s on your mind?',
          'It\'s okay to feel anxious. Let\'s work through this together. What\'s your main concern right now?'
        ],
        sad: [
          'I hear that you\'re feeling sad. Those emotions are valid and important. Would you like to share what\'s affecting you?',
          'Sadness is a natural human emotion. I\'m here to listen. What\'s in your heart?',
          'I see you\'re going through a difficult time. Know that you\'re not alone. How can I help?'
        ],
        stress: [
          'Stress is something many face. What if we take a pause and breathe together?',
          'I understand stress. Sometimes small actions like meditation or movement can help. Have you tried something like that?',
          'Stress tells us we need to care for ourselves. What activity relaxes you?'
        ],
        grateful: [
          'How wonderful that you\'re feeling grateful! Gratitude is key to wellness. What makes you most happy?',
          'It\'s beautiful to see your gratitude. Those positive feelings are blessings. How does this shift your perspective?',
          'I appreciate your optimism! Gratitude is transformative. What else inspires you?'
        ]
      };

      let response = [];
      if (lowerMsg.includes('anxious') || lowerMsg.includes('nervous') || lowerMsg.includes('worried')) {
        response = responses.anxious;
      } else if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('suffering')) {
        response = responses.sad;
      } else if (lowerMsg.includes('stress') || lowerMsg.includes('pressure') || lowerMsg.includes('overwhelm')) {
        response = responses.stress;
      } else if (lowerMsg.includes('grateful') || lowerMsg.includes('happy') || lowerMsg.includes('good')) {
        response = responses.grateful;
      }

      if (!response.length) {
        response = [
          'Thank you for sharing. I\'m here to listen and support you. How are you feeling right now?',
          'I understand your feelings. What else would you like to talk about?',
          'Your mental health matters. Let\'s continue this conversation.'
        ];
      }

      return response[Math.floor(Math.random() * response.length)];
    }
  } catch (error) {
    console.error('AI response error:', error.message);
    return detectLanguage(message) === 'pt'
      ? 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?'
      : 'Sorry, I had trouble processing your message. Can you try again?';
  }
};

export const chat = catchAsync(async (req, res, next) => {
  const { user_id, message, conversation_id, language } = req.body;

  if (!user_id || !message) {
    return next(new AppError('Missing user_id or message', 400));
  }

  const threads = getUserThreads(user_id);
  let thread = null;

  if (conversation_id) {
    thread = threads.find(t => t.id === conversation_id);
  }

  if (!thread) {
    thread = {
      id: Date.now().toString(),
      title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    threads.unshift(thread);
  }

  const responseText = await createAssistantReply(message, user_id, thread.messages, language);
  const timestamp = new Date().toISOString();

  thread.messages.push({ role: 'user', message, timestamp });
  thread.messages.push({ role: 'assistant', message: responseText, timestamp });
  thread.updatedAt = timestamp;

  if (thread.messages.length > 50) {
    thread.messages = thread.messages.slice(-50);
  }

  saveThreads(); // persist to disk
  res.status(200).json({ response: responseText, conversation_id: thread.id, messages: thread.messages });
});

export const logMood = catchAsync(async (req, res, next) => {
  const { user_id, mood_score, sleep_hours, notes } = req.body;

  if (!user_id) {
    return next(new AppError('Missing user_id in request body', 400));
  }

  const entry = {
    mood_score: mood_score ?? null,
    sleep_hours: sleep_hours ?? null,
    notes: notes ?? null,
    timestamp: new Date().toISOString()
  };

  const history = getLogsHistory(user_id);
  const updatedLogs = [entry, ...history].slice(0, 100);

  logsStore[user_id] = updatedLogs;
  saveJSON(LOGS_FILE, logsStore);

  res.status(200).json({ success: true, log: entry });
});

export const getLogs = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 14;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const history = getLogsHistory(userId).slice(0, limit);
  res.status(200).json({ logs: history });
});

export const getConversations = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const threads = getUserThreads(userId);
  const metadata = threads.map(t => ({ id: t.id, title: t.title, updatedAt: t.updatedAt }));
  res.status(200).json({ conversations: metadata });
});

export const getConversationMessages = catchAsync(async (req, res, next) => {
  const { userId, conversationId } = req.params;

  if (!userId || !conversationId) {
    return next(new AppError('Missing parameters', 400));
  }

  const threads = getUserThreads(userId);
  const thread = threads.find(t => t.id === conversationId);

  if (!thread) {
    return next(new AppError('Conversation not found', 404));
  }

  res.status(200).json({ messages: thread.messages });
});

export const deleteConversation = catchAsync(async (req, res, next) => {
  const { userId, conversationId } = req.params;

  if (!userId || !conversationId) {
    return next(new AppError('Missing parameters', 400));
  }

  const threads = getUserThreads(userId);
  const initialLength = threads.length;
  const updatedThreads = threads.filter(t => t.id !== conversationId);

  if (updatedThreads.length === initialLength) {
    return next(new AppError('Conversation not found', 404));
  }

  conversationsStore[userId] = updatedThreads;
  saveThreads();
  res.status(200).json({ success: true, message: 'Conversation deleted' });
});

export const logSleep = catchAsync(async (req, res, next) => {
  const { user_id, bedTime, wakeTime, hours, quality, notes, timestamp } = req.body;

  if (!user_id) {
    return next(new AppError('Missing user_id in request body', 400));
  }

  // Calculate hours if missing but bed & wake provided
  let calcHours = hours;
  if (!calcHours && bedTime && wakeTime) {
    const [bH, bM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    if (!isNaN(bH) && !isNaN(wH)) {
      let diff = (wH + (wM || 0) / 60) - (bH + (bM || 0) / 60);
      if (diff <= 0) diff += 24;
      calcHours = parseFloat(diff.toFixed(1));
    }
  }
  calcHours = calcHours || 7.5;

  let calcQuality = quality;
  if (!calcQuality) {
    if (calcHours >= 7 && calcHours <= 9) {
      calcQuality = Math.min(95, Math.round(80 + (calcHours - 7) * 7.5));
    } else if (calcHours < 7) {
      calcQuality = Math.max(45, Math.round((calcHours / 7) * 75));
    } else {
      calcQuality = Math.max(65, Math.round(90 - (calcHours - 9) * 10));
    }
  }

  const entry = {
    id: `sleep_${Date.now()}`,
    bedTime: bedTime || '23:30',
    wakeTime: wakeTime || '07:00',
    hours: calcHours,
    quality: Math.min(100, Math.max(10, Math.round(calcQuality))),
    notes: notes || null,
    timestamp: timestamp || new Date().toISOString()
  };

  const history = getSleepHistory(user_id);
  const updated = [entry, ...history].slice(0, 100);
  sleepStore[user_id] = updated;
  saveJSON(SLEEP_FILE, sleepStore);

  // Sync with logsStore for companion context & daily tracking
  const logHistory = getLogsHistory(user_id);
  const todayDate = new Date().toISOString().split('T')[0];
  const existingTodayLogIndex = logHistory.findIndex(l => (l.timestamp || '').startsWith(todayDate));

  if (existingTodayLogIndex >= 0) {
    logHistory[existingTodayLogIndex].sleep_hours = calcHours;
  } else {
    logHistory.unshift({
      mood_score: null,
      sleep_hours: calcHours,
      notes: `Sleep logged: ${calcHours}h`,
      timestamp: entry.timestamp
    });
  }
  logsStore[user_id] = logHistory.slice(0, 100);
  saveJSON(LOGS_FILE, logsStore);

  res.status(200).json({ success: true, log: entry });
});

export const getSleepLogs = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 30;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const history = getSleepHistory(userId);
  const logs = history.slice(0, limit);

  const totalHours = history.reduce((acc, cur) => acc + (cur.hours || 0), 0);
  const avgHours = history.length > 0 ? parseFloat((totalHours / history.length).toFixed(1)) : 7.5;
  const avgQuality = history.length > 0
    ? Math.round(history.reduce((acc, cur) => acc + (cur.quality || 80), 0) / history.length)
    : 84;

  res.status(200).json({
    logs,
    stats: {
      avgHours,
      avgQuality,
      totalNights: history.length,
      latest: logs[0] || null
    }
  });
});

export const saveReflection = catchAsync(async (req, res, next) => {
  const { user_id, text, prompt } = req.body;

  if (!user_id || !text) {
    return next(new AppError('Missing user_id or text in request body', 400));
  }

  const entry = {
    id: `refl_${Date.now()}`,
    text,
    prompt: prompt || null,
    timestamp: new Date().toISOString()
  };

  const history = getReflectionsHistory(user_id);
  reflectionsStore[user_id] = [entry, ...history].slice(0, 100);
  saveJSON(REFLECTIONS_FILE, reflectionsStore);

  res.status(200).json({ success: true, reflection: entry });
});

export const getStats = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const logs = getLogsHistory(userId);
  const sleep = getSleepHistory(userId);
  const threads = getUserThreads(userId);
  const reflections = getReflectionsHistory(userId);

  // Load assessments
  let userAssessments = [];
  try {
    if (fs.existsSync(ASSESSMENTS_FILE)) {
      const allAssessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
      userAssessments = allAssessments.filter(a => a.user_id === userId);
    }
  } catch (e) {}

  // 1. Calculate Streak
  const activeDates = new Set();
  const addDate = (ts) => {
    if (ts) activeDates.add(new Date(ts).toISOString().split('T')[0]);
  };

  logs.forEach(l => addDate(l.timestamp));
  sleep.forEach(s => addDate(s.timestamp));
  threads.forEach(t => {
    addDate(t.updatedAt);
    (t.messages || []).forEach(m => addDate(m.timestamp));
  });
  reflections.forEach(r => addDate(r.timestamp));
  userAssessments.forEach(a => addDate(a.created_at));

  let streak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  let checkDate = new Date(today);
  if (!activeDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDates.has(checkDate.toISOString().split('T')[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  if (streak === 0 && activeDates.size > 0) streak = 1;

  // 2. Total Sessions
  const totalSessions = logs.length + sleep.length + threads.length + userAssessments.length + reflections.length;

  // 3. Tasks completed today
  const hasMoodToday = logs.some(l => (l.timestamp || '').startsWith(todayStr) && l.mood_score != null);
  const hasSleepToday = sleep.some(s => (s.timestamp || '').startsWith(todayStr));
  const hasReflToday = reflections.some(r => (r.timestamp || '').startsWith(todayStr));
  const tasksCompletedCount = (hasMoodToday ? 1 : 0) + (hasSleepToday ? 1 : 0) + (hasReflToday ? 1 : 0);
  const tasksString = `${tasksCompletedCount}/3`;

  // 4. Latest Log
  const latestMoodLog = logs.find(l => l.mood_score != null) || null;
  const latestSleepLog = sleep[0] || null;
  const latestLog = {
    mood_score: latestMoodLog?.mood_score || (logs[0]?.mood_score) || 7,
    sleep_hours: latestSleepLog?.hours || logs[0]?.sleep_hours || 7.5,
    notes: latestMoodLog?.notes || logs[0]?.notes || null,
    timestamp: logs[0]?.timestamp || null
  };

  // 5. Weekly Mood (7 points for Mon..Sun or past 7 days)
  const weeklyMood = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const logForDay = logs.find(l => (l.timestamp || '').startsWith(dStr) && l.mood_score != null);
    if (logForDay) {
      weeklyMood.push(logForDay.mood_score);
    } else {
      weeklyMood.push(latestLog.mood_score || 7);
    }
  }

  // 6. Recent activities
  const activities = [];
  userAssessments.slice(0, 3).forEach(a => {
    activities.push({
      type: 'assessment',
      title: a.questionnaire || 'Avaliação',
      text: `${a.questionnaire} Score: ${a.total_score}`,
      time: a.created_at,
      color: '#8b5cf6'
    });
  });

  sleep.slice(0, 2).forEach(s => {
    activities.push({
      type: 'sleep',
      title: 'Sleep Tracked',
      text: `${s.hours}h logged · ${s.quality}% quality`,
      time: s.timestamp,
      color: '#5B8AF0'
    });
  });

  threads.slice(0, 2).forEach(t => {
    activities.push({
      type: 'chat',
      title: 'Companion Session',
      text: t.title || 'Chat',
      time: t.updatedAt,
      color: '#06b6d4'
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  res.status(200).json({
    streak,
    sessions: totalSessions,
    tasks: tasksString,
    dailyTasks: {
      mood: hasMoodToday,
      sleep: hasSleepToday,
      reflection: hasReflToday,
    },
    latestLog,
    weeklyMood,
    recentActivities: activities.slice(0, 6),
    latestReflection: reflections[0]?.text || ''
  });
});
