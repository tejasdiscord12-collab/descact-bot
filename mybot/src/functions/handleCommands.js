const { REST, Routes } = require('discord.js');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        const folders = fs.readdirSync(path);
        for (const folder of folders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.Token);

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');

                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: client.commandArray },
                );

                console.log('Successfully reloaded application (/) commands GLOBALLY.');
            } catch (error) {
                console.error(error);
            }
        })();

        client.refreshGuildCommands = async () => {
            const rest = new REST({ version: '9' }).setToken(process.env.Token);
            client.guilds.cache.forEach(async (guild) => {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: client.commandArray },
                ).catch(err => console.error(`Failed to update commands for guild ${guild.id}:`, err));
            });
            console.log(`Requested command refresh for ${client.guilds.cache.size} guilds.`);
        };
    };
};
