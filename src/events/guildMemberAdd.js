const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // --- 1. Auto Role ---
        const autoRoleId = db.getAutoRole(member.guild.id);
        if (autoRoleId) {
            const role = member.guild.roles.cache.get(autoRoleId);
            if (role) {
                await member.roles.add(role).catch(err => console.error(`Failed to give auto-role to ${member.user.tag}:`, err));
            }
        }

        // --- 2. Invite Tracking ---
        const newInvites = await member.guild.invites.fetch().catch(() => null);
        const oldInvites = client.invites.get(member.guild.id);
        const invite = newInvites?.find(i => i.uses > (oldInvites?.get(i.code) || 0));

        // Update Cache
        if (newInvites) {
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }

        let inviterText = 'Unknown';
        let inviteCount = 0;

        if (invite) {
            const inviter = invite.inviter;
            if (inviter) {
                inviterText = `<@${inviter.id}>`;

                // Check if this is a rejoin
                const oldInviterId = db.addMemberInvite(member.guild.id, member.id, inviter.id);

                if (oldInviterId) {
                    // It's a rejoin! 
                    // 1. Decrement "Left" from the OLD inviter
                    db.addInvite(member.guild.id, oldInviterId, -1, 'left');

                    // 2. If it's a NEW inviter (switched link), add to them
                    if (oldInviterId !== inviter.id) {
                        const isFake = (Date.now() - member.user.createdTimestamp) < 1000 * 60 * 60 * 24;
                        await db.addInvite(member.guild.id, inviter.id, 1, isFake ? 'fake' : 'regular');
                    }
                } else {
                    // First time joining
                    const isFake = (Date.now() - member.user.createdTimestamp) < 1000 * 60 * 60 * 24;
                    await db.addInvite(member.guild.id, inviter.id, 1, isFake ? 'fake' : 'regular');
                }

                // Fetch updated invite count for the CURRENT inviter
                const status = db.getInvites(member.guild.id, inviter.id);
                inviteCount = status.Total;
            }
        }

        const channelId = db.getWelcomeChannel(member.guild.id);
        if (!channelId) return;

        const channel = await member.guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(`Hello ${member}, welcome to the server! \n\n**Invited by:** ${inviterText} (**${inviteCount}** invites)`)
            .setColor('#5865F2')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ content: `Welcome ${member}!`, embeds: [embed] });
    }
};
