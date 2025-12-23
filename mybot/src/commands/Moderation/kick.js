const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: 'I cannot kick this member!', ephemeral: true });

        await member.kick(reason);
        await interaction.reply({ content: `**${user.tag}** has been kicked. Reason: ${reason}` });
    }
};
