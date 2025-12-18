const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, AttachmentBuilder } = require('discord.js');
const db = require('../../database');

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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const { options, guild, channel, user } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === 'setup') {
            const channelInput = options.getChannel('channel');
            const targetChannel = await guild.channels.fetch(channelInput.id);

            const imagePath = '/Users/tejas/.gemini/antigravity/brain/ca258d96-5c9d-49b3-9672-84441dc6f4b7/uploaded_image_1766042332585.jpg';
            const attachment = new AttachmentBuilder(imagePath, { name: 'banner.jpg' });

            const embed = new EmbedBuilder()
                .setTitle('📩 Nexter Cloud | Support Center')
                .setDescription('Welcome to the **Nexter Cloud Support System**. \n\nNeed help? Click the button below to open a ticket and our staff team will assist you shortly.\n\n**Categories:**\n• Support & Help\n• Server Reports\n• Feedback & Suggestions')
                .setImage('attachment://banner.jpg')
                .setFooter({ text: `Nexter Cloud • ${guild.name}`, iconURL: guild.iconURL() })
                .setTimestamp()
                .setColor('#5865F2');

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            await targetChannel.send({ embeds: [embed], components: [button], files: [attachment] });
            return await interaction.reply({ content: `Ticket panel sent to ${targetChannel}`, ephemeral: true });
        }

        if (subcommand === 'set-category') {
            const category = options.getChannel('category');
            db.setTicketCategory(guild.id, category.id);
            return await interaction.reply({ content: `New tickets will now be created in the **${category.name}** category.`, ephemeral: true });
        }

        const ticket = db.getTicketByChannel(channel.id);
        if (!ticket) return interaction.reply({ content: 'This is not a ticket channel!', ephemeral: true });

        if (subcommand === 'add') {
            const member = options.getMember('user');
            if (!member) return interaction.reply({ content: 'Member not found!', ephemeral: true });
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            return await interaction.reply({ content: `Added ${member} to the ticket.` });
        }

        if (subcommand === 'remove') {
            const member = options.getMember('user');
            if (!member) return interaction.reply({ content: 'Member not found!', ephemeral: true });
            await channel.permissionOverwrites.delete(member.id);
            return await interaction.reply({ content: `Removed ${member} from the ticket.` });
        }

        if (subcommand === 'claim') {
            if (ticket.Claimed) return interaction.reply({ content: `This ticket is already claimed by <@${ticket.ClaimedBy}>`, ephemeral: true });

            db.claimTicket(channel.id, user.id);
            await interaction.reply({ content: `Ticket claimed by ${user}.` });
        }

        if (subcommand === 'close') {
            if (ticket.Closed) return interaction.reply({ content: 'This ticket is already closed!', ephemeral: true });

            db.closeTicket(channel.id);
            await interaction.reply({ content: `Ticket closed by ${user}.` });
            setTimeout(() => {
                channel.delete().catch(() => { });
            }, 5000);
        }
    }
};
