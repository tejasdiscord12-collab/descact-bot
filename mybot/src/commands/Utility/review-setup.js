const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review-setup')
        .setDescription('Sets the channel where reviews will be posted.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to post reviews in')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        db.setReviewChannel(interaction.guild.id, channel.id);

        await interaction.reply({ content: `✅ Reviews will now be posted in ${channel}.`, ephemeral: true });
    }
};
