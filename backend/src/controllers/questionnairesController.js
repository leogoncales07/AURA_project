import { listQuestionnaires, getQuestionnaire } from '../data/questionnaires.js';

export const getQuestionnaires = (req, res) => {
  const lang = req.query.lang || 'pt'; // default to pt
  const questionnaires = listQuestionnaires(lang);
  return res.status(200).json({ questionnaires });
};

export const getQuestionnaireById = (req, res) => {
  const lang = req.query.lang || 'pt';
  const questionnaire = getQuestionnaire(req.params.qId, lang);
  if (!questionnaire) {
    return res.status(404).json({ status: 'fail', message: 'Questionnaire not found' });
  }
  return res.status(200).json(questionnaire);
};
