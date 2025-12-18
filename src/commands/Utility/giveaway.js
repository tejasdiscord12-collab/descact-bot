const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways in the server.')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start a new giveaway.')
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1h, 1d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true))
                .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'You need `Manage Messages` permission to use this.', ephemeral: true });
        }

        const duration = interaction.options.getString('duration');
        const winnersCount = interaction.options.getInteger('winners');
        const prize = interaction.options.getString('prize');

        const durationMs = ms(duration);
        if (!durationMs) return interaction.reply({ content: 'Invalid duration format! Use 1h, 1d, etc.', ephemeral: true });

        const endTimestamp = Date.now() + durationMs;

        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`React with 🎉 to enter!\n\n**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTimestamp / 1000)}:R>`)
            .setColor('#FEE75C')
            .setFooter({ text: `Ends at` })
            .setTimestamp(endTimestamp);

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('🎉');

        db.createGiveaway({
            MessageID: message.id,
            ChannelID: interaction.channel.id,
            GuildID: interaction.guild.id,
            Prize: prize,
            Winners: winnersCount,
            EndAt: endTimestamp,
            HostedBy: interaction.user.id
        });
    }
};
