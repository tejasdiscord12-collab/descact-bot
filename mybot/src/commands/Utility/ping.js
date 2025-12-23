const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns the bot latency.'),
    async execute(interaction, client) {
        const ping = client.ws.ping;
        await interaction.reply({ content: `🏓 Pong! Latency: **${ping}ms**` });
    }
};
