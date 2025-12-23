# Desact.Core Bot

Desact.Core is a versatile Discord bot designed for moderation, utilities, and support features.

## Features

### 🛡️ Moderation
- **Kick/Ban**: Quickly manage rule-breakers.
- **Purge**: Clean up chat with `/purge`.
- **Lock/Unlock**: Control channel permissions.
- **Warn System**: Automatically track user warnings.
- **Anti-Spam**: Prevents message flooding.
- **Anti-Nuke**: Protects against channel/role mass deletion.

### 🎫 Ticket System
- Professional support ticket system with **Claim**, **Lock**, and **Close** features.
- Persistent database tracking for all tickets.

### ⚙️ VPS Monitoring
- Real-time VPS status including RAM, CPU, and Uptime.
- Live-updating status message system.

### 💎 Utilities
- **Welcome System**: Beautiful banners and custom messages.
- **Custom Commands**: Create your own auto-responses via `/cmd`.
- **User/Server Info**: Detailed technical stats.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/tejasdiscord12-collab/clientbot.git
   cd clientbot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on your local settings:
   ```env
   Token=YOUR_DISCORD_BOT_TOKEN
   CLIENT_ID=YOUR_CLIENT_ID
   GUILD_ID=YOUR_GUILD_ID
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## 🚀 24/7 VPS Deployment (PM2)

To keep your bot running 24/7 even after you close your terminal, follow these steps on your VPS:

1. **Install PM2 globally**:
   ```bash
   npm install pm2 -g
   ```

2. **Start the bot with PM2**:
   ```bash
   pm2 start src/index.js --name "Desact-Core"
   ```

3. **Ensure it starts on system reboot**:
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Useful Commands**:
   - `pm2 status`: Check if the bot is online.
   - `pm2 logs`: View the real-time activity/errors.
   - `pm2 restart Desact-Core`: Restart the bot.
   - `pm2 stop Desact-Core`: Turn the bot off.

## 📁 Required Local Files
When deploying to a VPS, you **must** manually upload these two files (they are hidden from GitHub for security):
1. `.env` (Contains your Bot Token)
2. `database.json` (Contains your saved tickets/warns/etc.)

## Development
Built with **Discord.js v14**.
