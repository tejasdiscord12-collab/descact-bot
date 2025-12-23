const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-welcome')
        .setDescription('Simulates a member joining the server to test the welcome message.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Emit the 'guildMemberAdd' event manually
        // We pass the interaction.member as if they just joined
        await interaction.reply({ content: '🔄 Simulating member join...', ephemeral: true });

        try {
            interaction.client.emit('guildMemberAdd', interaction.member);
            await interaction.followUp({ content: '✅ Simulation complete. Check your welcome channel.', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: '❌ Error simulating join.', ephemeral: true });
        }
    }
};
