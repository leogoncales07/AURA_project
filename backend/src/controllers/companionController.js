import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { checked, wellness } from '../services/wellnessService.js';
import { generateText } from '../services/geminiService.js';

const store = (req) => wellness(req.supabase, req.user.id);
const limitFor = (req, fallback) => Math.max(1, Math.min(10000, Number.parseInt(req.query.limit, 10) || fallback));

// Language detection
const detectLanguage = (text) => {
  const portugueseWords = /\b(olá|oi|como|está|você|para|uma|que|não|sim|obrigado|porém|também|podem|estou|triste|feliz|ansioso|medo|ajuda|quero|preciso|muito|pouco|bem|mal|hoje|agora|eu|ele|ela|nós)\b/gmi;
  const englishWords = /\b(hello|hi|how|are|you|thank|why|what|can|would|could|should|sad|happy|anxious|help|want|need|very|little|good|bad|today|now|i|he|she|we)\b/gmi;
  const ptMatches = (text.match(portugueseWords) || []).length;
  const enMatches = (text.match(englishWords) || []).length;
  return ptMatches >= enMatches ? 'pt' : 'en';
};

const createAssistantReply = async (message, recentLogs, history, languageOverride = null) => {
  try {
    const language = languageOverride || detectLanguage(message);
    
    // Format the user's personal context
    let logsContext = "The user has not logged any mood or sleep data yet. Encourage them to use the daily tracker in the dashboard.";
    if (recentLogs.length > 0) {
      const formattedLogs = recentLogs.map((log, index) => 
        `- [Log ${index + 1} from today/past] Mood Score: ${log.mood_score}/10 | Sleep: ${log.sleep_hours}h | Notes: ${log.notes || 'None'}`
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

      const result = await generateText({
        contents: [...formattedHistory, { role: 'user', parts: [{ text: systemPrompt }] }],
        maxOutputTokens: 512,
        temperature: 0.7,
      });
      if (result.text) return result.text;
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
  const { message, conversation_id, language } = z.object({
    message: z.string().trim().min(1).max(6000),
    conversation_id: z.string().uuid().nullish(),
    language: z.enum(['pt', 'en', 'es', 'fr', 'de']).optional(),
  }).parse(req.body);
  const user_id = req.user.id;

  if (!user_id || !message) {
    return next(new AppError('Missing user_id or message', 400));
  }

  const threads = await store(req).threads();
  let thread = null;

  if (conversation_id) {
    thread = threads.find(t => t.id === conversation_id);
  }

  if (conversation_id && !thread) return next(new AppError('Conversation not found', 404));
  if (!thread) {
    thread = {
      id: randomUUID(),
      title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    threads.unshift(thread);
  }

  const recentLogs = await store(req).logs(5);
  const responseText = await createAssistantReply(message, recentLogs, thread.messages.slice(-50), language);
  const timestamp = new Date().toISOString();

  thread.messages.push({ role: 'user', message, timestamp });
  thread.messages.push({ role: 'assistant', message: responseText, timestamp });
  thread.updatedAt = timestamp;

  if (thread.messages.length > 50) {
    thread.messages = thread.messages.slice(-50);
  }

  await checked(req.supabase.from('conversations').insert([
    { user_id: req.user.id, agent_type: 'CompanionBot', conversation_id: thread.id, title: thread.title, role: 'user', message, created_at: timestamp },
    { user_id: req.user.id, agent_type: 'CompanionBot', conversation_id: thread.id, title: thread.title, role: 'assistant', message: responseText, created_at: new Date(Date.now() + 1).toISOString() },
  ]));
  res.status(200).json({ response: responseText, conversation_id: thread.id, messages: thread.messages });
});

export const logMood = catchAsync(async (req, res) => {
  const input = z.object({
    mood_score: z.number().int().min(1).max(10).nullish(),
    sleep_hours: z.number().min(0).max(24).nullish(),
    notes: z.string().max(4000).nullish(),
  }).refine(value => value.mood_score != null || value.sleep_hours != null, 'Provide mood or sleep').parse(req.body);
  const log = await store(req).logMood(input);
  res.status(200).json({ success: true, log });
});

export const getLogs = catchAsync(async (req, res) => {
  res.json({ logs: await store(req).logs(limitFor(req, 14)) });
});

export const getConversations = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const threads = await store(req).threads();
  const metadata = threads.map(t => ({ id: t.id, title: t.title, updatedAt: t.updatedAt }));
  res.status(200).json({ conversations: metadata });
});

export const getConversationMessages = catchAsync(async (req, res, next) => {
  const { userId, conversationId } = req.params;

  if (!userId || !conversationId) {
    return next(new AppError('Missing parameters', 400));
  }

  const threads = await store(req).threads();
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

  const deleted = await checked(req.supabase.from('conversations').delete()
    .eq('user_id', req.user.id).eq('conversation_id', conversationId).select('id'));
  if (!deleted.length) return next(new AppError('Conversation not found', 404));
  res.status(200).json({ success: true, message: 'Conversation deleted' });
});

export const logSleep = catchAsync(async (req, res, next) => {
  const { bedTime, wakeTime, hours, quality, notes } = z.object({
    bedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    wakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    hours: z.number().gt(0).max(24).optional(),
    quality: z.number().min(0).max(100).optional(),
    notes: z.string().max(4000).nullish(),
  }).refine(value => value.hours != null || (value.bedTime && value.wakeTime), 'Provide sleep duration or bed and wake times').parse(req.body);
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

  const entry = {
    id: randomUUID(),
    bedTime: bedTime || '23:30',
    wakeTime: wakeTime || '07:00',
    hours: calcHours,
    quality: quality == null ? null : Math.round(quality),
    notes: notes || null,
    timestamp: new Date().toISOString()
  };

  const log = await store(req).logSleep(entry);
  res.status(200).json({ success: true, log });
});

export const getSleepLogs = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const limit = limitFor(req, 30);

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const history = await store(req).sleep();
  const logs = history.slice(0, limit);

  const totalHours = history.reduce((acc, cur) => acc + (cur.hours || 0), 0);
  const avgHours = history.length > 0 ? parseFloat((totalHours / history.length).toFixed(1)) : null;
  const rated = history.filter(log => log.quality != null);
  const avgQuality = rated.length ? Math.round(rated.reduce((sum, log) => sum + log.quality, 0) / rated.length) : null;

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
  const input = z.object({ text: z.string().trim().min(1).max(6000), prompt: z.string().max(1000).nullish() }).parse(req.body);
  const reflection = await store(req).saveReflection(input);
  res.status(200).json({ success: true, reflection });
});

export const getStats = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const data = store(req);
  const [logs, sleep, threads, reflections, userAssessments] = await Promise.all([
    data.logs(), data.sleep(), data.threads(), data.reflections(), data.assessments(),
  ]);

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
    mood_score: latestMoodLog?.mood_score ?? null,
    sleep_hours: latestSleepLog?.hours ?? logs.find(log => log.sleep_hours != null)?.sleep_hours ?? null,
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
      weeklyMood.push(null);
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
