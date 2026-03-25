"""
Mental Health AI Agents (Async)
==============================
ClinicalBot: Generates empathetic risk summaries based on assessment scores.
CompanionBot: Conversational agent for support, meditation, and sleep hygiene.
"""

from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import settings
from rate_limiter import rate_limited
from content_library import MEDITATION_EXERCISES, SLEEP_METHODS

class ClinicalBot:
    def __init__(self, model_name="gemini-1.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.2, # Low temperature for clinical summarization
            google_api_key=settings.google_api_key,
        )
        
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are ClinicalBot, an empathetic, non-judgmental mental health AI "
                       "assistant. The user, {user_name}, has just completed the '{questionnaire_name}' "
                       "assessment. Their total score is {total_score} indicating a '{risk_level}' "
                       "risk level.\n\n"
                       "Your task is to write a short, compassionate, and supportive summary "
                       "(2-3 sentences max) explaining their result and suggesting they reach "
                       "out for professional help if they are in distress. Avoid giving specific "
                       "medical diagnoses. Be warm and encouraging. ALWAYS call the user by their name."),
            ("user", "Here are my responses:\n{responses_text}\n\nPlease give me a summary of my results.")
        ])

    @rate_limited("gemini")
    async def generate_summary(self, user_name: str, questionnaire_name: str, total_score: float, risk_level: str, responses: List[dict]) -> str:
        """Generates an AI summary for a completed assessment."""
        responses_text = "\n".join([f"Q: {r['question']}\nA: {r['answer']}" for r in responses])
        import asyncio
        chain = self.summary_prompt | self.llm
        
        response = await asyncio.to_thread(
            chain.invoke,
            {
                "user_name": user_name,
                "questionnaire_name": questionnaire_name,
                "total_score": total_score,
                "risk_level": risk_level,
                "responses_text": responses_text
            }
        )
        return response.content


class CompanionBot:
    def __init__(self, model_name="gemini-1.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.7, # Higher temperature for more natural conversation
            google_api_key=settings.google_api_key,
        )
        
        self.chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are CompanionBot, a safe, friendly, and deeply empathetic mental health companion. "
                       "The user's name is {user_name}. "
                       "Your role is to offer emotional support, suggest coping strategies (like breathing "
                       "exercises or meditation), and provide a safe space for the user to vent.\n\n"
                       "Important Guidelines:\n"
                       "- Always validate the user's feelings.\n"
                       "- Keep responses concise (1-3 small paragraphs).\n"
                       "- If the user expresses intent to self-harm or severe distress, gently but firmly "
                       "encourage them to seek emergency services or a crisis hotline immediately.\n"
                       "- You are an AI, not a doctor. Do not prescribe medication or diagnose conditions.\n"
                       "- Use a warm and conversational tone.\n"
                       "- ALWAYS call the user by their name frequently to build rapport.\n"
                       "- IMPORTANT: If the language is '{language}', respond ONLY in that language."),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{message}")
        ])

        self.meditation_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are CompanionBot, an expert in mindfulness and meditation. "
                        "The user has requested a quick meditation or breathing exercise. "
                        "Provide a calming, step-by-step guided exercise taking about 2-3 minutes "
                        "to read through. Use soothing language and clear steps.\n"
                        "IMPORTANT: Respond ONLY in the language '{language}'."),
            ("user", "{request}")
        ])

    @rate_limited("gemini")
    async def chat(self, user_name: str, message: str, history: Optional[List[Dict[str, str]]] = None, language: str = "en") -> str:
        """
        Chat with CompanionBot using conversation history.
        """
        if history is None:
            history = []
            
        # Detect if user is asking for a specific meditation or sleep method
        msg_lower = message.lower()
        content_found = None
        
        # Simple keyword matching for library content
        if "military" in msg_lower and "sleep" in msg_lower:
            content_found = SLEEP_METHODS["military_method"]
        elif "box breathing" in msg_lower:
            content_found = MEDITATION_EXERCISES["box_breathing"]
        elif "4-7-8" in msg_lower or "478" in msg_lower:
            content_found = MEDITATION_EXERCISES["478_breathing"]
        elif "body scan" in msg_lower:
            content_found = MEDITATION_EXERCISES["body_scan"]
        elif "grounding" in msg_lower or "54321" in msg_lower:
            content_found = MEDITATION_EXERCISES["54321_grounding"]

        if content_found:
            import asyncio
            # If found in library, use the library content to ground the AI's response
            library_context = f"Use the following validated technique in your response: {content_found['name']}. Source: {content_found['source']}. Steps: {', '.join(content_found['steps'])}"
            
            chain = self.chat_prompt | self.llm
            response = await asyncio.to_thread(
                chain.invoke,
                {
                    "user_name": user_name,
                    "message": f"{message}\n\n[System Context: {library_context}]",
                    "history": self._prepare_history(history),
                    "language": language
                }
            )
            return response.content

        import asyncio
        chain = self.chat_prompt | self.llm
        
        response = await asyncio.to_thread(
            chain.invoke,
            {
                "user_name": user_name,
                "message": message,
                "history": self._prepare_history(history),
                "language": language
            }
        )
        return response.content

    def _prepare_history(self, history: List[Dict[str, str]]):
        langchain_history = []
        for msg in history:
            if msg["role"] == "user":
                langchain_history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langchain_history.append(AIMessage(content=msg["content"]))
        return langchain_history

    @rate_limited("gemini")
    async def get_meditation(self, request: str = "I'm feeling stressed, can you guide me through a quick meditation?", language: str = "en") -> str:
        """Generates a personalized meditation exercise using library grounding if possible."""
        req_lower = request.lower()
        library_context = ""
        
        if "box" in req_lower:
            library_context = f"Ground your response in the Box Breathing method: {', '.join(MEDITATION_EXERCISES['box_breathing']['steps'])}"
        elif "sleep" in req_lower:
            library_context = f"Ground your response in the Military Sleep Method: {', '.join(SLEEP_METHODS['military_method']['steps'])}"
            
        import asyncio
        chain = self.meditation_prompt | self.llm
        response = await asyncio.to_thread(
            chain.invoke, 
            {"request": f"{request}\n\n[System Context: {library_context}]", "language": language}
        )
        return response.content
