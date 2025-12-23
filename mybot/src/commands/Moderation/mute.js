const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeouts a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const user = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });

        await member.timeout(duration * 60 * 1000, reason);
        await interaction.reply({ content: `**${user.tag}** has been muted for ${duration} minutes. Reason: ${reason}` });
    }
};
