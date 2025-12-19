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
        .addSubcommand(subcommand =>
            subcommand.setName('support-role')
                .setDescription('Manage the global support role for all tickets.')
                .addRoleOption(option => option.setName('role').setDescription('The role to set as support role').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const { options, guild, channel, user } = interaction;
        const subcommand = options.getSubcommand();

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

        if (subcommand === 'support-role') {
            const role = options.getRole('role');
            db.setTicketSupportRole(guild.id, role.id);
            return await interaction.editReply({ content: `The global support role has been set to ${role}. This role will now have access to all new tickets.` });
        }

        const ticket = db.getTicketByChannel(channel.id);
        if (!ticket && !['setup', 'set-category', 'support-role'].includes(subcommand)) {
            return await interaction.editReply({ content: 'This is not a ticket channel!' });
        }

        if (subcommand === 'add') {
            const member = options.getMember('user');
            if (!member) return await interaction.editReply({ content: 'Member not found!' });
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
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
            await channel.permissionOverwrites.edit(role.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
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
