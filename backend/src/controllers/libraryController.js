export const getLibraryContent = (req, res) => {
  const content = {
    meditations: {
      box_breathing: {
        name: 'Box Breathing (4-4-4-4)',
        description: 'A paced breathing exercise that uses four equal counts.',
        steps: [
          'Exhale all the air from your lungs through your mouth.',
          'Slowly breathe in through your nose, counting to 4.',
          'Hold your breath, counting to 4.',
          'Slowly exhale through your mouth, counting to 4.',
          'Hold your breath again, counting to 4.',
          'Repeat for up to 4 cycles, without forcing any breath hold.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'Royal National Orthopaedic Hospital — Breathing Techniques', url: 'https://www.rnoh.nhs.uk/patients-and-visitors/patient-information-guides/breathing-techniques' }]
      },
      '478_breathing': {
        name: '4-7-8 Breathing Technique',
        description: 'A counted breathing exercise that focuses attention on the breath.',
        steps: [
          'Exhale completely through your mouth, making a soft "whoosh" sound.',
          'Close your mouth and breathe in through your nose, counting to 4.',
          'Hold your breath, counting to 7.',
          'Exhale completely through your mouth, counting to 8.',
          'Repeat the cycle three more times, for a total of four full breaths.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'NHS Every Mind Matters — Meditation and sleep', url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/how-can-meditation-help-with-sleep/' }]
      },
      body_scan: {
        name: 'Progressive Body Scan',
        description: 'A mindfulness practice for noticing physical sensations without needing to change them.',
        steps: [
          'Sit or lie down comfortably. Close your eyes.',
          'Start at your toes and notice any tension or sensation.',
          'Move your attention to your feet, ankles, legs, and knees.',
          'Move up to your thighs, hips, and lower back.',
          'Now notice your chest, shoulders, arms, and hands.',
          'Finally, notice your neck, jaw, and forehead, then return attention to the whole body.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'US Department of Veterans Affairs — Body Scan', url: 'https://www.va.gov/wholehealthlibrary/passport/chapter-4.asp' }]
      },
      '54321_grounding': {
        name: '5-4-3-2-1 Grounding Method',
        description: 'A sensory attention exercise for reconnecting with the present surroundings.',
        steps: [
          'Identify 5 things you can see around you.',
          'Identify 4 things you can touch.',
          'Identify 3 sounds you hear.',
          'Identify 2 smells you notice.',
          'Identify 1 taste or something you can taste.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'Hampshire Hospitals NHS — 5-4-3-2-1 grounding', url: 'https://www.hampshirehospitals.nhs.uk/our-services/az-departments-and-specialties/maternity-hampshire-hospitals/baby-loss-bereavement-support/help-and-support/self-help' }]
      }
    },
    sleep_methods: {
      military_method: {
        name: 'Relaxation for Sleep',
        description: 'A gentle sequence for unwinding before sleep, without promising a specific result.',
        steps: [
          'Choose a comfortable position and let your breathing remain natural.',
          'Notice your face, jaw, and shoulders and soften any effort you can release comfortably.',
          'Move your attention through your arms, hands, legs, and feet without forcing them to relax.',
          'Picture a familiar, peaceful place or return your attention to the sound of your breathing.',
          'If thoughts appear, notice them and gently bring attention back to the exercise.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'NHS — Insomnia and sleep habits', url: 'https://www.nhs.uk/conditions/insomnia/' }]
      },
      stimulus_control: {
        name: 'Sleep Routine and Bed Association',
        description: 'General sleep-habit suggestions for associating bedtime with sleep.',
        steps: [
          'Use your bed only for sleep and intimacy. Do not work or watch TV in bed.',
          'Go to bed only when you are actually sleepy.',
          'If you remain awake for a while, get up and move to another quiet place instead of watching the clock.',
          'Do a quiet activity, such as reading, until you feel sleepy again.',
          'Maintain a consistent wake time every day.'
        ],
        source: 'AURA educational adaptation',
        references: [{ title: 'East London NHS Foundation Trust — CBT for insomnia', url: 'https://www.elft.nhs.uk/sites/default/files/2022-08/cbt-for-insomnia.pdf' }]
      }
    }
  };

  res.status(200).json(content);
};

