require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const colors = require('colors');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

client.commands = new Collection();
client.events = new Collection();

// Error Handling
process.on('unhandledRejection', (reason, p) => {
    console.log(colors.red(' [Anticrash] :: Unhandled Rejection/Catch'));
    console.log(reason, p);
});
process.on('uncaughtException', (err, origin) => {
    console.log(colors.red(' [Anticrash] :: Uncaught Exception/Catch'));
    console.log(err, origin);
});

// Handler Loading
const functions = fs.readdirSync('./src/functions').filter(file => file.endsWith('.js'));

(async () => {
    for (const file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(client.events, './src/events');
    client.handleCommands(client.commands, './src/commands');

    console.log('Bot is starting...'.green);
    client.login(process.env.Token);
})();
