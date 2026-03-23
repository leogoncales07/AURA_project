"""
Content Library for Evidence-Based Exercises
=============================================
Validated meditation and sleep hygiene methods from reputable sources 
(Mayo Clinic, Harvard Health, Sleep Foundation).
"""

MEDITATION_EXERCISES = {
    "box_breathing": {
        "name": "Box Breathing (4-4-4-4)",
        "description": "A simple technique used by Navy SEALs to calm the nervous system.",
        "steps": [
            "Exhale all air from your lungs through your mouth.",
            "Inhale slowly through your nose for a count of 4.",
            "Hold your breath for a count of 4.",
            "Exhale slowly through your mouth for a count of 4.",
            "Hold your breath again for a count of 4.",
            "Repeat for 4 cycles or until you feel calm."
        ],
        "source": "Mayo Clinic"
    },
    "478_breathing": {
        "name": "4-7-8 Breathing Technique",
        "description": "A natural tranquilizer for the nervous system.",
        "steps": [
            "Exhale completely through your mouth, making a whoosh sound.",
            "Close your mouth and inhale quietly through your nose to a count of 4.",
            "Hold your breath for a count of 7.",
            "Exhale completely through your mouth to a count of 8.",
            "This is one breath. Now inhale again and repeat the cycle three more times for a total of four breaths."
        ],
        "source": "Harvard Health"
    },
    "body_scan": {
        "name": "Progressive Body Scan",
        "description": "Mindfulness practice focusing on physical sensations.",
        "steps": [
            "Lie down or sit comfortably. Close your eyes.",
            "Starting at your toes, notice any tension, tingling, or sensations. Breathe into them.",
            "Slowly move your attention to your feet, ankles, calves, and knees.",
            "Move up to your thighs, hips, and lower back.",
            "Notice your chest, shoulders, arms, and hands.",
            "Finally, focus on your neck, jaw, and forehead. Let all tension melt away."
        ],
        "source": "Mayo Clinic"
    },
    "54321_grounding": {
        "name": "5-4-3-2-1 Grounding Method",
        "description": "Helps ease anxiety by reconnecting with the present moment.",
        "steps": [
            "Acknowledge 5 things you see around you.",
            "Acknowledge 4 things you can touch near you.",
            "Acknowledge 3 things you hear.",
            "Acknowledge 2 things you can smell.",
            "Acknowledge 1 thing you can taste."
        ],
        "source": "Mayo Clinic Health System"
    }
}

SLEEP_METHODS = {
    "military_method": {
        "name": "The Military Sleep Method",
        "description": "Developed to help soldiers fall asleep in under 2 minutes.",
        "steps": [
            "Relax your entire face—forehead, eyelids, jaw, and tongue.",
            "Drop your shoulders as low as possible. Relax your upper and lower arms.",
            "Exhale and relax your chest.",
            "Relax your legs—thighs, calves, ankles, and feet.",
            "Clear your mind for 10 seconds by picturing a calm scene (like a canoe on a still lake).",
            "If thoughts intrude, repeat 'don't think, don't think, don't think' for 10 seconds."
        ],
        "source": "Sleep Foundation"
    },
    "stimulus_control": {
        "name": "Stimulus Control Therapy",
        "description": "Principles to strengthen the association between bed and sleep.",
        "steps": [
            "Use the bed only for sleep and intimacy. No working or watching TV in bed.",
            "Go to bed only when you are actually sleepy.",
            "If you don't fall asleep within 20 minutes, get out of bed and go to another room.",
            "Engage in a quiet activity (like reading) until you feel sleepy, then return.",
            "Keep a consistent wake-up time every day, regardless of how much you slept."
        ],
        "source": "Mayo Clinic"
    }
}
