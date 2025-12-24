const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Logging for debugging
        console.log(`[Interaction] Type: ${interaction.type}, ID: ${interaction.customId || 'N/A'}, User: ${interaction.user.tag}`);

        try {
            // 1. Handle Chat Commands
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction, client);
                return;
            }

            // 2. Handle Ticket Select Menu
            if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_create_select') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const { guild, user, values } = interaction;
                const type = values[0]; // purchase, support, or bug
                const channelName = `ticket-${user.username}-${type}`;

                // Check if user already has a ticket (Optional, skipped for simplicity/reliability first)

                // Create Channel
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });

                // Helper to add roles securely
                const addRolePerms = async () => {
                    try {
                        const supportRoles = db.getTicketSupportRoles ? db.getTicketSupportRoles() : (db.ticketSupportRoles || []);
                        let added = false;
                        for (const roleId of supportRoles) {
                            const role = guild.roles.cache.get(roleId);
                            if (role) {
                                await channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true });
                                added = true;
                            }
                        }
                        // Fallback
                        if (!added) {
                            const staff = guild.roles.cache.find(r => ['staff', 'support', 'admin', 'moderator'].includes(r.name.toLowerCase()));
                            if (staff) await channel.permissionOverwrites.edit(staff, { ViewChannel: true, SendMessages: true });
                        }
                    } catch (e) { console.error("Error setting role perms:", e); }
                };
                await addRolePerms();

                // Save to DB
                try {
                    db.createTicket({
                        GuildID: guild.id,
                        TicketID: Date.now().toString(),
                        ChannelID: channel.id,
                        Closed: false,
                        Locked: false,
                        Type: type,
                        Claimed: false,
                        ClaimedBy: null,
                        OpenBy: user.id
                    });
                } catch (e) { console.error("DB Error on Create:", e); }

                // Send Welcome Message
                const embed = new EmbedBuilder()
                    .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Ticket`)
                    .setDescription(`Welcome ${user}! Please state your issue. A staff member will be with you shortly.`)
                    .setColor('Green');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('✋'),
                    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await channel.send({ content: `${user}`, embeds: [embed], components: [row] });
                await interaction.editReply({ content: `✅ Ticket created: ${channel}` });
                return;
            }

            // 3. Handle Ticket Buttons
            if (interaction.isButton()) {
                const { customId, channel, user, guild } = interaction;

                if (customId === 'ticket_claim') {
                    // Claim Logic
                    const ticket = db.getTicketByChannel(channel.id);
                    if (ticket && ticket.Claimed) return interaction.reply({ content: `Already claimed by <@${ticket.ClaimedBy}>`, ephemeral: true });

                    await interaction.deferUpdate();

                    if (ticket) db.claimTicket(channel.id, user.id);

                    // Update Perms
                    await channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });

                    await channel.send({ content: `✅ Ticket claimed by ${user}` });

                } else if (customId === 'ticket_close') {
                    // Close Logic
                    await interaction.reply({ content: 'Closing in 5 seconds...', ephemeral: true });

                    if (db.closeTicket) db.closeTicket(channel.id);

                    setTimeout(() => channel.delete().catch(e => console.log("Delete error", e)), 5000);
                }
            }

        } catch (error) {
            console.error(`[Fatal Interaction Error]`, error);
            if (!interaction.replied && !interaction.deferred) {
                try { await interaction.reply({ content: 'An error occurred.', ephemeral: true }); } catch (e) { }
            }
        }
    }
};
