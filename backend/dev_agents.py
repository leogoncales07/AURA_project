import os
import sys

# Force UTF-8 output on Windows (cp1252 can't handle Gemini's Unicode responses)
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from config import settings
from rate_limiter import rate_limited
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)


class DevTeam:
    def __init__(self, model_name="gemini-flash-latest"):
        # Use centralized config — key is validated at startup
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.7,
            google_api_key=settings.google_api_key,
        )
        
        # --- Prompts ---
        
        # Agent 1: Coder
        self.coder_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert Python and React Native Developer called 'DevCoder'. "
                       "Your goal is to write clean, efficient, and secure code based on user requirements. "
                       "Always return the full code implementation."),
            ("user", "Task: {task}\n\nExisting Code / Context (if any): {context}")
        ])
        
        # Agent 2: Reviewer
        self.reviewer_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Senior Software Architect and Auditor called 'DevReviewer'. "
                       "Your goal is to review code for bugs, security vulnerabilities, and style issues. "
                       "If the code is good, approve it. If not, list specific improvements required. "
                       "Be strict but constructive."),
            ("user", "Review the following code:\n```\n{code}\n```\n\nIs this code ready for production? If not, what needs to be fixed?")
        ])

    @rate_limited("gemini")
    def write_code(self, task, context=""):
        print(f"{Fore.CYAN}[DevCoder] Writing code for task: {task}...")
        chain = self.coder_prompt | self.llm
        response = chain.invoke({"task": task, "context": context})
        content = response.content
        if isinstance(content, list):
            content = "\n".join([str(item) for item in content])
        return content

    @rate_limited("gemini")
    def review_code(self, code):
        print(f"{Fore.YELLOW}[DevReviewer] Reviewing code...")
        chain = self.reviewer_prompt | self.llm
        response = chain.invoke({"code": code})
        content = response.content
        if isinstance(content, list):
            content = "\n".join([str(item) for item in content])
        return content

    def collaborate(self, task, max_iterations=2):
        """
        Orchestrates the collaboration between Coder and Reviewer.
        Rate limiting is applied automatically via the @rate_limited decorator.
        """
        print(f"{Fore.GREEN}Starting Collaboration Task: {task}\n{'='*50}")
        
        # Step 1: Initial Draft
        current_code = self.write_code(task)
        print(f"\n{Fore.CYAN}[DevCoder] Draft generated.\n")
        
        for i in range(max_iterations):
            print(f"{Fore.MAGENTA}--- Iteration {i+1} ---")
            
            # Step 2: Review
            review_feedback = self.review_code(current_code)
            print(f"\n{Fore.YELLOW}[DevReviewer] Feedback:\n{review_feedback}\n")
            
            # Check approval
            if "APPROVE" in review_feedback.upper() and len(review_feedback) < 100:
                print(f"{Fore.GREEN}[DevTeam] Code Approved! [OK]")
                break
                
            # Step 3: Refine based on feedback
            print(f"{Fore.CYAN}[DevCoder] Fixing code based on feedback...")
            refine_task = f"Original Task: {task}\n\nReviewer Feedback: {review_feedback}\n\nPlease rewrite the code to address these issues."
            current_code = self.write_code(refine_task, context=current_code)
            
        print(f"{Fore.GREEN}{'='*50}\nFinal Code:\n")
        print(current_code)
        return current_code

if __name__ == "__main__":
    # Config already validated all keys at import time via `settings`
    print(f"{Fore.GREEN}[OK] All systems ready. Rate limiting active.")
    print(f"{Fore.GREEN}  Gemini: 15 req/min | Supabase: 100 req/min\n")
    
    team = DevTeam()
    task = input("Enter a coding task for the agents: ")
    team.collaborate(task)
