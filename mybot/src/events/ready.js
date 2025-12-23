const { ActivityType } = require('discord.js');
const colors = require('colors');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(colors.cyan(`[Client] :: Logged in as ${client.user.tag}`));

        // Cache Invites
        client.invites = new Map();
        client.guilds.cache.forEach(async (guild) => {
            const firstInvites = await guild.invites.fetch().catch(() => null);
            if (firstInvites) {
                client.invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
            }
        });

        await client.refreshGuildCommands();

        client.user.setPresence({
            activities: [{ name: '/help | Desact.Core', type: ActivityType.Watching }],
            status: 'online'
        });
    },
};
