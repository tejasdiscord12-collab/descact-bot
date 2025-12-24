const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage the ticket system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket panel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the panel to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const { options } = interaction;
        const sub = options.getSubcommand();

        if (sub === 'setup') {
            const channel = options.getChannel('channel');

            const embed = new EmbedBuilder()
                .setTitle('🎫  Create a Ticket')
                .setDescription('Select the category that best matches your issue from the menu below.')
                .setColor('Blurple')
                .setFooter({ text: 'Support System' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_create_select')
                        .setPlaceholder('Select a category...')
                        .addOptions(
                            { label: 'Purchase Support', value: 'purchase', description: 'Help with payments or purchases', emoji: '💳' },
                            { label: 'General Support', value: 'support', description: 'General questions and help', emoji: '🆘' },
                            { label: 'Bug Report', value: 'bug', description: 'Report a glitch or error', emoji: '🐛' }
                        )
                );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: `✅ Ticket panel sent to ${channel}`, flags: MessageFlags.Ephemeral });
        }
    }
};
