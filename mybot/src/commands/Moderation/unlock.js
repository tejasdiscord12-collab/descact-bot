const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: true
        });
        await interaction.reply({ content: '🔓 This channel has been unlocked.' });
    }
};
