export const getLibraryContent = (req, res) => {
  const content = {
    meditations: {
      box_breathing: {
        name: 'Box Breathing (4-4-4-4)',
        description: 'A simple exercise to calm your nervous system.',
        audioUrl: '/audio/balance.mp3',
        steps: [
          'Exhale all the air from your lungs through your mouth.',
          'Slowly breathe in through your nose, counting to 4.',
          'Hold your breath, counting to 4.',
          'Slowly exhale through your mouth, counting to 4.',
          'Hold your breath again, counting to 4.',
          'Repeat for 4 cycles or until you feel calmer.'
        ],
        source: 'Mayo Clinic'
      },
      '478_breathing': {
        name: '4-7-8 Breathing Technique',
        description: 'Deep breathing that reduces anxiety and slows your body down.',
        steps: [
          'Exhale completely through your mouth, making a soft "whoosh" sound.',
          'Close your mouth and breathe in through your nose, counting to 4.',
          'Hold your breath, counting to 7.',
          'Exhale completely through your mouth, counting to 8.',
          'Repeat the cycle three more times, for a total of four full breaths.'
        ],
        source: 'Harvard Health'
      },
      body_scan: {
        name: 'Progressive Body Scan',
        description: 'Mindfulness practice to notice physical sensations and relax.',
        audioUrl: '/audio/focus.mp3',
        steps: [
          'Sit or lie down comfortably. Close your eyes.',
          'Start at your toes and notice any tension or sensation.',
          'Move your attention to your feet, ankles, legs, and knees.',
          'Move up to your thighs, hips, and lower back.',
          'Now notice your chest, shoulders, arms, and hands.',
          'Finally, feel your neck, jaw, and forehead. Let the tension dissolve.'
        ],
        source: 'Mayo Clinic'
      },
      '54321_grounding': {
        name: '5-4-3-2-1 Grounding Method',
        description: 'Helps calm anxiety by focusing on the present moment.',
        steps: [
          'Identify 5 things you can see around you.',
          'Identify 4 things you can touch.',
          'Identify 3 sounds you hear.',
          'Identify 2 smells you notice.',
          'Identify 1 taste or something you can taste.'
        ],
        source: 'Mayo Clinic Health System'
      }
    },
    sleep_methods: {
      military_method: {
        name: 'Military Sleep Method',
        description: 'Technique to fall asleep quickly with body and mental relaxation.',
        audioUrl: '/audio/sleep.mp3',
        steps: [
          'Relax your entire face, including forehead, eyelids, jaw, and tongue.',
          'Drop your shoulders as much as possible. Relax your upper and lower arms.',
          'Exhale and relax your chest.',
          'Relax your legs, thighs, calves, ankles, and feet.',
          'Clear your mind for 10 seconds by imagining a calm scene, like a still lake.',
          'If thoughts arise, tell yourself "do not think, do not think, do not think" for 10 seconds.'
        ],
        source: 'Sleep Foundation'
      },
      stimulus_control: {
        name: 'Stimulus Control Therapy',
        description: 'Strategies to strengthen the association between bed and sleep.',
        steps: [
          'Use your bed only for sleep and intimacy. Do not work or watch TV in bed.',
          'Go to bed only when you are actually sleepy.',
          'If you don\'t fall asleep in 20 minutes, get up and move to another room.',
          'Do a quiet activity, such as reading, until you feel sleepy again.',
          'Maintain a consistent wake time every day.'
        ],
        source: 'Mayo Clinic'
      }
    }
  };

  res.status(200).json(content);
};

