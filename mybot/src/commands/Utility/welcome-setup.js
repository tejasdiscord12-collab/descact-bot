const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Sets up the welcome message channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages in')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        db.setWelcomeChannel(interaction.guild.id, channel.id);
        await interaction.reply({ content: `✅ Welcome messages will now be sent in ${channel}.`, ephemeral: true });
    }
};
