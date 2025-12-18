const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Shows the number of invites a user has.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check invites for')),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const stats = db.getInvites(interaction.guild.id, targetUser.id);

        const embed = new EmbedBuilder()
            .setTitle(`✉️ Invites for ${targetUser.username}`)
            .addFields(
                { name: 'Total Invites', value: `\`${stats.Total}\``, inline: true },
                { name: 'Regular', value: `\`${stats.Regular}\``, inline: true },
                { name: 'Fake', value: `\`${stats.Fake}\``, inline: true },
                { name: 'Left', value: `\`${stats.Left}\``, inline: true }
            )
            .setColor('#5865F2')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
