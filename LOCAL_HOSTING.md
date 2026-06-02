# Alheb School Management System - Local Deployment Guide

This guide provides instructions on how to host the system on a **Physical School VPS** to ensure 100% availability even when the internet is disconnected.

## 🏗️ Architecture Overview
The system is designed to run in a **Local Area Network (LAN)**:
- **Server**: A local machine (Linux/Windows VPS) running the Docker containers.
- **Clients**: Laptops and Tablets connected to the school's Wi-Fi/LAN.

## 🚀 Prerequisites
1. **Docker & Docker Compose** installed on the server.
2. **Local Static IP**: Ensure the server has a static IP (e.g., `192.168.1.10`).

## 🚀 Quick Setup (Ubuntu)
If you are using **Ubuntu 24.04**, you can use the automated setup script included in the repository:
```bash
chmod +x ubuntu_setup.sh
./ubuntu_setup.sh
```
This will automatically install Docker, Git, and set up the local database for you.

## 📦 Deployment Steps

### 1. Set Up Local Supabase
We use the Supabase Self-Hosted stack. 

```bash
# Clone the supabase repo
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy env file
cp .env.example .env

# Pull images and start
docker-compose up -d
```

### 2. Configure Environment Variables
On the server, edit the `.env` file for the frontend:
```env
VITE_SUPABASE_URL=http://192.168.1.10:8000
VITE_SUPABASE_PUBLISHABLE_KEY=your_local_anon_key
```

### 3. Deploy the Frontend
You can use the provided `docker-compose.yml` in the root directory:

```yaml
version: '3.8'
services:
  alheb-frontend:
    build: .
    ports:
      - "80:80"
    restart: always
    environment:
      - VITE_SUPABASE_URL=http://192.168.1.10:8000
      - VITE_SUPABASE_PUBLISHABLE_KEY=your_local_anon_key
```

## 🛠️ Offline Capabilities
- **Local Database**: All records are stored on your VPS, not the cloud.
- **Local Assets**: Images and documents are served directly from your server's storage.
- **LAN Access**: Staff can access the system via `http://192.168.1.10` from any device in the school.

## 🤖 Local Offline AI (Optional)
To have a Gemini-like assistant working **without internet**, you can install **Ollama** on your Ubuntu server:

1. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
2. **Download a Model** (e.g., Llama 3 or Mistral):
   ```bash
   ollama run llama3
   ```
3. **The System**: The Alheb Management System is configured to talk to `http://localhost:11434` for AI requests if no internet is detected.

## 📡 Monitoring
The **Header** of the application now includes a "Local Server Active" indicator.
- 🟢 **Green**: Connected to the school VPS.
- 🔴 **Red**: Server unreachable (Check school Wi-Fi or Server power).

---
**Note**: Periodic backups to an external hard drive are recommended to prevent data loss in case of hardware failure.
