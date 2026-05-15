#!/bin/bash

# Alheb School Management System - Ubuntu Server Auto-Setup Script
# Targeted for Ubuntu 24.04 LTS

echo "🚀 Starting Alheb School Server Setup..."

# 1. Update System
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Prerequisites
sudo apt-get install -y ca-certificates cursor curl gnupg lsb-release git

# 3. Install Docker
echo "📦 Installing Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Configure Docker Permissions
sudo usermod -aG docker $USER

# 5. Clone and Setup Supabase Local
echo "🗄️ Setting up Local Database (Supabase)..."
mkdir -p ~/alheb-server
cd ~/alheb-server
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Start Supabase
sudo docker compose up -d

echo "🤖 Installing Gemini CLI Agent..."
sudo apt-get install -y python3-pip
pip3 install google-generativeai
sudo cp ~/alheb-server/gemini_cli.py /usr/local/bin/gemini_cli.py
# Create the global 'gemini' command
echo '#!/bin/bash
python3 /usr/local/bin/gemini_cli.py "$@"' | sudo tee /usr/local/bin/gemini > /dev/null
sudo chmod +x /usr/local/bin/gemini

# 6. Final Instructions
echo "-------------------------------------------------------"
echo "🎉 Setup Complete!"
echo "Next Steps:"
echo "1. Get your Local IP: 'hostname -I'"
echo "2. Update your .env file with the Local IP."
echo "3. Run 'docker compose up -d' for the frontend."
echo "-------------------------------------------------------"
