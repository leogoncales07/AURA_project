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

export const submitAssessment = (req, res) => {
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
  const assessment = {
    id: `assess_${Date.now()}`,
    user_id,
    questionnaire: questionnaire.id,
    answers,
    total_score: score_data.total_score,
    risk_level: score_data.risk_level,
    ai_summary: `This is a sample summary for ${questionnaire.name}.`,
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
