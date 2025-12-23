const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vps-status')
        .setDescription('Displays the real-time status of the VPS.'),
    async execute(interaction) {
        const uptime = os.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime % 86400 / 3600);
        const minutes = Math.floor(uptime % 3600 / 60);

        const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRAM = (totalRAM - freeRAM).toFixed(2);

        const cpuLoad = os.loadavg()[0].toFixed(2);
        const platform = os.platform();
        const arch = os.arch();

        const embed = new EmbedBuilder()
            .setTitle('🖥️ VPS Real-time Status')
            .addFields(
                { name: '⏱️ System Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: '🧠 RAM Usage', value: `${usedRAM}GB / ${totalRAM}GB`, inline: true },
                { name: '🔥 CPU Load (1m)', value: `${cpuLoad}`, inline: true },
                { name: '⚙️ Platform', value: `${platform} (${arch})`, inline: true },
                { name: '📂 Node.js', value: `${process.version}`, inline: true }
            )
            .setColor('#5865F2')
            .setTimestamp()
            .setFooter({ text: 'Desact.Core Monitoring' });

        await interaction.reply({ embeds: [embed] });
    }
};
