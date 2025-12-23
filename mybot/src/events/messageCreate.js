const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const db = require('../database');
const fs = require('fs');

const usersMap = new Map();
const LIMIT = 5;
const TIME = 3000; // 3 seconds

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // Anti-Spam System
        if (usersMap.has(message.author.id)) {
            const userData = usersMap.get(message.author.id);
            let { msgCount, lastMessage } = userData;
            const diff = Date.now() - lastMessage;

            if (diff > TIME) {
                // Reset if time passed
                userData.msgCount = 1;
                userData.lastMessage = Date.now();
            } else {
                userData.msgCount++;
            }

            if (userData.msgCount > LIMIT) {
                try {
                    await message.delete();
                    // Auto-Warn the user
                    db.addWarn(
                        message.guild.id,
                        message.author.id,
                        message.author.tag,
                        client.user.id,
                        client.user.tag,
                        'Automated: Anti-Spam (Sending messages too fast)'
                    );

                    const warnMsg = await message.channel.send(`${message.author}, please do not spam! You have been automatically warned.`);
                    setTimeout(() => warnMsg.delete().catch(() => { }), 5000);
                    return;
                } catch (err) {
                    console.error('Anti-Spam Error:', err);
                }
            }
        } else {
            usersMap.set(message.author.id, {
                msgCount: 1,
                lastMessage: Date.now()
            });
        }
        console.log(`[Message] From ${message.author.tag}: ${message.content}`);

        // Fallback Text Command for Ticket Support
        if (message.content.startsWith('!cmf')) {
            // Temporarily removed permissions check for testing
            // if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

            // const imagePath = './assets/banner.jpg';
            // let files = [];
            /*
            try {
                if (fs.existsSync(imagePath)) {
                    const attachment = new AttachmentBuilder(imagePath, { name: 'banner.jpg' });
                    files.push(attachment);
                }
            } catch (e) {
                console.error('Failed to load support banner:', e.message);
            }
            */

            const embed = new EmbedBuilder()
                .setTitle('📩 Desact.Core | Support Center')
                .setDescription('Welcome to the **Desact.Core Support System**. \n\nNeed help? Click the button below to open a ticket and our staff team will assist you shortly.\n\n**Categories:**\n• Support & Help\n• Server Reports\n• Feedback & Suggestions')
                .setFooter({ text: `Desact.Core • ${message.guild.name}`, iconURL: message.guild.iconURL() })
                .setTimestamp()
                .setColor('#5865F2');

            // if (files.length > 0) embed.setImage('attachment://banner.jpg');

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            const channel = message.mentions.channels.first() || message.channel;
            await channel.send({ embeds: [embed], components: [button] });
            const reply = await message.reply(`Ticket panel sent to ${channel}`);
            setTimeout(() => {
                reply.delete().catch(() => { });
                message.delete().catch(() => { });
            }, 5000);
            return;
        }

        // Invite Check Command (-i)
        if (message.content.toLowerCase().startsWith('-i')) {
            const mentionedUser = message.mentions.users.first();
            const targetUser = mentionedUser || message.author;

            const stats = await db.getInvites(message.guild.id, targetUser.id);
            const totalInvites = (stats?.regular || 0) + (stats?.bonus || 0) - (stats?.left || 0);

            const embed = new EmbedBuilder()
                .setTitle(`✉️ Invites for ${targetUser.username}`)
                .addFields(
                    { name: 'Total Invites', value: `\`${totalInvites}\``, inline: true },
                    { name: 'Regular', value: `\`${stats?.regular || 0}\``, inline: true },
                    { name: 'Fake', value: `\`${stats?.fake || 0}\``, inline: true },
                    { name: 'Left', value: `\`${stats?.left || 0}\``, inline: true }
                )
                .setColor('#5865F2')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            return;
        }

        // Review Text Command (-review)
        if (message.content.toLowerCase().startsWith('-review')) {
            const args = message.content.trim().split(/ +/);
            // Expected format: -review <rating> <comment>
            // args[0] = -review, args[1] = rating, args[2...] = comment

            if (args.length < 3) {
                return message.reply(`❌ Usage: \`-review <1-5> <comment>\`\nExample: \`-review 5 Great server!\``);
            }

            const rating = parseInt(args[1]);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return message.reply('❌ Rating must be a number between 1 and 5.');
            }

            const comment = args.slice(2).join(' ');
            const reviewChannelId = db.getReviewChannel(message.guild.id);

            if (!reviewChannelId) {
                return message.reply('❌ Review channel is not set up.');
            }

            const reviewChannel = await message.guild.channels.fetch(reviewChannelId).catch(() => null);
            if (!reviewChannel) {
                return message.reply('❌ Review channel not found.');
            }

            const stars = '⭐'.repeat(rating);
            const embed = new EmbedBuilder()
                .setTitle('🌟 New Review!')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Rating', value: `${stars} (${rating}/5)`, inline: true },
                    { name: 'Reviewer', value: `${message.author}`, inline: true },
                    { name: 'Comment', value: `\`\`\`${comment}\`\`\`` }
                )
                .setColor('#FEE75C')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await reviewChannel.send({ embeds: [embed] });
            await message.reply('✅ review sent!');
            return;
        }

        // Giveaway Text Command (-gstart)
        if (message.content.toLowerCase().startsWith('-gstart')) {
            // Format: -gstart <duration> <winners> <prize>
            const args = message.content.trim().split(/ +/);

            if (args.length < 4) {
                return message.reply('❌ Usage: `-gstart <duration> <winners> <prize>`\nExample: `-gstart 1h 1 Nitro`');
            }

            const duration = args[1];
            const winnersCount = parseInt(args[2]);
            const prize = args.slice(3).join(' ');

            if (isNaN(winnersCount) || winnersCount < 1) {
                return message.reply('❌ Winners must be a valid number greater than 0.');
            }

            const ms = require('ms');
            const durationMs = ms(duration);
            if (!durationMs) {
                return message.reply('❌ Invalid duration! Use 1m, 1h, 1d etc.');
            }

            try {
                const endTimestamp = Date.now() + durationMs;

                const embed = new EmbedBuilder()
                    .setTitle('🎉 GIVEAWAY 🎉')
                    .setDescription(`React with 🎉 to enter!\n\n**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTimestamp / 1000)}:R>`)
                    .setColor('#FEE75C')
                    .setFooter({ text: `Ends at` })
                    .setTimestamp(endTimestamp);

                const giveawayMsg = await message.channel.send({ embeds: [embed] });
                await giveawayMsg.react('🎉');

                db.createGiveaway({
                    MessageID: giveawayMsg.id,
                    ChannelID: message.channel.id,
                    GuildID: message.guild.id,
                    Prize: prize,
                    Winners: winnersCount,
                    EndAt: endTimestamp,
                    HostedBy: message.author.id,
                    Ended: false
                });

                // Delete command usage to keep chat clean? Optional.
                // message.delete().catch(() => {});
            } catch (err) {
                console.error(err);
                message.reply('❌ Failed to start giveaway.');
            }
            return;
        }

        // Auto Delete Abusive Words
        const badWords = [
            'madarchod', 'madarchor', 'bkl', 'mkc', 'bc', 'randi', 'rand', 'bhosdike',
            'behenchod', 'mc', 'chutiya', 'gand', 'loda', 'lora', 'kutta', 'kamina',
            'saala', 'haramkhor', 'bhadwe', 'bhadwa', 'chinaal', 'raand',
            'lund', 'chut', 'pussy', 'fuck'
        ];
        const content = message.content.toLowerCase().replace(/\s+/g, ''); // Remove spaces to catch loopholes
        const foundBadWord = badWords.some(word => content.includes(word));

        if (foundBadWord) {
            if (message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                try {
                    await message.delete();

                    // Auto-Warn
                    db.addWarn(
                        message.guild.id,
                        message.author.id,
                        message.author.tag,
                        client.user.id,
                        client.user.tag,
                        'Automated: Abusive Language'
                    );

                    const warningMsg = await message.channel.send(`${message.author}, please do not use abusive language! You have been warned.`);
                    setTimeout(() => warningMsg.delete().catch(() => { }), 5000);
                } catch (err) {
                    console.error('Failed to delete abusive message:', err);
                }
            }
            return; // Stop processing if bad word found
        }

        // Custom Commands
        try {
            const customCmd = db.getCustomCommand(message.guild.id, message.content.trim());
            if (customCmd) {
                await message.channel.send(customCmd.Response);
            }
        } catch (error) {
            console.error('Error fetching custom command:', error);
        }
    },
};
