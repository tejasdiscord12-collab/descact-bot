// Force Sync Timestamp: 2025-12-24 11:13:30
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('Send a DM to all members of the server with optional exclusions and filters.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send.')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('If provided, only DM members with this role.')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('exclude_role')
                .setDescription('If provided, members with this role will be skipped.')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('exclude_user')
                .setDescription('If provided, this specific user will be skipped.')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('only_offline')
                .setDescription('If true, only target offline members.')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const targetRole = interaction.options.getRole('role');
        const excludeRole = interaction.options.getRole('exclude_role');
        const excludeUser = interaction.options.getUser('exclude_user');
        const onlyOffline = interaction.options.getBoolean('only_offline');

        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        // 1. Initial Confirmation Prompt
        let filterDesc = '';
        if (targetRole) filterDesc += `\n- Only members with role: **${targetRole.name}**`;
        if (excludeRole) filterDesc += `\n- Excluding members with role: **${excludeRole.name}**`;
        if (excludeUser) filterDesc += `\n- Excluding user: **${excludeUser.tag}**`;
        if (onlyOffline) filterDesc += `\n- **Targeting Offline Members Only**`;

        const confirmEmbed = {
            color: 0x5865F2, // Use Discord Blurple for a clean look
            title: '⚠️ Mass DM Confirmation',
            description: `You are about to send a DM to members in this server.${filterDesc || '\n- All members included.'}\n\n**Message:**\n${message}\n\n**Warning:** Sending many DMs can lead to rate limits. A 2-second delay is added between each message.`,
            footer: { text: 'Nexter Cloud Bot | Safety First' }
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_dm')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_dm')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary),
            );

        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            ephemeral: true
        });

        // 2. Handle Button Interaction
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 1 minute to confirm
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'cancel_dm') {
                await i.update({ content: '🛑 Mass DM cancelled.', embeds: [], components: [] });
                return collector.stop();
            }

            if (i.customId === 'confirm_dm') {
                await i.update({ content: '🚀 Starting Mass DM process... Please wait.', embeds: [], components: [] });
                collector.stop();

                // 3. Start DM Process
                try {
                    await interaction.guild.members.fetch();
                    let members = targetRole ? targetRole.members : interaction.guild.members.cache;

                    // Apply Filters
                    members = members.filter(member => {
                        if (member.user.bot) return false;
                        if (excludeUser && member.id === excludeUser.id) return false;
                        if (excludeRole && member.roles.cache.has(excludeRole.id)) return false;
                        if (onlyOffline) {
                            const status = member.presence ? member.presence.status : 'offline';
                            if (status !== 'offline') return false;
                        }
                        return true;
                    });

                    const total = members.size;
                    let success = 0;
                    let failed = 0;

                    const statusMessage = await interaction.followUp({
                        content: `⏳ Processing: 0/${total} sent...`,
                        ephemeral: true
                    });

                    let count = 0;
                    for (const [id, member] of members) {
                        count++;
                        try {
                            await member.send(message);
                            success++;
                        } catch (err) {
                            failed++;
                        }

                        // Update status every 5 members or at the end
                        if (count % 5 === 0 || count === total) {
                            await statusMessage.edit(`⏳ Processing: ${count}/${total} (✅ ${success} | ❌ ${failed})`).catch(() => { });
                        }

                        if (count < total) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }

                    await interaction.followUp({
                        content: `✅ **Mass DM Complete**\nTotal: ${total}\nSuccess: ${success}\nFailed: ${failed}`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Error processing DMs:', error);
                    await interaction.followUp({ content: '❌ An error occurred during the Mass DM process.', ephemeral: true });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ content: '⏰ Confirmation timed out.', embeds: [], components: [] }).catch(() => { });
            }
        });
    }
};
