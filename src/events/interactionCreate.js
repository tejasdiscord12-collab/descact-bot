const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_select') {
                const { guild, user, values } = interaction;
                const type = values[0];

                await interaction.deferReply({ ephemeral: true });

                const ticketId = Math.floor(Math.random() * 9000) + 1000;
                const channelName = `ticket-${type}-${user.username}`;

                try {
                    // Create ticket channel
                    const channel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: user.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks],
                            },
                        ],
                    });

                    // Add support roles if they exist
                    const supportRoles = db.getTicketSupportRoles();
                    for (const roleId of supportRoles) {
                        const role = guild.roles.cache.get(roleId);
                        if (role) {
                            await channel.permissionOverwrites.edit(role, {
                                ViewChannel: true,
                                SendMessages: true,
                                AttachFiles: true,
                                EmbedLinks: true,
                            });
                        }
                    }

                    // Also look for a role named "Support" or "Staff" if none configured
                    if (supportRoles.length === 0) {
                        const staffRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'support' || r.name.toLowerCase() === 'staff');
                        if (staffRole) {
                            await channel.permissionOverwrites.edit(staffRole, {
                                ViewChannel: true,
                                SendMessages: true,
                                AttachFiles: true,
                                EmbedLinks: true,
                            });
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket - ${type.toUpperCase()}`)
                        .setDescription(`Hello ${user}, thank you for reaching out. Please describe your issue and wait for a staff member to assist you.`)
                        .addFields(
                            { name: 'Opened By', value: user.tag, inline: true },
                            { name: 'Category', value: type, inline: true },
                        )
                        .setColor('#2B2D31')
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('claim_ticket')
                                .setLabel('Claim Ticket')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('🙋‍♂️'),
                            new ButtonBuilder()
                                .setCustomId('close_ticket')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🔒'),
                        );

                    await channel.send({ content: `${user} welcome!`, embeds: [embed], components: [row] });

                    db.createTicket({
                        GuildID: guild.id,
                        TicketID: ticketId.toString(),
                        ChannelID: channel.id,
                        Closed: false,
                        Locked: false,
                        Type: type,
                        Claimed: false,
                        ClaimedBy: null,
                        OpenBy: user.id
                    });

                    await interaction.editReply({ content: `✅ Ticket created: ${channel}` });
                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: 'Failed to create ticket channel. Make sure I have "Manage Channels" permission.' });
                }
            }
        } else if (interaction.isButton()) {
            const { guild, user, channel } = interaction;

            if (interaction.customId === 'claim_ticket') {
                const ticket = db.getTicketByChannel(channel.id);
                if (!ticket) return interaction.reply({ content: 'Ticket not found in database.', ephemeral: true });
                if (ticket.Claimed) return interaction.reply({ content: `This ticket is already claimed by <@${ticket.ClaimedBy}>`, ephemeral: true });

                db.claimTicket(channel.id, user.id);

                await channel.permissionOverwrites.edit(user, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true,
                    EmbedLinks: true,
                    ManageChannels: true,
                });

                const embed = new EmbedBuilder()
                    .setDescription(`🙋‍♂️ This ticket has been claimed by ${user}`)
                    .setColor('#FEE75C');

                await interaction.reply({ embeds: [embed] });
            } else if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: 'Ticket will be closed in 5 seconds...', ephemeral: true });

                db.closeTicket(channel.id);

                setTimeout(async () => {
                    try {
                        await channel.delete();
                    } catch (e) {
                        console.error('Failed to delete ticket channel:', e);
                    }
                }, 5000);
            }
        }
    },
};
