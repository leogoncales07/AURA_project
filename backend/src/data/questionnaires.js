const QUESTIONNAIRES = {
  'PHQ-9': {
    id: 'PHQ-9',
    name: 'PHQ-9: Patient Health Questionnaire',
    description: 'A brief screening tool for depression severity.',
    questions: [
      'Have you felt little interest or pleasure in doing things that you normally enjoy?',
      'Have you been feeling down, depressed, or hopeless lately?',
      'How has your sleep been? Have you had difficulty sleeping or felt the need to sleep too much?',
      'Have you been feeling very tired or noticed that your energy is lower than usual?',
      'Have you noticed changes in your appetite, such as eating much less or much more than usual?',
      'Have you been hard on yourself, feeling like a failure or that you\'ve disappointed people you love?',
      'Have you had difficulty focusing on simple activities, like reading or watching TV?',
      'Have you noticed your body moving more slowly or speaking more slowly, or the opposite - feeling agitated and restless?',
      'Have you had thoughts that it would be better if you weren\'t here, or thoughts of hurting yourself?'
    ],
    options: [
      { text: 'Not at all', value: 0 },
      { text: 'Several days', value: 1 },
      { text: 'More than half the days', value: 2 },
      { text: 'Nearly every day', value: 3 }
    ]
  },
  'GAD-7': {
    id: 'GAD-7',
    name: 'GAD-7: Generalized Anxiety Disorder Scale',
    description: 'A brief screening tool for anxiety severity.',
    questions: [
      'Have you felt a constant sense of anxiety and tension?',
      'Have you found it difficult to turn off your thoughts or control how much worry comes to your mind?',
      'Have you been excessively worried about various different everyday issues at the same time?',
      'Have you had difficulty relaxing or having a moment of true calm for yourself?',
      'Have you felt restlessness in your body, making it very difficult to sit still or feel settled?',
      'Have you noticed that you\'ve been less patient than usual, getting annoyed or irritated easily?',
      'Have you experienced a sudden fear or a sense of alarm, as if something very bad was about to happen?'
    ],
    options: [
      { text: 'Never', value: 0 },
      { text: 'Several days', value: 1 },
      { text: 'More than half the days', value: 2 },
      { text: 'Nearly every day', value: 3 }
    ]
  },
  'WHO-5': {
    id: 'WHO-5',
    name: 'WHO-5: Well-Being Index',
    description: 'A brief assessment of current subjective well-being.',
    questions: [
      'Have you been feeling cheerful, well, and in good spirits lately?',
      'How often have you felt calm, peaceful, and relaxed?',
      'Have you been feeling energetic, active, and full of vigor to carry out your tasks?',
      'When you wake up, do you feel that you had refreshing sleep and that you are truly rested?',
      'Do you feel that your day is filled with things and activities that spark your interest?'
    ],
    options: [
      { text: 'All the time', value: 5 },
      { text: 'Most of the time', value: 4 },
      { text: 'More than half the time', value: 3 },
      { text: 'Less than half the time', value: 2 },
      { text: 'Some of the time', value: 1 },
      { text: 'Never', value: 0 }
    ]
  },
  'PSS-10': {
    id: 'PSS-10',
    name: 'PSS-10: Perceived Stress Scale',
    description: 'A brief assessment of perceived stress over the past weeks.',
    questions: [
      'Have you been affected or shaken by unexpected things that happened recently?',
      'How often have you felt that you had no control over things that really mattered in your life?',
      'Have you been feeling very nervous or "under pressure" lately?',
      'How often have you felt confident in your own ability to handle your personal problems?',
      'Have you been feeling that things are going the way you\'d like them to or as you planned?',
      'How often have you felt that you couldn\'t cope with all the tasks and responsibilities you had to do?',
      'Have you been able to control your annoyances and minor frustrations in your day-to-day life?',
      'How often have you felt that you had everything under control and that things were going well?',
      'Have you felt furious or very irritated because of things that were completely beyond your control?',
      'How often have you felt that difficulties were piling up so much that you couldn\'t get over them?'
    ],
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Often', value: 3 },
      { text: 'Very often', value: 4 }
    ]
  }
};

const listQuestionnaires = () => Object.values(QUESTIONNAIRES).map(({ id, name, description }) => ({ id, name, description }));

const getQuestionnaire = (id) => {
  if (!id) return null;
  return QUESTIONNAIRES[id.toUpperCase()] || null;
};

export { QUESTIONNAIRES, listQuestionnaires, getQuestionnaire };
