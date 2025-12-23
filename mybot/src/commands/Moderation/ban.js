const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
        if (!member.bannable) return interaction.reply({ content: 'I cannot ban this user. They might be higher than me.', ephemeral: true });

        await member.ban({ reason });
        await interaction.reply({ content: `**${user.tag}** has been banned for: ${reason}` });
    }
};
