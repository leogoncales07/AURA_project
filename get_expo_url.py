import subprocess
import re
import qrcode
import os
import time

artifact_dir = r"C:\Users\leogo\.gemini\antigravity\brain\d05fdf52-b70a-48ec-a923-a2627338e050"

print("Starting launch_public.py in the background...")
backend_proc = subprocess.Popen(["python", "launch_public.py"], cwd=r"c:\Users\leogo\Documents\meu_app_agentes")

print("Starting Expo packager...")
env = os.environ.copy()
env["EXPO_TUNNEL_SUBDOMAIN"] = "mytunnelexpo"
env["PATH"] = os.environ.get("PATH", "")
# Execute through shell wrapper so npx resolves locally
expo_proc = subprocess.Popen(
    "npx expo start --clear --tunnel",
    cwd=r"c:\Users\leogo\Documents\meu_app_agentes\mobile",
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    shell=True,
    env=env
)

url = None
print("Scanning Expo output for Tunnel URL...")

for line in iter(expo_proc.stdout.readline, ''):
    print(line, end="")
    match = re.search(r'(exp://\S+)', line)
    if match:
        url = match.group(1)
        break

if url:
    print(f"\nFOUND EXPO URL: {url}")
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    qr_path = os.path.join(artifact_dir, "expo_qr.png")
    img.save(qr_path)
    print(f"QR Code saved to {qr_path}")
    
    with open(os.path.join(artifact_dir, "expo_url.txt"), "w") as f:
        f.write(url)
        
    print("\nPress Ctrl+C to stop Expo and Tunnels...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Expo and Tunnels...")
        backend_proc.terminate()
        try:
            expo_proc.terminate()
        except Exception:
            pass
        print("Done.")
else:
    print("Failed to find URL.")
