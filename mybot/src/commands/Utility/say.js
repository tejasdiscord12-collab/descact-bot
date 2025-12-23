const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to say')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const message = interaction.options.getString('message');

        // Hide the original command interaction if possible or just reply
        // To make the bot "say" it without the interaction showing, we can delete the reply or use a webhook, 
        // but for now, we'll just send the message to the channel and send an ephemeral confirmation.

        await interaction.channel.send(message);
        await interaction.reply({ content: 'Message sent!', ephemeral: true });
    }
};
