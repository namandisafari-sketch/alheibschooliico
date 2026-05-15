
import os
import sys
import subprocess
import google.generativeai as genai

# Setup Gemini API Key (This should be in your .bashrc or .env)
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in environment variables.")
    sys.exit(1)

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-pro')

def get_commands(prompt):
    full_prompt = f"You are a Linux Server Expert for Alheb School. Translate the following request into a safe, efficient Ubuntu bash command. Output ONLY the raw commands, one per line. No markdown, no explanations. Request: {prompt}"
    response = model.generate_content(full_prompt)
    return response.text.strip().split('\n')

def run_commands(commands):
    for cmd in commands:
        print(f"🤖 Agent proposing: \033[94m{cmd}\033[0m")
        confirm = input("Run this command? (y/n): ")
        if confirm.lower() == 'y':
            try:
                subprocess.run(cmd, shell=True, check=True)
                print("✅ Success")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error: {e}")
        else:
            print("⏭️ Skipped")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: gemini \"your request here\"")
        sys.exit(1)
    
    user_request = " ".join(sys.argv[1:])
    print(f"🔍 Analyzing: {user_request}...")
    
    try:
        commands = get_commands(user_request)
        run_commands(commands)
    except Exception as e:
        print(f"❌ AI Error: {e}")
