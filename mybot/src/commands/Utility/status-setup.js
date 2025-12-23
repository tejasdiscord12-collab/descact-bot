const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status-setup')
        .setDescription('Sets up a live-updating VPS status message.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the live status in')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        const embed = new EmbedBuilder()
            .setTitle('🖥️ VPS Live Status')
            .setDescription('Initialising status tracking...')
            .setColor('#5865F2');

        const message = await channel.send({ embeds: [embed] });

        db.setStatusSettings(interaction.guild.id, channel.id, message.id);

        await interaction.reply({ content: `✅ Live status message created in ${channel}. It will update every 60 seconds.`, ephemeral: true });
    }
};
