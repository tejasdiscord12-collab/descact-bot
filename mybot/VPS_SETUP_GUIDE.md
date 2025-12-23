# 🚀 Full Step-by-Step VPS Setup Guide

Follow these steps to get your **Desact.Core Bot** running 24/7 on a VPS (Ubuntu/Linux).

## Step 1: Login to your VPS
Use a terminal (like Terminal on Mac or PowerShell on Windows) to log in:
```bash
ssh root@YOUR_VPS_IP
```
*(Enter your password when asked)*

## Step 2: Install Node.js & Git
Run these commands one by one to install the engine that runs the bot:
```bash
sudo apt update
sudo apt install -y nodejs npm git
```

## Step 3: Clone your Bot
Download your code from GitHub to the VPS:
```bash
git clone https://github.com/tejasdiscord12-collab/clientbot.git
cd clientbot
```

## Step 4: Install Bot Dependencies
Install the required libraries:
```bash
npm install
```

## Step 5: Transfer Secret Files (EXTREMELY IMPORTANT)
Since GitHub doesn't have your `.env` (Token) or `database.json`, you need to create them manually on the VPS.

### 5a. Create .env:
1. Type: `nano .env`
2. Paste your local `.env` content (Token, Client ID, etc.)
3. Press `CTRL + O`, then `Enter` to save.
4. Press `CTRL + X` to exit.

### 5b. Create database.json:
1. Type: `nano database.json`
2. Paste the content of your local `database.json`.
3. Press `CTRL + O`, then `Enter` to save.
4. Press `CTRL + X` to exit.

## Step 6: Set up 24/7 Mode (PM2)
This will keep the bot alive forever:
```bash
# Install the process manager
npm install pm2 -g

# Start the bot
pm2 start src/index.js --name "Desact-Core"

# Make it restart if the VPS reboots
pm2 startup
# (Copy and paste the command PM2 shows you in the terminal)
pm2 save
```

## 📂 How to Add New Files/Commands
When you want to add a new command or update the code, follow this professional workflow:

### Option A: The Professional Way (Recommended)
1. **On your computer:** Create the new file (e.g., `src/commands/Utility/newcommand.js`).
2. **On your computer:** Test it locally to make sure it works!
3. **On your computer:** Push to GitHub:
   ```bash
   git add .
   git commit -m "Added new command"
   git push
   ```
4. **On your VPS:** Download the changes:
   ```bash
   cd clientbot
   git pull
   pm2 restart Desact-Core
   ```

### Option B: The Quick Way (Direct on VPS)
If you just need to make a tiny change or add a quick file:
1. `cd clientbot/src/commands/...`
2. Type `nano filename.js`
3. Paste your code and save (`CTRL+O`, `Enter`, `CTRL+X`).
4. `pm2 restart Desact-Core`

### Option C: Transferring Images/Assets
If you need to upload images for your banner:
- Use a tool like **FileZilla** or **WinSCP**.
- Connect using your VPS IP, Username (**root**), and Password.
- Drag and drop files directly into the `assets` folder.

## ✅ DONE!
- Check status: `pm2 status`
- See live logs: `pm2 logs`

Your bot is now a professional 24/7 Discord bot! 🚀💎
