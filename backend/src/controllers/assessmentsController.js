import { getQuestionnaire } from '../data/questionnaires.js';
import { catchAsync } from '../utils/catchAsync.js';
import { randomUUID } from 'node:crypto';
import { checked, wellness } from '../services/wellnessService.js';
import { generateText } from '../services/geminiService.js';

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

const summaryLanguages = {
  pt: { name: 'Portuguese', fallback: 'Obrigado por completar a avaliação. Os seus resultados foram registados para acompanhar o seu bem-estar.' },
  en: { name: 'English', fallback: 'Thank you for completing the assessment. Your results were saved to help you track your wellbeing.' },
  es: { name: 'Spanish', fallback: 'Gracias por completar la evaluación. Sus resultados se han guardado para ayudarle a seguir su bienestar.' },
  fr: { name: 'French', fallback: 'Merci d’avoir terminé l’évaluation. Vos résultats ont été enregistrés pour vous aider à suivre votre bien-être.' },
  de: { name: 'German', fallback: 'Vielen Dank, dass Sie die Bewertung abgeschlossen haben. Ihre Ergebnisse wurden gespeichert, damit Sie Ihr Wohlbefinden verfolgen können.' },
};

const generateAISummary = async (questionnaireName, riskLevel, score, answers, questions, language) => {
    try {
        const answersText = answers.map((a, i) => `Q: ${questions[i]}\nA: ${a}`).join('\n');
        const prompt = `The user just completed the ${questionnaireName} assessment.
Their total score is ${score}, which corresponds to the application's "${riskLevel}" screening category.

Questions and selected answers:
${answersText}

Write a short, compassionate analysis (3-4 sentences) addressed directly to the user. Do not diagnose, claim that professional support is unnecessary, or make an emergency assessment. Encourage seeking qualified support if they are concerned or their answers indicate high risk.`;
        const systemInstruction = `You are AURA, an empathetic wellbeing assistant. Write the entire response only in ${summaryLanguages[language].name}. The requested language takes precedence over the language of any quoted questionnaire text. Do not provide a medical diagnosis.`;

        const result = await generateText({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction,
            maxOutputTokens: 512,
        });
        return result.text;
    } catch (e) {
        console.error('Failed to generate AI summary:', e);
    }
    return null;
};

export const submitAssessment = catchAsync(async (req, res) => {
  const { user_id, questionnaire_id, answers, language = 'pt' } = req.body;
  if (!user_id || !questionnaire_id || !Array.isArray(answers)) {
    return res.status(400).json({ status: 'fail', message: 'Missing required fields' });
  }
  if (!Object.hasOwn(summaryLanguages, language)) {
    return res.status(400).json({ status: 'fail', message: 'Unsupported assessment language' });
  }

  const questionnaire = getQuestionnaire(questionnaire_id, language);
  if (!questionnaire) {
    return res.status(404).json({ status: 'fail', message: 'Questionnaire not found' });
  }

  if (answers.length !== questionnaire.questions.length) {
    return res.status(400).json({ status: 'fail', message: `Expected ${questionnaire.questions.length} answers, got ${answers.length}` });
  }

  if (answers.some(value => !Number.isInteger(value) || !questionnaire.options.some(option => option.value === value))) {
    return res.status(400).json({ status: 'fail', message: 'Invalid answer value' });
  }
  const score_data = scoreAssessment(questionnaire.id, answers);
  
  // Format answers for AI
  const formattedAnswers = answers.map(val => {
    const opt = questionnaire.options.find(o => o.value === val);
    return opt ? opt.text : val;
  });

  let ai_summary = await generateAISummary(questionnaire.name, score_data.risk_level, score_data.total_score, formattedAnswers, questionnaire.questions, language);
  if (!ai_summary) {
    ai_summary = summaryLanguages[language].fallback;
  }

  const assessment = {
    id: randomUUID(),
    user_id: req.user.id,
    questionnaire: questionnaire.id,
    answers,
    total_score: score_data.total_score,
    risk_level: score_data.risk_level,
    ai_summary,
    created_at: new Date().toISOString()
  };
  await checked(req.supabase.from('assessments').insert(assessment));

  return res.status(201).json({ assessment, score_data, ai_summary: assessment.ai_summary });
});

export const getAssessmentHistory = catchAsync(async (req, res) => {
  const assessments = await wellness(req.supabase, req.user.id).assessments();
  res.status(200).json({ assessments });
});
