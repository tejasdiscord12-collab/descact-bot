const { SlashCommandBuilder, PermissionFlagsBits, Role } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole-setup')
        .setDescription('Sets up the role to be given automatically to new members.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give to new members')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        // Check if bot can manage the role
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
        if (role.position >= botMember.roles.highest.position) {
            return await interaction.reply({ content: '❌ I cannot give this role because it is higher than my highest role!', ephemeral: true });
        }

        db.setAutoRole(interaction.guild.id, role.id);
        await interaction.reply({ content: `✅ New members will now automatically receive the ${role} role.`, ephemeral: true });
    }
};
