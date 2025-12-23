const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        let member;
        try {
            member = await interaction.guild.members.fetch(user.id);
        } catch (e) {
            member = null;
        }

        if (!member) return interaction.reply({ content: 'User not found in the server.', ephemeral: true });

        db.addWarn(interaction.guild.id, user.id, user.tag, interaction.user.id, interaction.user.tag, reason);

        await interaction.reply({ content: `**${user.tag}** has been warned for: ${reason}` });
    }
};
