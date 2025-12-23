const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const os = require('os');

module.exports = (client) => {
    client.updateStatusMessages = async () => {
        const allSettings = db.getAllStatusSettings();

        for (const guildId in allSettings) {
            const { ChannelID, MessageID } = allSettings[guildId];

            try {
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (!guild) continue;

                const channel = await guild.channels.fetch(ChannelID).catch(() => null);
                if (!channel) continue;

                const message = await channel.messages.fetch(MessageID).catch(() => null);
                if (!message) continue;

                const uptime = os.uptime();
                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime % 86400 / 3600);
                const minutes = Math.floor(uptime % 3600 / 60);

                const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
                const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
                const usedRAM = (totalRAM - freeRAM).toFixed(2);
                const ramPercent = ((usedRAM / totalRAM) * 100).toFixed(1);

                const cpuLoad = os.loadavg()[0].toFixed(2);

                const embed = new EmbedBuilder()
                    .setTitle('🚀 Desact.Core | VPS Live Status')
                    .setDescription(`Last updated: <t:${Math.floor(Date.now() / 1000)}:R>`)
                    .addFields(
                        { name: '⏱️ System Uptime', value: `\`${days}d ${hours}h ${minutes}m\``, inline: true },
                        { name: '🧠 RAM Usage', value: `\`${usedRAM}GB / ${totalRAM}GB (${ramPercent}%)\``, inline: true },
                        { name: '🔥 CPU Load (1m)', value: `\`${cpuLoad}\``, inline: true },
                        { name: '🛰️ Bot Latency', value: `\`${client.ws.ping}ms\``, inline: true },
                        { name: '⚙️ Platform', value: `\`${os.platform()} (${os.arch()})\``, inline: true },
                        { name: '📌 Status', value: '🟢 **Operational**', inline: true }
                    )
                    .setColor('#00FF7F')
                    .setTimestamp();

                await message.edit({ embeds: [embed] });
            } catch (error) {
                console.error(`Failed to update status message for guild ${guildId}:`, error);
            }
        }
    };

    // Start the interval
    setInterval(() => {
        client.updateStatusMessages();
    }, 60000); // Every 60 seconds
};
