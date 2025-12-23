const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        await interaction.channel.bulkDelete(amount, true).then(messages => {
            interaction.reply({ content: `Successfully deleted ${messages.size} messages!`, ephemeral: true });
        }).catch(err => {
            console.error(err);
            interaction.reply({ content: 'There was an error while purging messages!', ephemeral: true });
        });
    }
};
