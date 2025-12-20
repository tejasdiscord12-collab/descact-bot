const { InteractionType, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        console.log(`[Interaction] type: ${interaction.type}, id: ${interaction.id}, user: ${interaction.user.tag}`);
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            console.log(`[Command] ${interaction.commandName} found: ${!!command}`);
            if (!command) return;

            try {
                console.log(`[Command] Executing ${interaction.commandName}...`);
                await command.execute(interaction, client);
                console.log(`[Command] ${interaction.commandName} executed successfully.`);
            } catch (error) {
                console.error(`[Command Error] ${interaction.commandName}:`, error);
                const errorMessage = `There was an error while executing this command!\n\`\`\`${error.message}\`\`\``;
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            try {
                if (interaction.customId === 'create_ticket') {
                    const existingTicket = db.getTicketByOpener(interaction.guild.id, interaction.user.id);
                    if (existingTicket) return interaction.reply({ content: 'You already have an open ticket!', ephemeral: true });

                    await interaction.deferReply({ ephemeral: true });

                    const categoryId = db.getTicketCategory(interaction.guild.id);
                    const supportRoleIds = db.getTicketSupportRoles(interaction.guild.id);

                    console.log(`[Ticket Creation] Guild: ${interaction.guild.id}, Category: ${categoryId}, Support Roles: ${supportRoleIds.join(', ')}`);

                    const permissionOverwrites = [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        }
                    ];

                    if (supportRoleIds.length > 0) {
                        supportRoleIds.forEach(roleId => {
                            permissionOverwrites.push({
                                id: roleId,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                            });
                        });
                        console.log(`[Ticket Creation] Added ${supportRoleIds.length} support roles to overwrites.`);
                    } else {
                        console.log(`[Ticket Creation] No support roles configured for this guild.`);
                    }

                    const channel = await interaction.guild.channels.create({
                        name: `🎫┃${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        permissionOverwrites: permissionOverwrites,
                    });
                    console.log(`[Ticket Creation] Channel created: ${channel.id}`);

                    db.createTicket({
                        GuildID: interaction.guild.id,
                        TicketID: interaction.id,
                        ChannelID: channel.id,
                        Closed: false,
                        Locked: false,
                        Type: 'Support',
                        Claimed: false,
                        OpenBy: interaction.user.id
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('🎫 Nexter Cloud | Ticket Opened')
                        .setDescription(`Hello **${interaction.user.username}**, thank you for reaching out!\n\nOur support team has been notified. Please describe your issue in detail while you wait.\n\n**Quick Actions:**\n🙋‍♂️ **Claim** - Staff can claim this ticket.\n🔒 **Lock** - Disable user messages.\n❌ **Close** - Close this ticket.`)
                        .setFooter({ text: 'Staff will assist you shortly.', iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                        .setColor('#FEE75C');

                    const button = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('claim_ticket')
                                .setLabel('Claim')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('🙋‍♂️'),
                            new ButtonBuilder()
                                .setCustomId('lock_ticket')
                                .setLabel('Lock')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔒'),
                            new ButtonBuilder()
                                .setCustomId('close_ticket')
                                .setLabel('Close')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('❌')
                        );

                    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [button] });
                    await interaction.editReply({ content: `Ticket created: ${channel}` });

                } else if (interaction.customId === 'close_ticket') {
                    const ticket = db.getTicketByChannel(interaction.channel.id);
                    if (!ticket) return interaction.reply({ content: 'Ticket not found in DB!', ephemeral: true });

                    if (ticket.Closed) return interaction.reply({ content: 'Ticket is already closed!', ephemeral: true });

                    db.closeTicket(interaction.channel.id);
                    await interaction.reply({ content: 'Ticket closed by ' + interaction.user.tag });

                    // Delete channel after 5 seconds
                    setTimeout(() => {
                        interaction.channel.delete().catch(() => { });
                    }, 5000);
                } else if (interaction.customId === 'claim_ticket') {
                    const ticket = db.getTicketByChannel(interaction.channel.id);
                    if (!ticket) return interaction.reply({ content: 'Ticket not found in DB!', ephemeral: true });
                    if (ticket.Claimed) return interaction.reply({ content: `This ticket is already claimed by <@${ticket.ClaimedBy}>`, ephemeral: true });

                    db.claimTicket(interaction.channel.id, interaction.user.id);
                    await interaction.reply({ content: `Ticket claimed by ${interaction.user.tag}` });
                } else if (interaction.customId === 'lock_ticket') {
                    const ticket = db.getTicketByChannel(interaction.channel.id);
                    if (!ticket) return interaction.reply({ content: 'Ticket not found in DB!', ephemeral: true });

                    if (ticket.Locked) {
                        // Unlock logic
                        db.unlockTicket(interaction.channel.id);
                        await interaction.channel.permissionOverwrites.edit(ticket.OpenBy, {
                            SendMessages: true
                        });

                        const row = ActionRowBuilder.from(interaction.message.components[0]);
                        row.components[1].setLabel('Lock').setEmoji('🔒');

                        await interaction.update({ components: [row] });
                        return interaction.followUp({ content: 'Ticket has been unlocked.' });
                    } else {
                        // Lock logic
                        db.lockTicket(interaction.channel.id);
                        await interaction.channel.permissionOverwrites.edit(ticket.OpenBy, {
                            SendMessages: false
                        });

                        const row = ActionRowBuilder.from(interaction.message.components[0]);
                        row.components[1].setLabel('Unlock').setEmoji('🔓');

                        await interaction.update({ components: [row] });
                        return interaction.followUp({ content: 'Ticket has been locked.' });
                    }
                }
            } catch (error) {
                console.error('Button Interaction Error:', error);
                const errorMessage = `There was an error processing your request.\n\`\`\`${error.message}\`\`\``;
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        }
    },
};
