const db = require('../database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // Find who invited the person who just left
        const inviterId = db.getMemberInviter(member.guild.id, member.id);
        if (inviterId) {
            // Mark as 'left' in the database
            await db.addInvite(member.guild.id, inviterId, 1, 'left');
            // We NO LONGER remove the mapping here so we can track rejoins
        }

        // Update Cache (optional but good practice)
        const newInvites = await member.guild.invites.fetch().catch(() => null);
        if (newInvites) {
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }
    }
};
