const QUESTIONNAIRES = {
  'PHQ-9': {
    id: 'PHQ-9',
    en: {
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
    pt: {
      name: 'PHQ-9: Questionário de Saúde do Paciente',
      description: 'Uma ferramenta breve de rastreio para a gravidade da depressão.',
      questions: [
        'Tem sentido pouco interesse ou prazer em fazer coisas que normalmente aprecia?',
        'Tem-se sentido em baixo, deprimido ou sem esperança ultimamente?',
        'Como tem estado o seu sono? Tem tido dificuldade em dormir ou sentido necessidade de dormir em excesso?',
        'Tem-se sentido muito cansado ou notado que a sua energia está mais baixa do que o normal?',
        'Notou alterações no apetite, comendo muito menos ou muito mais do que o habitual?',
        'Tem sido duro consigo mesmo, sentindo-se um fracasso ou que desiludiu as pessoas que ama?',
        'Tem tido dificuldade em concentrar-se em atividades simples, como ler ou ver televisão?',
        'Notou que o seu corpo se move ou fala mais devagar, ou o oposto - sentindo-se agitado e inquieto?',
        'Teve pensamentos de que seria melhor não estar aqui, ou pensamentos de se magoar?'
      ],
      options: [
        { text: 'Nenhum dia', value: 0 },
        { text: 'Vários dias', value: 1 },
        { text: 'Mais da metade dos dias', value: 2 },
        { text: 'Quase todos os dias', value: 3 }
      ]
    }
  },
  'GAD-7': {
    id: 'GAD-7',
    en: {
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
    pt: {
      name: 'GAD-7: Escala de Ansiedade Generalizada',
      description: 'Uma ferramenta breve de rastreio para a gravidade da ansiedade.',
      questions: [
        'Tem sentido uma constante sensação de ansiedade e tensão?',
        'Tem tido dificuldade em desligar os pensamentos ou controlar a preocupação?',
        'Tem-se preocupado excessivamente com várias questões do dia-a-dia ao mesmo tempo?',
        'Tem tido dificuldade em relaxar ou ter um momento de verdadeira calma para si?',
        'Tem sentido inquietação no corpo, sendo muito difícil estar quieto ou sentir-se calmo?',
        'Notou que tem estado menos paciente do que o normal, irritando-se com facilidade?',
        'Experienciou um medo repentino ou um sentimento de alarme, como se algo muito mau fosse acontecer?'
      ],
      options: [
        { text: 'Nunca', value: 0 },
        { text: 'Vários dias', value: 1 },
        { text: 'Mais da metade dos dias', value: 2 },
        { text: 'Quase todos os dias', value: 3 }
      ]
    }
  },
  'WHO-5': {
    id: 'WHO-5',
    en: {
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
    pt: {
      name: 'WHO-5: Índice de Bem-Estar',
      description: 'Uma avaliação breve do bem-estar subjetivo atual.',
      questions: [
        'Tem-se sentido alegre, bem e de bom humor ultimamente?',
        'Com que frequência se sentiu calmo, pacífico e relaxado?',
        'Tem-se sentido enérgico, ativo e cheio de vigor para realizar as suas tarefas?',
        'Quando acorda, sente que teve um sono reparador e que está verdadeiramente descansado?',
        'Sente que o seu dia está cheio de coisas e atividades que despertam o seu interesse?'
      ],
      options: [
        { text: 'O tempo todo', value: 5 },
        { text: 'A maior parte do tempo', value: 4 },
        { text: 'Mais da metade do tempo', value: 3 },
        { text: 'Menos da metade do tempo', value: 2 },
        { text: 'Parte do tempo', value: 1 },
        { text: 'Nunca', value: 0 }
      ]
    }
  },
  'PSS-10': {
    id: 'PSS-10',
    en: {
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
    },
    pt: {
      name: 'PSS-10: Escala de Stress Percebido',
      description: 'Uma avaliação breve do stress percecionado nas últimas semanas.',
      questions: [
        'Tem sido afetado ou abalado por coisas inesperadas que aconteceram recentemente?',
        'Com que frequência sentiu que não tinha controlo sobre o que realmente importa na sua vida?',
        'Tem-se sentido muito nervoso ou "sob pressão" ultimamente?',
        'Com que frequência se sentiu confiante na sua capacidade de lidar com os seus problemas pessoais?',
        'Tem sentido que as coisas estão a correr como gostaria ou como planeou?',
        'Com que frequência sentiu que não conseguia lidar com todas as tarefas e responsabilidades que tinha a fazer?',
        'Tem sido capaz de controlar as suas irritações e pequenas frustrações do dia-a-dia?',
        'Com que frequência sentiu que tinha tudo sob controlo e que as coisas corriam bem?',
        'Sentiu-se furioso ou muito irritado devido a coisas que estavam completamente fora do seu controlo?',
        'Com que frequência sentiu que as dificuldades se acumulavam tanto que não conseguia superá-las?'
      ],
      options: [
        { text: 'Nunca', value: 0 },
        { text: 'Quase nunca', value: 1 },
        { text: 'Às vezes', value: 2 },
        { text: 'Frequentemente', value: 3 },
        { text: 'Muito frequentemente', value: 4 }
      ]
    }
  }
};

const buildLocalizedObj = (qId, lang = 'pt') => {
  const q = QUESTIONNAIRES[qId];
  const langData = q[lang] || q['en'];
  return { id: q.id, ...langData };
};

const listQuestionnaires = (lang = 'pt') =>
  Object.keys(QUESTIONNAIRES).map(id => {
    const { name, description } = buildLocalizedObj(id, lang);
    return { id, name, description };
  });

const getQuestionnaire = (id, lang = 'pt') => {
  if (!id) return null;
  const qId = id.toUpperCase();
  if (!QUESTIONNAIRES[qId]) return null;
  return buildLocalizedObj(qId, lang);
};

export { QUESTIONNAIRES, listQuestionnaires, getQuestionnaire };
