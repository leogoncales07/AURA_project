"""
Mental Health Questionnaires & Scoring
========================================
Definitions and scoring logic for PHQ-9, GAD-7, WHO-5, and PSS.
"""

from typing import List, Dict, Any

class QuestionnaireDefinition:
    def __init__(self, id: str, name: str, description: str, questions: List[str], options: List[Dict[str, Any]]):
        self.id = id
        self.name = name
        self.description = description
        self.questions = questions
        self.options = options

    def score(self, answers: List[int]) -> dict:
        raise NotImplementedError("Subclasses must implement score()")


class PHQ9(QuestionnaireDefinition):
    def __init__(self):
        super().__init__(
            id="PHQ-9",
            name="Patient Health Questionnaire-9",
            description="Screening for depression severity.",
            questions=[
                "1. Little interest or pleasure in doing things",
                "2. Feeling down, depressed, or hopeless",
                "3. Trouble falling or staying asleep, or sleeping too much",
                "4. Feeling tired or having little energy",
                "5. Poor appetite or overeating",
                "6. Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
                "7. Trouble concentrating on things, such as reading the newspaper or watching television",
                "8. Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
                "9. Thoughts that you would be better off dead or of hurting yourself in some way"
            ],
            options=[
                {"text": "Not at all", "value": 0},
                {"text": "Several days", "value": 1},
                {"text": "More than half the days", "value": 2},
                {"text": "Nearly every day", "value": 3}
            ]
        )

    def score(self, answers: List[int]) -> dict:
        total = sum(answers)
        risk = "low"
        if total >= 20: risk = "critical"
        elif total >= 15: risk = "high"
        elif total >= 10: risk = "moderate"
        
        return {"total_score": total, "risk_level": risk}


class GAD7(QuestionnaireDefinition):
    def __init__(self):
        super().__init__(
            id="GAD-7",
            name="Generalized Anxiety Disorder-7",
            description="Screening for anxiety severity.",
            questions=[
                "1. Feeling nervous, anxious or on edge",
                "2. Not being able to stop or control worrying",
                "3. Worrying too much about different things",
                "4. Trouble relaxing",
                "5. Being so restless that it is hard to sit still",
                "6. Becoming easily annoyed or irritable",
                "7. Feeling afraid as if something awful might happen"
            ],
            options=[
                {"text": "Not at all", "value": 0},
                {"text": "Several days", "value": 1},
                {"text": "More than half the days", "value": 2},
                {"text": "Nearly every day", "value": 3}
            ]
        )

    def score(self, answers: List[int]) -> dict:
        total = sum(answers)
        risk = "low"
        if total >= 15: risk = "high"
        elif total >= 10: risk = "moderate"
        elif total >= 5: risk = "low" # mild anxiety is low risk in our MVP
        
        return {"total_score": total, "risk_level": risk}


class WHO5(QuestionnaireDefinition):
    def __init__(self):
        super().__init__(
            id="WHO-5",
            name="WHO (Five) Well-Being Index",
            description="Screening for current mental well-being.",
            questions=[
                "1. I have felt cheerful and in good spirits",
                "2. I have felt calm and relaxed",
                "3. I have felt active and vigorous",
                "4. I woke up feeling fresh and rested",
                "5. My daily life has been filled with things that interest me"
            ],
            options=[
                {"text": "At no time", "value": 0},
                {"text": "Some of the time", "value": 1},
                {"text": "Less than half of the time", "value": 2},
                {"text": "More than half of the time", "value": 3},
                {"text": "Most of the time", "value": 4},
                {"text": "All of the time", "value": 5}
            ]
        )

    def score(self, answers: List[int]) -> dict:
        raw_total = sum(answers)
        percentage = raw_total * 4 # 0-100 scale
        
        risk = "low"
        if percentage <= 28:
            risk = "high" # Indicates likely depression
        elif percentage <= 50:
            risk = "moderate"
        
        return {"total_score": percentage, "raw_score": raw_total, "risk_level": risk}


class PSS(QuestionnaireDefinition):
    def __init__(self):
        super().__init__(
            id="PSS",
            name="Perceived Stress Scale",
            description="Screening for perceived stress.",
            questions=[
                "1. In the last month, how often have you been upset because of something that happened unexpectedly?",
                "2. In the last month, how often have you felt that you were unable to control the important things in your life?",
                "3. In the last month, how often have you felt nervous and 'stressed'?",
                "4. In the last month, how often have you felt confident about your ability to handle your personal problems?",
                "5. In the last month, how often have you felt that things were going your way?",
                "6. In the last month, how often have you found that you could not cope with all the things that you had to do?",
                "7. In the last month, how often have you been able to control irritations in your life?",
                "8. In the last month, how often have you felt that you were on top of things?",
                "9. In the last month, how often have you been angered because of things that were outside of your control?",
                "10. In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?"
            ],
            options=[
                {"text": "Never", "value": 0},
                {"text": "Almost Never", "value": 1},
                {"text": "Sometimes", "value": 2},
                {"text": "Fairly Often", "value": 3},
                {"text": "Very Often", "value": 4}
            ]
        )

    def score(self, answers: List[int]) -> dict:
        # Reverse scoring for questions 4, 5, 7, and 8 (0-indexed: 3, 4, 6, 7)
        reversed_indices = [3, 4, 6, 7]
        total = 0
        for i, val in enumerate(answers):
            if i in reversed_indices:
                total += (4 - val)
            else:
                total += val

        risk = "low"
        if total >= 27: risk = "high"
        elif total >= 14: risk = "moderate"
        
        return {"total_score": total, "risk_level": risk}


# Registry for easy lookup
QUESTIONNAIRES = {
    "PHQ-9": PHQ9(),
    "GAD-7": GAD7(),
    "WHO-5": WHO5(),
    "PSS": PSS()
}

def get_questionnaire(q_id: str) -> QuestionnaireDefinition:
    return QUESTIONNAIRES.get(q_id.upper())

def score_assessment(q_id: str, answers: List[int]) -> dict:
    q = get_questionnaire(q_id)
    if not q:
        raise ValueError(f"Unknown questionnaire ID: {q_id}")
    if len(answers) != len(q.questions):
        raise ValueError(f"Expected {len(q.questions)} answers, got {len(answers)}")
    
    return q.score(answers)
