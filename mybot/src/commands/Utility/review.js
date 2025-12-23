const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Leave a review for our service.')
        .addIntegerOption(option =>
            option.setName('rating')
                .setDescription('Rating from 1-5 stars')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Your feedback')
                .setRequired(true)
        ),
    async execute(interaction) {
        const rating = interaction.options.getInteger('rating');
        const comment = interaction.options.getString('comment');

        const reviewChannelId = db.getReviewChannel(interaction.guild.id);
        if (!reviewChannelId) {
            return await interaction.reply({ content: '❌ Reviews are not set up yet! Ask an admin to run `/review-setup`.', ephemeral: true });
        }

        const reviewChannel = await interaction.guild.channels.fetch(reviewChannelId).catch(() => null);
        if (!reviewChannel) {
            return await interaction.reply({ content: '❌ Review channel not found. Please contact an admin.', ephemeral: true });
        }

        const stars = '⭐'.repeat(rating);
        const embed = new EmbedBuilder()
            .setTitle('🌟 New Review!')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .addFields(
                { name: 'Rating', value: `${stars} (${rating}/5)`, inline: true },
                { name: 'Reviewer', value: `${interaction.user}`, inline: true },
                { name: 'Comment', value: `\`\`\`${comment}\`\`\`` }
            )
            .setColor('#FEE75C')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await reviewChannel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Thank you for your review! It has been posted.', ephemeral: true });
    }
};
