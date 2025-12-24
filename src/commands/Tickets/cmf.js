const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmf')
        .setDescription('Open the ticket panel (Safe Mode)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📩  Support')
            .setDescription('Need help? Click the button below to open a ticket.')
            .setColor('#5865F2')
            .setFooter({ text: 'Trusted Support System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cmf_ticket_create')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📩')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: '✅ Panel sent.', flags: MessageFlags.Ephemeral });
    }
};
