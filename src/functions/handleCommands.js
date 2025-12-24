const { REST, Routes } = require('discord.js');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async (commandCollection, path) => {
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

        const rest = new REST({ version: '10' }).setToken(process.env.Token);

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');

                // Global Registration (Can take 1 hour)
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: client.commandArray },
                );

                // Guild Specific Registration (Instant - if ID provided)
                if (process.env.GUILD_ID) {
                    await rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                        { body: client.commandArray },
                    );
                    console.log(`Successfully reloaded application (/) commands for GUILD: ${process.env.GUILD_ID}`);
                }

                console.log('Successfully reloaded application (/) commands GLOBALLY.');
            } catch (error) {
                console.error(error);
            }
        })();
    };
};
