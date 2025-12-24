const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        console.log(`[Interaction] Type: ${interaction.type}, ID: ${interaction.customId || 'N/A'}, User: ${interaction.user.tag}`);

        try {
            // 1. Chat Commands
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction, client);
                return;
            }

            // 2. Buttons
            if (interaction.isButton()) {
                const { customId, channel, user, guild } = interaction;

                // --- CREATE TICKET ---
                if (customId === 'cmf_ticket_create') {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const ticketId = Math.floor(Math.random() * 9000) + 1000;
                    const channelName = `ticket-${user.username}-${ticketId}`;

                    // Create Channel
                    const ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                        ]
                    });

                    // Add Staff Roles
                    try {
                        const supportRoles = db.getTicketSupportRoles ? db.getTicketSupportRoles() : [];
                        for (const roleId of supportRoles) {
                            const role = guild.roles.cache.get(roleId);
                            if (role) await ticketChannel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true });
                        }
                    } catch (e) { console.error("Role Error:", e); }

                    // Save DB
                    db.createTicket({
                        GuildID: guild.id,
                        TicketID: ticketId.toString(),
                        ChannelID: ticketChannel.id,
                        Closed: false,
                        Locked: false,
                        Type: 'general',
                        Claimed: false,
                        ClaimedBy: null,
                        OpenBy: user.id
                    });

                    // Send Embed
                    const embed = new EmbedBuilder()
                        .setTitle('Ticket Created')
                        .setDescription(`Hello ${user}! Support will be with you shortly.`)
                        .setColor('Green');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('cmf_ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('✋'),
                        new ButtonBuilder().setCustomId('cmf_ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                    );

                    await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
                    await interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}` });
                }

                // --- CLAIM TICKET ---
                else if (customId === 'cmf_ticket_claim') {
                    const ticket = db.getTicketByChannel(channel.id);
                    if (ticket && ticket.Claimed) return interaction.reply({ content: `Already claimed by <@${ticket.ClaimedBy}>`, flags: MessageFlags.Ephemeral });

                    await interaction.deferUpdate();
                    if (ticket) db.claimTicket(channel.id, user.id);

                    await channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
                    await channel.send({ content: `✅ Ticket claimed by ${user}` });
                }

                // --- CLOSE TICKET ---
                else if (customId === 'cmf_ticket_close') {
                    await interaction.reply({ content: 'Closing in 5 seconds...', flags: MessageFlags.Ephemeral });
                    if (db.closeTicket) db.closeTicket(channel.id);
                    setTimeout(() => channel.delete().catch(() => { }), 5000);
                }
            }
        } catch (error) {
            console.error('[Interaction Error]', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral }).catch(() => { });
            }
        }
    }
};
