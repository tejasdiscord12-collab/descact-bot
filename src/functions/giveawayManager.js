const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = (client) => {
    client.checkGiveaways = async () => {
        if (!db.getGiveaways) return console.log('db.getGiveaways is not defined');
        const giveaways = db.getGiveaways();
        const now = Date.now();

        for (const giveaway of giveaways) {
            if (giveaway.Ended) continue;
            if (giveaway.EndAt <= now) {
                try {
                    const guild = await client.guilds.fetch(giveaway.GuildID).catch(() => null);
                    if (!guild) continue;

                    const channel = await guild.channels.fetch(giveaway.ChannelID).catch(() => null);
                    if (!channel) continue;

                    const message = await channel.messages.fetch(giveaway.MessageID).catch(() => null);
                    if (!message) continue;

                    const reaction = message.reactions.cache.get('🎉');
                    const users = await reaction.users.fetch();
                    const entries = users.filter(u => !u.bot).map(u => u.id);

                    if (entries.length === 0) {
                        await channel.send(`No one entered the giveaway for **${giveaway.Prize}**!`);
                    } else {
                        const winners = [];
                        for (let i = 0; i < giveaway.Winners; i++) {
                            if (entries.length === 0) break;
                            const randomIndex = Math.floor(Math.random() * entries.length);
                            winners.push(entries.splice(randomIndex, 1)[0]);
                        }

                        const winnerMentions = winners.map(w => `<@${w}>`).join(', ');

                        const endEmbed = EmbedBuilder.from(message.embeds[0])
                            .setTitle('🎉 GIVEAWAY ENDED 🎉')
                            .setDescription(`**Prize:** ${giveaway.Prize}\n**Winners:** ${winnerMentions}\n**Hosted By:** <@${giveaway.HostedBy}>`)
                            .setColor('#2F3136')
                            .setFooter({ text: 'Giveaway Ended' });

                        await message.edit({ embeds: [endEmbed] });
                        await channel.send(`Congratulations ${winnerMentions}! You won the **${giveaway.Prize}**! 🎉`);
                    }

                    db.endGiveaway(giveaway.MessageID);
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                    db.endGiveaway(giveaway.MessageID); // Remove anyway to prevent loop
                }
            }
        }
    };

    setInterval(() => {
        client.checkGiveaways();
    }, 30000); // Check every 30 seconds
};
