"""
Mental Health AI Agents (Async)
==============================
ClinicalBot: Generates empathetic risk summaries based on assessment scores.
CompanionBot: Conversational agent for support, meditation, and sleep hygiene.
"""

from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import settings
from rate_limiter import rate_limited

class ClinicalBot:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.2, # Low temperature for clinical summarization
            google_api_key=settings.google_api_key,
        )
        
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are ClinicalBot, an empathetic, non-judgmental mental health AI "
                       "assistant. The user has just completed the '{questionnaire_name}' "
                       "assessment. Their total score is {total_score} indicating a '{risk_level}' "
                       "risk level.\n\n"
                       "Your task is to write a short, compassionate, and supportive summary "
                       "(2-3 sentences max) explaining their result and suggesting they reach "
                       "out for professional help if they are in distress. Avoid giving specific "
                       "medical diagnoses. Be warm and encouraging."),
            ("user", "Here are my responses:\n{responses_text}\n\nPlease give me a summary of my results.")
        ])

    @rate_limited("gemini")
    async def generate_summary(self, questionnaire_name: str, total_score: float, risk_level: str, responses: List[dict]) -> str:
        """Generates an AI summary for a completed assessment."""
        responses_text = "\n".join([f"Q: {r['question']}\nA: {r['answer']}" for r in responses])
        chain = self.summary_prompt | self.llm
        response = await chain.ainvoke({
            "questionnaire_name": questionnaire_name,
            "total_score": total_score,
            "risk_level": risk_level,
            "responses_text": responses_text
        })
        return response.content


class CompanionBot:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.7, # Higher temperature for more natural conversation
            google_api_key=settings.google_api_key,
        )
        
        self.chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are CompanionBot, a safe, friendly, and deeply empathetic mental health companion. "
                       "Your role is to offer emotional support, suggest coping strategies (like breathing "
                       "exercises or meditation), and provide a safe space for the user to vent.\n\n"
                       "Important Guidelines:\n"
                       "- Always validate the user's feelings.\n"
                       "- Keep responses concise (1-3 small paragraphs).\n"
                       "- If the user expresses intent to self-harm or severe distress, gently but firmly "
                       "encourage them to seek emergency services or a crisis hotline immediately.\n"
                       "- You are an AI, not a doctor. Do not prescribe medication or diagnose conditions.\n"
                       "- Use a warm and conversational tone."),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{message}")
        ])

        self.meditation_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are CompanionBot, an expert in mindfulness and meditation. "
                       "The user has requested a quick meditation or breathing exercise. "
                       "Provide a calming, step-by-step guided exercise taking about 2-3 minutes "
                       "to read through. Use soothing language and clear steps."),
            ("user", "{request}")
        ])

    @rate_limited("gemini")
    async def chat(self, message: str, history: List[Dict[str, str]] = None) -> str:
        """
        Chat with CompanionBot using conversation history.
        """
        if history is None:
            history = []
            
        langchain_history = []
        for msg in history:
            if msg["role"] == "user":
                langchain_history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langchain_history.append(AIMessage(content=msg["content"]))

        chain = self.chat_prompt | self.llm
        response = await chain.ainvoke({
            "message": message,
            "history": langchain_history
        })
        return response.content

    @rate_limited("gemini")
    async def get_meditation(self, request: str = "I'm feeling stressed, can you guide me through a quick meditation?") -> str:
        """Generates a personalized meditation exercise."""
        chain = self.meditation_prompt | self.llm
        response = await chain.ainvoke({"request": request})
        return response.content
