"""
Mental Health Reports Generator (Async)
========================================
AI-powered personalized mental health reports based on assessment history,
mood logs, and conversation patterns.
"""

from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from config import settings
from rate_limiter import rate_limited


class ReportGenerator:
    """Generates personalized mental health reports using AI."""

    def __init__(self, model_name="gemini-2.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.3,
            google_api_key=settings.google_api_key,
        )

        self.report_prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a compassionate mental health AI assistant generating a personalized "
             "well-being report for a user. You are NOT a doctor and must never diagnose conditions.\n\n"
             "Based on the data provided, write a clear, supportive, and actionable report that includes:\n"
             "1. **Overview** — A brief summary of the user's recent mental health trends.\n"
             "2. **Key Observations** — Patterns you notice (improving/declining mood, sleep quality, stress levels).\n"
             "3. **Strengths** — Positive aspects you can identify.\n"
             "4. **Recommendations** — 3-5 actionable, gentle suggestions for improvement.\n"
             "5. **When to Seek Help** — A brief, non-alarming reminder about professional resources.\n\n"
             "Keep the tone warm, encouraging, and non-clinical. Use simple language. "
             "Format the report in clean markdown."),
            ("user",
             "Please generate my well-being report based on this data:\n\n"
             "**Assessment History:**\n{assessments_text}\n\n"
             "**Recent Mood Logs (last 14 days):**\n{mood_text}\n\n"
             "**Additional Context:**\n{context}")
        ])

    @rate_limited("gemini")
    async def generate_report(self, assessments: List[Dict], mood_logs: List[Dict], context: str = "") -> str:
        """
        Generate a personalized mental health report (async, non-blocking).

        Args:
            assessments: List of assessment records from Supabase.
            mood_logs: List of daily mood/sleep log records.
            context: Any additional context (e.g., user preferences).
        """
        # Format assessments
        if assessments:
            assessments_text = "\n".join([
                f"- {a.get('questionnaire', 'Unknown')} | Score: {a.get('total_score', 'N/A')} | "
                f"Risk: {a.get('risk_level', 'N/A')} | Date: {a.get('created_at', 'N/A')}"
                for a in assessments
            ])
        else:
            assessments_text = "No assessments taken yet."

        # Format mood logs
        if mood_logs:
            mood_text = "\n".join([
                f"- {log.get('log_date', 'N/A')} | Mood: {log.get('mood_score', 'N/A')}/10 | "
                f"Sleep: {log.get('sleep_hours', 'N/A')}h | Notes: {log.get('notes', '-')}"
                for log in mood_logs
            ])
        else:
            mood_text = "No mood logs recorded yet."

        chain = self.report_prompt | self.llm
        response = await chain.ainvoke({
            "assessments_text": assessments_text,
            "mood_text": mood_text,
            "context": context or "No additional context."
        })
        return response.content
