import subprocess
import time
import os
import random
import string
from colorama import Fore, Style, init

init(autoreset=True)

def run_command(command, cwd, label, color, env=None):
    print(f"{color}[{label}] Starting...{Style.RESET_ALL}")
    
    # Merge default os.environ with custom env
    custom_env = os.environ.copy()
    if env:
        custom_env.update(env)
        
    return subprocess.Popen(
        command,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
        env=custom_env
    )

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, "backend")
    frontend_dir = os.path.join(root, "frontend")

    print(f"\n{Fore.CYAN}🌐 Launching Mental Health App PUBLICLY...{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}-----------------------------------------{Style.RESET_ALL}")
    
    # Generate unique subdomains so we guarantee availability
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    api_subdomain = f"aura-api-{random_str}"
    app_subdomain = f"aura-app-{random_str}"
    
    api_url = f"https://{api_subdomain}.loca.lt"
    app_url = f"https://{app_subdomain}.loca.lt"

    # 1. Start Backend Locally
    backend_proc = run_command("python main.py", backend_dir, "BACKEND", Fore.GREEN)
    
    # 2. Start Backend Tunnel
    api_tunnel = run_command(f"npx -y localtunnel --port 8000 --subdomain {api_subdomain}", root, "API-TUNNEL", Fore.CYAN)
    
    time.sleep(3) # Wait for backend and tunnel to initialize

    # 3. Start Frontend Locally (Override physical environment with tunnel URL)
    frontend_env = {"NEXT_PUBLIC_API_URL": api_url}
    frontend_proc = run_command("npm run dev", frontend_dir, "FRONTEND", Fore.BLUE, env=frontend_env)

    # 4. Start Frontend Tunnel
    app_tunnel = run_command(f"npx -y localtunnel --port 3000 --subdomain {app_subdomain}", root, "APP-TUNNEL", Fore.MAGENTA)

    print(f"\n{Fore.GREEN}✅ Public Tunnels are online!{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}-----------------------------------------{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📱 Share this link for your presentation:{Style.RESET_ALL}")
    print(f"{Fore.GREEN}{Style.BRIGHT}{app_url}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}-----------------------------------------{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}🔗 API is safely running publically here: {api_url}{Style.RESET_ALL}")
    print(f"\n{Fore.YELLOW}Keep this window open. Press Ctrl+C to stop the servers and tunnels.{Style.RESET_ALL}\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Stopping public servers...{Style.RESET_ALL}")
        backend_proc.terminate()
        frontend_proc.terminate()
        api_tunnel.terminate()
        app_tunnel.terminate()
        print(f"{Fore.GREEN}Done.{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
