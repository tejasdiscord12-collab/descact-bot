# Nexter Cloud Bot

Nexter Cloud is a versatile Discord bot designed for moderation, utilities, and support features.

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

## Development
Built with **Discord.js v14**.
