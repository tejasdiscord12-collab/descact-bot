const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database');
const fs = require('fs');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system commands.')
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('Sets up the ticket system.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the ticket panel to')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('set-category')
                .setDescription('Sets the category where new tickets will be created.')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('The category for tickets')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('set-section')
                .setDescription('Sets the section (category) where new tickets will be created.')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('The category (section) for tickets')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Adds a user to the ticket.')
                .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Removes a user from the ticket.')
                .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('claim')
                .setDescription('Claims the ticket.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('close')
                .setDescription('Closes the ticket.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('role')
                .setDescription('Adds a role to the ticket.')
                .addRoleOption(option => option.setName('role').setDescription('The role to add').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove-role')
                .setDescription('Removes a role from the ticket.')
                .addRoleOption(option => option.setName('role').setDescription('The role to remove').setRequired(true))
        )
        .addSubcommandGroup(group =>
            group.setName('support-role')
                .setDescription('Manage the global support roles for all tickets.')
                .addSubcommand(subcommand =>
                    subcommand.setName('add')
                        .setDescription('Adds a role to the support team.')
                        .addRoleOption(option => option.setName('role').setDescription('The role to add').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('remove')
                        .setDescription('Removes a role from the support team.')
                        .addRoleOption(option => option.setName('role').setDescription('The role to remove').setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('list')
                        .setDescription('Lists all configured support roles.')
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('set-transcripts')
                .setDescription('Sets the channel where ticket transcripts will be logged.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for transcript logs')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const { options, guild, channel, user } = interaction;
        const subcommand = options.getSubcommand();

        console.log(`[Ticket Command] Executing subcommand: ${subcommand} by ${user.tag}`);

        // Defer all interactions to prevent "Application did not respond"
        await interaction.deferReply({ ephemeral: ['setup', 'set-category', 'set-section', 'support-role', 'set-transcripts'].includes(subcommand) });

        if (subcommand === 'setup') {
            const channelInput = options.getChannel('channel');
            // const imagePath = './assets/banner.jpg'; (Removed)
            const targetChannel = await guild.channels.fetch(channelInput.id);
            let files = [];
            /*
            try {
                if (fs.existsSync(imagePath)) {
                    const attachment = new AttachmentBuilder(imagePath, { name: 'banner.jpg' });
                    files.push(attachment);
                }
            } catch (e) {
                console.error('Failed to load ticket banner:', e.message);
            }
            */

            const embed = new EmbedBuilder()
                .setTitle('🛠️ Help Desk')
                .setDescription(
                    `🚨 **To ensure efficient support for everyone, please adhere to the following guidelines when creating a ticket.**\n\n` +
                    `> **Select the Correct Ticket Type:**\n` +
                    `> First, use the dropdown menu to choose the category that best fits your request (e.g., Purchase, Bug Report, Support). This ensures your ticket goes to the right team immediately.\n\n` +
                    `> **State Your Purpose Clearly:**\n` +
                    `> After selecting a type, describe your reason for the ticket. Provide all necessary details concisely for a faster resolution.\n\n` +
                    `> **Stay Active:**\n` +
                    `> Please remain active in your ticket. Tickets will be automatically closed if we do not receive a reply from you within **48 hours**.\n\n` +
                    `• *Valid Tickets Only: Tickets must contain a clear message.*\n` +
                    `• *Empty tickets will be closed after 10 minutes.*\n\n` +
                    `creating false tickets or opening them without a valid reason will result in a timeout.\n` +
                    `~ **Team Desact.Core**`
                )
                .setFooter({ text: `Desact.Core • ${guild.name}`, iconURL: guild.iconURL() })
                .setTimestamp()
                .setColor('#2B2D31'); // Darker grey like the screenshot

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_select')
                        .setPlaceholder('Select a support option')
                        .addOptions(
                            {
                                label: 'Server/VPS Purchase',
                                description: 'Create a ticket to purchase a new server or VPS hosting plan!',
                                value: 'purchase',
                                emoji: '💳',
                            },
                            {
                                label: 'General Support',
                                description: 'Create this ticket if you have general questions or need assistance!',
                                value: 'support',
                                emoji: '✉️',
                            },
                            {
                                label: 'Server Issue/Bug Report',
                                description: 'Report technical issues with your server or VPS hosting',
                                value: 'bug_report',
                                emoji: '⚠️',
                            },
                        ),
                );

            await targetChannel.send({ embeds: [embed], components: [row] });
            return await interaction.editReply({ content: `Ticket panel sent to ${targetChannel}` });
        }

        if (subcommand === 'set-category' || subcommand === 'set-section') {
            const category = options.getChannel('category');
            db.setTicketCategory(guild.id, category.id);
            return await interaction.editReply({ content: `New tickets will now be created in the **${category.name}** category (section).` });
        }

        if (subcommand === 'set-transcripts') {
            const channel = options.getChannel('channel');
            db.setTranscriptChannel(guild.id, channel.id);
            return await interaction.editReply({ content: `✅ Ticket transcripts will now be logged in ${channel}.` });
        }

        if (subcommand === 'add' && interaction.options.getSubcommandGroup() === 'support-role') {
            const role = options.getRole('role');
            db.addTicketSupportRole(guild.id, role.id);
            return await interaction.editReply({ content: `The role ${role} has been added to the support team. This role will now have access to all new tickets.` });
        }

        if (subcommand === 'remove' && interaction.options.getSubcommandGroup() === 'support-role') {
            const role = options.getRole('role');
            db.removeTicketSupportRole(guild.id, role.id);
            return await interaction.editReply({ content: `The role ${role} has been removed from the support team.` });
        }

        if (subcommand === 'list' && interaction.options.getSubcommandGroup() === 'support-role') {
            const roleIds = db.getTicketSupportRoles(guild.id);
            if (!roleIds || roleIds.length === 0) {
                return await interaction.editReply({ content: 'No support roles have been configured yet.' });
            }
            const roles = roleIds.map(id => `<@&${id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('📋 Desact.Core | Support Roles')
                .setDescription(`The following roles have access to all new tickets:\n\n${roles}`)
                .setColor('#5865F2')
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const ticket = db.getTicketByChannel(channel.id);
        console.log(`[Ticket Command] Subcommand: ${subcommand}, Ticket data found: ${!!ticket}`);

        const exemptSubcommands = ['setup', 'set-category', 'set-section', 'support-role', 'add', 'remove', 'role', 'remove-role'];

        if (!ticket && !exemptSubcommands.includes(subcommand)) {
            console.log(`[Ticket Command] Aborting: Not a ticket channel and not in exemption list: ${exemptSubcommands.join(', ')}`);
            return await interaction.editReply({ content: 'This is not a ticket channel! You can only use commands like `claim` or `close` in a channel created by the bot.' });
        }

        if (subcommand === 'add') {
            console.log(`[Ticket Command] Adding user to ticket...`);
            const member = options.getMember('user');
            if (!member) return await interaction.editReply({ content: 'Member not found!' });
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            console.log(`[Ticket Command] User ${member.user.tag} added.`);
            return await interaction.editReply({ content: `Added ${member} to the ticket.` });
        }

        if (subcommand === 'remove') {
            const member = options.getMember('user');
            if (!member) return await interaction.editReply({ content: 'Member not found!' });
            await channel.permissionOverwrites.delete(member.id);
            return await interaction.editReply({ content: `Removed ${member} from the ticket.` });
        }

        if (subcommand === 'role') {
            const role = options.getRole('role');
            console.log(`[Ticket Command] Adding role ${role.name} to ticket...`);
            await channel.permissionOverwrites.edit(role.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            console.log(`[Ticket Command] Role ${role.name} added.`);
            return await interaction.editReply({ content: `Added ${role} to the ticket.` });
        }

        if (subcommand === 'remove-role') {
            const role = options.getRole('role');
            await channel.permissionOverwrites.delete(role.id);
            return await interaction.editReply({ content: `Removed ${role} from the ticket.` });
        }

        if (subcommand === 'claim') {
            if (ticket.Claimed) return await interaction.editReply({ content: `This ticket is already claimed by <@${ticket.ClaimedBy}>` });

            db.claimTicket(channel.id, user.id);
            await interaction.editReply({ content: `Ticket claimed by ${user}.` });
        }

        if (subcommand === 'close') {
            if (ticket.Closed) return await interaction.editReply({ content: 'This ticket is already closed!' });

            db.closeTicket(channel.id);
            await interaction.editReply({ content: `Ticket closed by ${user}.` });

            // Generate Transcript
            const attachment = await discordTranscripts.createTranscript(channel);

            // DM Transcript to Opener
            try {
                const opener = await guild.members.fetch(ticket.OpenBy).catch(() => null);
                if (opener) await opener.send({ content: `Your ticket in **${guild.name}** has been closed. Here is the transcript:`, files: [attachment] });
            } catch (err) {
                console.error('Failed to DM transcript to opener:', err);
            }

            // DM Transcript to Closer (if different)
            if (user.id !== ticket.OpenBy) {
                try {
                    await user.send({ content: `You closed a ticket in **${guild.name}**. Here is the transcript:`, files: [attachment] });
                } catch (err) {
                    console.error('Failed to DM transcript to closer:', err);
                }
            }

            // Log Transcript to Server Channel
            const transcriptChannelId = db.getTranscriptChannel(guild.id);
            if (transcriptChannelId) {
                try {
                    const logChannel = await guild.channels.fetch(transcriptChannelId).catch(() => null);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('📄 Ticket Transcript')
                            .addFields(
                                { name: 'Ticket ID', value: ticket.TicketID || 'Unknown', inline: true },
                                { name: 'Opened By', value: `<@${ticket.OpenBy}>`, inline: true },
                                { name: 'Closed By', value: `${user}`, inline: true },
                                { name: 'Type', value: ticket.Type || 'Support', inline: true }
                            )
                            .setColor('#5865F2')
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                    }
                } catch (err) {
                    console.error('Failed to log transcript to channel:', err);
                }
            }

            setTimeout(() => {
                channel.delete().catch(() => { });
            }, 5000);
        }
    }
};
