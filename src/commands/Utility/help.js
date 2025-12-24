const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands.'),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Desact.Core | Help Menu')
            .setDescription('Here are all the commands currently active on the bot.')
            .addFields(
                { name: '🛠️ Utility', value: '`/ping`, `/invite`, `/invites`, `/serverinfo`, `/userinfo`, `/welcome-setup`, `/autorole-setup`' },
                { name: '🛡️ Moderation', value: '`/ban`, `/kick`, `/warn`, `/purge`' },
                { name: '🎫 Tickets', value: '`/ticket setup`' }
            )
            .setColor('#2B2D31')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Desact.Core | Providing Quality' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
