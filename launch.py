import subprocess
import sys
import time
import os
from colorama import Fore, Style, init

init(autoreset=True)

def run_command(command, cwd, label, color):
    print(f"{color}[{label}] Starting...{Style.RESET_ALL}")
    return subprocess.Popen(
        command,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, "backend")
    frontend_dir = os.path.join(root, "frontend")

    print(f"\n{Fore.CYAN}🚀 Launching Mental Health App Stack...{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}-----------------------------------------{Style.RESET_ALL}")

    # 1. Start Backend
    backend_proc = run_command("python main.py", backend_dir, "BACKEND", Fore.GREEN)
    
    # Wait a bit for backend to initialize
    time.sleep(3)

    # 2. Start Frontend
    frontend_proc = run_command("npm run dev", frontend_dir, "FRONTEND", Fore.BLUE)

    print(f"\n{Fore.GREEN}✅ Servers are starting up!{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}🌐 App (Local): http://localhost:3000{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}🌐 App (Network): Look at the FRONTEND terminal output for the Network URL (usually http://<Your-IP>:3000){Style.RESET_ALL}")
    print(f"{Fore.CYAN}🔗 API Docs: http://localhost:8000/docs{Style.RESET_ALL}")
    print(f"\n{Fore.YELLOW}Keep this window open. Press Ctrl+C to stop both.{Style.RESET_ALL}\n")

    try:
        while True:
            # Check backend output
            if backend_proc.poll() is not None:
                print(f"{Fore.RED}[BACKEND] Stopped unexpectedly.{Style.RESET_ALL}")
                break
            
            # Check frontend output
            if frontend_proc.poll() is not None:
                print(f"{Fore.RED}[FRONTEND] Stopped unexpectedly.{Style.RESET_ALL}")
                break
                
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Stopping servers...{Style.RESET_ALL}")
        backend_proc.terminate()
        frontend_proc.terminate()
        print(f"{Fore.GREEN}Done.{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
