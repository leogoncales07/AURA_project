import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

const conversationsByUser = new Map();
const logsByUser = new Map();

// Simple language detection
const detectLanguage = (text) => {
  const portugueseWords = /\b(olá|oi|como|está|você|para|uma|que|não|sim|obrigado|porém|também|podem)\b/i;
  const englishWords = /\b(hello|hi|how|are|you|thank|why|what|can|would|could|should)\b/i;
  
  const ptMatches = (text.match(portugueseWords) || []).length;
  const enMatches = (text.match(englishWords) || []).length;
  
  return ptMatches > enMatches ? 'pt' : 'en';
};

const getConversationHistory = (userId) => {
  return conversationsByUser.get(userId) || [];
};

const getLogsHistory = (userId) => {
  return logsByUser.get(userId) || [];
};

const createAssistantReply = async (message, userId) => {
  try {
    const language = detectLanguage(message);
    const history = getConversationHistory(userId);
    
    // Try Google Gemini API first
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.G_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: language === 'pt'
                ? `Você é um companheiro empático para bem-estar mental. Responda em português, com máx 3-4 frases. Seja caloroso, reflexivo e validador.\n\nMensagem do usuário: ${message}`
                : `You are an empathetic mental wellness companion. Respond in English, max 3-4 sentences. Be warm, reflective, and validating.\n\nUser message: ${message}`
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
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
  const { user_id, message } = req.body;

  if (!user_id) {
    return next(new AppError('Missing user_id in request body', 400));
  }
  if (!message) {
    return next(new AppError('Missing message in request body', 400));
  }

  const responseText = await createAssistantReply(message, user_id);
  const timestamp = new Date().toISOString();

  const history = getConversationHistory(user_id);
  const updatedHistory = [
    ...history,
    { role: 'user', message, timestamp },
    { role: 'assistant', message: responseText, timestamp }
  ].slice(-50);

  conversationsByUser.set(user_id, updatedHistory);

  res.status(200).json({ response: responseText, conversation: updatedHistory });
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

  logsByUser.set(user_id, updatedLogs);

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
  const limit = parseInt(req.query.limit, 10) || 50;

  if (!userId) {
    return next(new AppError('Missing userId parameter', 400));
  }

  const conversations = getConversationHistory(userId).slice(-limit).reverse();
  res.status(200).json({ conversations });
});
