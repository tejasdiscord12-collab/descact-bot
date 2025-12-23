const { AuditLogEvent } = require('discord.js');

// Simple in-memory rate limit
const limit = new Map();

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) {
        try {
            // Fetch audit logs to see who deleted it
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.ChannelDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            if (!deletionLog) return;
            const { executor } = deletionLog;

            if (executor.id === client.user.id) return; // Ignore self

            const now = Date.now();
            const userData = limit.get(executor.id) || [];
            // cleanup old data
            const recentDeletions = userData.filter(t => now - t < 10000); // 10 seconds

            recentDeletions.push(now);
            limit.set(executor.id, recentDeletions);

            if (recentDeletions.length > 3) {
                const member = await channel.guild.members.fetch(executor.id);
                if (member && member.bannable) {
                    await member.ban({ reason: 'Anti-Nuke: Deleting channels too fast' });
                    console.log(`[Anti-Nuke] Banned ${executor.tag} for deleting channels.`);
                }
            }
        } catch (error) {
            console.error('Anti-Nuke Error:', error);
        }
    }
};
