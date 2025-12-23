const db = require('../database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // Invite tracking for leavers
        const newInvites = await member.guild.invites.fetch().catch(() => null);
        const oldInvites = client.invites.get(member.guild.id);

        // Find who invited the person who just left
        // Note: This is a bit complex as we don't know for sure who invited them unless we stored it on join.
        // For now, we'll mark it as a 'left' invite if we can find a matching record in the DB.
        // A better way would be to store the inviter ID in the DB when the user joins.

        // Update Cache
        if (newInvites) {
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }

        // We'll mark the invite as 'left' in the database if we find the Join record
        // (This part is tricky without a dedicated 'members' table, so we'll skip the automated deduction for now 
        // until we add a way to track which user was invited by whom specifically.)
    }
};
