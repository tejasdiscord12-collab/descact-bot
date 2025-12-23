const fs = require('fs');

module.exports = (client) => {
    client.handleEvents = async (eventFiles, path) => {
        const files = fs.readdirSync(path).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const event = require(`../events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    };
};
