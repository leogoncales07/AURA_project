"""
Mental Health Questionnaires & Scoring
========================================
Definitions and scoring logic for PHQ-9, GAD-7, WHO-5, and PSS.
"""

from typing import List, Dict, Any, Optional

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
            name="PHQ-9: Questionário de Saúde do Paciente",
            description="Uma breve ferramenta de rastreio para gravidade da depressão.",
            questions=[
                "Você tem sentido menos vontade ou prazer em fazer as coisas que normalmente gosta?",
                "Você tem se sentido mais triste, desanimado(a) ou sem muita perspectiva ultimamente?",
                "Como tem sido o seu sono? Tem sido difícil dormir ou você tem sentido necessidade de dormir em excesso?",
                "Você tem se sentido muito cansado(a) ou notou que sua energia está mais baixa que o normal?",
                "Você notou mudanças no apetite, como sentir pouca fome ou acabar comendo bem mais que o costume?",
                "Você tem sido muito duro(a) consigo mesmo(a), sentindo-se um fracasso ou que decepcionou quem você ama?",
                "Tem sido difícil manter o foco em atividades simples, como ler uma notícia ou assistir a algo na TV?",
                "Você sentiu seu corpo mais lento para falar e agir, ou, ao contrário, uma agitação que não te deixa relaxar?",
                "Você chegou a ter pensamentos de que seria melhor não estar mais aqui ou de se machucar de alguma forma?"
            ],
            options=[
                {"text": "Nenhum dia", "value": 0},
                {"text": "Em alguns dias", "value": 1},
                {"text": "Na maioria dos dias", "value": 2},
                {"text": "Quase todos os dias", "value": 3}
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
            name="GAD-7: Escala de Ansiedade Generalizada",
            description="Uma breve ferramenta de rastreio para gravidade da ansiedade.",
            questions=[
                "Tem sentido uma sensação de ansiedade e tensão constante?",
                "Tem sido difícil desligar os pensamentos ou controlar a quantidade de preocupações que lhe vêm à cabeça?",
                "Tem dado por si a preocupar-se excessivamente com vários assuntos diferentes do dia a dia ao mesmo tempo?",
                "Tem sentido dificuldade em conseguir relaxar ou em ter um momento de verdadeira calma para si?",
                "Tem sentido uma inquietação no corpo, daquelas em que se torna muito difícil conseguir estar quieto/a ou sossegado/a?",
                "Tem notado que anda com menos paciência do que o habitual, aborrecendo-se ou irritando-se com facilidade?",
                "Tem sentido um receio súbito ou uma sensação de alarme, como se algo de muito mau estivesse prestes a acontecer?"
            ],
            options=[
                {"text": "Nunca", "value": 0},
                {"text": "Em vários dias", "value": 1},
                {"text": "Em mais de metade dos dias", "value": 2},
                {"text": "Em quase todos os dias", "value": 3}
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

def get_questionnaire(q_id: str) -> Optional[QuestionnaireDefinition]:
    return QUESTIONNAIRES.get(q_id.upper())

def score_assessment(q_id: str, answers: List[int]) -> dict:
    q = get_questionnaire(q_id)
    if not q:
        raise ValueError(f"Unknown questionnaire ID: {q_id}")
    if len(answers) != len(q.questions):
        raise ValueError(f"Expected {len(q.questions)} answers, got {len(answers)}")
    
    return q.score(answers)
