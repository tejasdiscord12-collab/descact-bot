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
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildInvites,
    ]
});

client.commands = new Collection();
client.events = new Collection();
client.invites = new Map();

// Error Handling
process.on('unhandledRejection', (reason, p) => {
    console.log(colors.red(' [Anticrash] :: Unhandled Rejection/Catch'));
    console.log(reason, p);
});
process.on('uncaughtException', (err, origin) => {
    console.log(colors.red(' [Anticrash] :: Uncaught Exception/Catch'));
    console.log(err, origin);
});

client.on('error', (error) => console.log(colors.red(` [Error] :: ${error}`)));
client.on('warn', (info) => console.log(colors.yellow(` [Warn] :: ${info}`)));

// Handler Loading
const functions = fs.readdirSync('./src/functions').filter(file => file.endsWith('.js'));

(async () => {
    for (const file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(client.events, './src/events');
    client.handleCommands(client.commands, './src/commands');

    console.log('Bot is starting...'.green);

    const token = process.env.Token || process.env.token || process.env.TOKEN;

    if (!token) {
        console.log(colors.red(' [Error] :: No Token found in .env file! Make sure it says Token=YOUR_TOKEN'));
        process.exit(1);
    }

    client.login(token.trim()).catch(err => {
        if (err.code === 'TokenInvalid') {
            console.log(colors.red(' [Error] :: The token you provided is INVALID!'));
            console.log(colors.yellow(' Please Reset your token in the Discord Developer Portal and update your .env file.'));
        } else {
            console.error(err);
        }
    });
})();
