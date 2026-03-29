import { listQuestionnaires, getQuestionnaire } from '../data/questionnaires.js';

export const getQuestionnaires = (req, res) => {
  const questionnaires = listQuestionnaires();
  return res.status(200).json({ questionnaires });
};

export const getQuestionnaireById = (req, res) => {
  const questionnaire = getQuestionnaire(req.params.qId);
  if (!questionnaire) {
    return res.status(404).json({ status: 'fail', message: 'Questionnaire not found' });
  }
  return res.status(200).json(questionnaire);
};
