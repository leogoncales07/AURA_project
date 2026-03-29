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
            name="WHO-5: Índice de Bem-Estar",
            description="Uma breve avaliação do bem-estar subjetivo atual.",
            questions=[
                "Tem-se sentido alegre, bem-disposto(a) e com bom astral ultimamente?",
                "Com que frequência se tem sentido calmo(a), tranquilo(a) e relaxado(a)?",
                "Tem-se sentido com energia, ativo(a) e com vigor para realizar as suas tarefas?",
                "Ao acordar, sente que teve um sono revigorante e que está realmente descansado(a)?",
                "Sente que o seu dia a dia tem sido preenchido com coisas e atividades que despertam o seu interesse?"
            ],
            options=[
                {"text": "Todo o tempo", "value": 5},
                {"text": "A maior parte do tempo", "value": 4},
                {"text": "Mais de metade do tempo", "value": 3},
                {"text": "Menos de metade do tempo", "value": 2},
                {"text": "Algumas vezes", "value": 1},
                {"text": "Nunca", "value": 0}
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
            id="PSS-10",
            name="PSS-10: Escala de Stress Percebido",
            description="Uma breve avaliação da perceção de stress nas últimas semanas.",
            questions=[
                "Você tem se sentido afetado(a) ou abalado(a) por coisas inesperadas que aconteceram recentemente?",
                "Com que frequência sentiu que não tinha controle sobre as coisas realmente importantes da sua vida?",
                "Você tem se sentido muito nervoso(a) ou 'sob pressão' ultimamente?",
                "Com que frequência sentiu confiança na sua própria capacidade de lidar com os seus problemas pessoais?",
                "Você tem sentido que as coisas estão a correr como gostaria ou planeou?",
                "Com que frequência sentiu que não conseguia dar conta de todas as tarefas e obrigações que tinha para fazer?",
                "Tem sido capaz de controlar as irritações ou pequenas chateações do dia a dia?",
                "Com que frequência sentiu que tinha tudo sob controlo e que as coisas estavam a caminhar bem?",
                "Tem se sentido furioso(a) ou muito irritado(a) por causa de coisas que fugiram totalmente do seu controlo?",
                "Com que frequência sentiu que as dificuldades se acumulavam tanto que já não as conseguia ultrapassar?"
            ],
            options=[
                {"text": "Nunca", "value": 0},
                {"text": "Quase nunca", "value": 1},
                {"text": "Às vezes", "value": 2},
                {"text": "Com frequência", "value": 3},
                {"text": "Com muita frequência", "value": 4}
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
    "PSS-10": PSS()
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
