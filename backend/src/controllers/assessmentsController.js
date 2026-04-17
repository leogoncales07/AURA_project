import { getQuestionnaire } from '../data/questionnaires.js';

const assessmentStore = [];

const scorePHQ9 = (answers) => {
  const total = answers.reduce((sum, value) => sum + value, 0);
  let risk = 'low';
  if (total >= 20) risk = 'critical';
  else if (total >= 15) risk = 'high';
  else if (total >= 10) risk = 'moderate';
  return { total_score: total, risk_level: risk };
};

const scoreGAD7 = (answers) => {
  const total = answers.reduce((sum, value) => sum + value, 0);
  let risk = 'low';
  if (total >= 15) risk = 'high';
  else if (total >= 10) risk = 'moderate';
  return { total_score: total, risk_level: risk };
};

const scoreWHO5 = (answers) => {
  const raw_total = answers.reduce((sum, value) => sum + value, 0);
  const percentage = raw_total * 4;
  let risk = 'low';
  if (percentage <= 28) risk = 'high';
  else if (percentage <= 50) risk = 'moderate';
  return { total_score: percentage, raw_score: raw_total, risk_level: risk };
};

const scorePSS10 = (answers) => {
  const reversedIndices = [3, 4, 6, 7];
  const total = answers.reduce((sum, value, index) => {
    return sum + (reversedIndices.includes(index) ? 4 - value : value);
  }, 0);
  let risk = 'low';
  if (total >= 27) risk = 'high';
  else if (total >= 14) risk = 'moderate';
  return { total_score: total, risk_level: risk };
};

const scoreAssessment = (questionnaireId, answers) => {
  const id = questionnaireId.toUpperCase();
  if (id === 'PHQ-9') return scorePHQ9(answers);
  if (id === 'GAD-7') return scoreGAD7(answers);
  if (id === 'WHO-5') return scoreWHO5(answers);
  if (id === 'PSS-10') return scorePSS10(answers);
  return { total_score: answers.reduce((sum, value) => sum + value, 0), risk_level: 'unknown' };
};

const generateAISummary = async (questionnaireName, riskLevel, score, answers, questions) => {
    try {
        const answersText = answers.map((a, i) => `Q: ${questions[i]}\nA: ${a}`).join('\n');
        const systemPrompt = `[System Instruction: You are the 'AURA Clinical AI', an empathetic and professional assistant analyzing a user's mental health assessment.
The user just completed the ${questionnaireName} assessment.
Their total score is ${score}, which indicates a "${riskLevel}" risk level.

Here are their responses:
${answersText}

Write a short, compassionate, and professional analysis (max 3-4 sentences) responding directly to the user addressing them as "você" (in Portuguese) or "you" (if English). Don't give a medical diagnosis, but validate their feelings based on their answers and recommend taking care of their mental health or seeking professional help if the risk is High or Severe. Respond in the same language as the questionnaire phrases above.]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.G_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
                ],
                generationConfig: { temperature: 0.6, maxOutputTokens: 1000 }
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        }
    } catch (e) {
        console.error('Failed to generate AI summary:', e);
    }
    return null;
};

export const submitAssessment = async (req, res) => {
  const { user_id, questionnaire_id, answers } = req.body;
  if (!user_id || !questionnaire_id || !Array.isArray(answers)) {
    return res.status(400).json({ status: 'fail', message: 'Missing required fields' });
  }

  const questionnaire = getQuestionnaire(questionnaire_id);
  if (!questionnaire) {
    return res.status(404).json({ status: 'fail', message: 'Questionnaire not found' });
  }

  if (answers.length !== questionnaire.questions.length) {
    return res.status(400).json({ status: 'fail', message: `Expected ${questionnaire.questions.length} answers, got ${answers.length}` });
  }

  const score_data = scoreAssessment(questionnaire.id, answers);
  
  // Format answers for AI
  const formattedAnswers = answers.map(val => {
    const opt = questionnaire.options.find(o => o.value === val);
    return opt ? opt.text : val;
  });

  let ai_summary = await generateAISummary(questionnaire.name, score_data.risk_level, score_data.total_score, formattedAnswers, questionnaire.questions);
  if (!ai_summary) {
    ai_summary = "Obrigado por completar a avaliação. Os seus resultados foram registados para ajudar no acompanhamento do seu bem-estar. / Thank you for completing the assessment.";
  }

  const assessment = {
    id: `assess_${Date.now()}`,
    user_id,
    questionnaire: questionnaire.id,
    answers,
    total_score: score_data.total_score,
    risk_level: score_data.risk_level,
    ai_summary,
    created_at: new Date().toISOString()
  };
  assessmentStore.push(assessment);

  return res.status(201).json({ assessment, score_data, ai_summary: assessment.ai_summary });
};

export const getAssessmentHistory = (req, res) => {
  const { userId } = req.params;
  const history = assessmentStore
    .filter((item) => item.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return res.status(200).json({ assessments: history });
};
