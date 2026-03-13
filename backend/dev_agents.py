import os
import sys
from typing import Optional
from config import settings
from rate_limiter import rate_limited
from db import get_db, get_service_db
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

class DevTeam:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.7,
            google_api_key=settings.google_api_key,
        )
        
        # --- Prompts ---
        self.coder_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert developer. Return the full code implementation."),
            ("user", "Task: {task}\n\nExisting Code / Context (if any): {context}")
        ])
        
        self.reviewer_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Senior Architect. Review code for bugs/security. Approved? List improvements if not."),
            ("user", "Review the following code:\n```\n{code}\n```")
        ])

        self.chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a friendly AI dev assistant for this Mental Health project."),
            ("user", "{message}")
        ])

        self.task_suggest_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a senior project manager. Suggest prioritized coding tasks."),
            ("user", "Project area to focus on: {area}\n\nAdditional context: {context}")
        ])

    # ── Supabase Helpers (Async) ──────────────────────────────

    async def _create_task_record(self, task: str) -> Optional[str]:
        """Insert a new task row and return its UUID."""
        try:
            db = get_service_db()
            result = await db.from_("agent_tasks").insert({
                "task": task,
                "status": "in_progress",
            }).execute()
            task_id = result.data[0]["id"]
            print(f"{Fore.BLUE}[Supabase] Task logged: {task_id[:8]}...")
            return task_id
        except Exception as e:
            print(f"{Fore.RED}[Supabase] Failed to log task: {e}")
            return None

    async def _log_iteration(self, task_id: Optional[str], iteration: int,
                       coder_output: str, reviewer_output: str, approved: bool):
        """Log a single coder→reviewer iteration."""
        if not task_id: return
        try:
            db = get_service_db()
            await db.from_("agent_iterations").insert({
                "task_id": task_id,
                "iteration": iteration,
                "coder_output": coder_output,
                "reviewer_output": reviewer_output,
                "approved": approved,
            }).execute()
        except Exception as e:
            print(f"{Fore.RED}[Supabase] Failed to log iteration: {e}")

    async def _complete_task(self, task_id: Optional[str], final_code: str, iterations: int,
                       status: str = "completed"):
        """Mark the task as completed/failed."""
        if not task_id: return
        try:
            db = get_service_db()
            await db.from_("agent_tasks").update({
                "final_code": final_code,
                "iterations": iterations,
                "status": status,
                "completed_at": "now()",
            }).eq("id", task_id).execute()
        except Exception as e:
            print(f"{Fore.RED}[Supabase] Failed to update task: {e}")

    # ── Agent Methods (Async) ─────────────────────────────────

    @rate_limited("gemini")
    async def write_code(self, task, context=""):
        print(f"{Fore.CYAN}[DevCoder] Writing code...")
        chain = self.coder_prompt | self.llm
        response = await chain.ainvoke({"task": task, "context": context})
        return response.content

    @rate_limited("gemini")
    async def review_code(self, code):
        print(f"{Fore.YELLOW}[DevReviewer] Reviewing code...")
        chain = self.reviewer_prompt | self.llm
        response = await chain.ainvoke({"code": code})
        return response.content

    @rate_limited("gemini")
    async def chat(self, message):
        chain = self.chat_prompt | self.llm
        response = await chain.ainvoke({"message": message})
        return response.content

    @rate_limited("gemini")
    async def suggest_tasks(self, area="general", context=""):
        chain = self.task_suggest_prompt | self.llm
        response = await chain.ainvoke({"area": area, "context": context})
        return response.content

    async def collaborate(self, task, max_iterations=2):
        """Orchestrates the collaboration (Async)."""
        task_id = await self._create_task_record(task)
        try:
            current_code = await self.write_code(task)
            iteration_count = 0
            for i in range(max_iterations):
                iteration_count = i + 1
                review_feedback = await self.review_code(current_code)
                
                review_upper = review_feedback.upper()
                rejection_keywords = ["ISSUE", "BUG", "ERROR", "PROBLEM", "FIX", "IMPROVE", "REJECT", "FAIL", "NOT READY", "NEEDS WORK"]
                approved = not any(k in review_upper for k in rejection_keywords)
                
                await self._log_iteration(task_id, iteration_count, current_code, review_feedback, approved)
                if approved: break
                
                current_code = await self.write_code(f"Fix these: {review_feedback}", context=current_code)
                
            await self._complete_task(task_id, current_code, iteration_count)
            return current_code
        except Exception as e:
            await self._complete_task(task_id, str(e), 0, status="failed")
            raise

import asyncio

async def main():
    team = DevTeam()
    print(f"\n{Fore.GREEN}=== AI Dev Team Initialized ==={Style.RESET_ALL}")
    
    while True:
        try:
            task = input(f"\n{Fore.CYAN}Enter a coding task for the agents (or 'exit' to quit): {Style.RESET_ALL}")
            if task.lower() in ["exit", "quit", "q"]:
                break
            if not task.strip():
                continue
            
            await team.collaborate(task)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"{Fore.RED}Error in collaboration: {e}")

if __name__ == "__main__":
    asyncio.run(main())
