const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, AttachmentBuilder } = require('discord.js');
const db = require('../../database');
const fs = require('fs');

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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const { options, guild, channel, user } = interaction;
        const subcommand = options.getSubcommand();

        console.log(`[Ticket Command] Executing subcommand: ${subcommand} by ${user.tag}`);

        // Defer all interactions to prevent "Application did not respond"
        await interaction.deferReply({ ephemeral: ['setup', 'set-category', 'set-section', 'support-role'].includes(subcommand) });

        if (subcommand === 'setup') {
            const channelInput = options.getChannel('channel');
            const imagePath = './assets/banner.jpg';
            const targetChannel = await guild.channels.fetch(channelInput.id);
            let files = [];
            try {
                if (fs.existsSync(imagePath)) {
                    const attachment = new AttachmentBuilder(imagePath, { name: 'banner.jpg' });
                    files.push(attachment);
                }
            } catch (e) {
                console.error('Failed to load ticket banner:', e.message);
            }

            const embed = new EmbedBuilder()
                .setTitle('📩 Nexter Cloud | Support Center')
                .setDescription('Welcome to the **Nexter Cloud Support System**. \n\nNeed help? Click the button below to open a ticket and our staff team will assist you shortly.\n\n**Categories:**\n• Support & Help\n• Server Reports\n• Feedback & Suggestions')
                .setFooter({ text: `Nexter Cloud • ${guild.name}`, iconURL: guild.iconURL() })
                .setTimestamp()
                .setColor('#5865F2');

            if (files.length > 0) embed.setImage('attachment://banner.jpg');

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            await targetChannel.send({ embeds: [embed], components: [button], files: files });
            return await interaction.editReply({ content: `Ticket panel sent to ${targetChannel}` });
        }

        if (subcommand === 'set-category' || subcommand === 'set-section') {
            const category = options.getChannel('category');
            db.setTicketCategory(guild.id, category.id);
            return await interaction.editReply({ content: `New tickets will now be created in the **${category.name}** category (section).` });
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
                .setTitle('📋 Nexter Cloud | Support Roles')
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
            setTimeout(() => {
                channel.delete().catch(() => { });
            }, 5000);
        }
    }
};
