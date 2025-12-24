const { ActivityType } = require('discord.js');
const colors = require('colors');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(colors.cyan(`[Client] :: Logged in as ${client.user.tag}`));
        console.log(colors.green(`[Client] :: Bot Version: v2.0 (Ticket System Updated) 🚀`));
        console.log(colors.yellow(`[Client] :: Interactions should now log to console.`));

        // Cache Invites
        client.guilds.cache.forEach(async (guild) => {
            const firstInvites = await guild.invites.fetch().catch(() => null);
            if (firstInvites) {
                client.invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
                console.log(`[Invites] Cached ${firstInvites.size} invites for guild: ${guild.name}`);
            }
        });

        client.user.setPresence({
            activities: [{ name: '/help | Desact.Core', type: ActivityType.Watching }],
            status: 'online'
        });
    },
};
