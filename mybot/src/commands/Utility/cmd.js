const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Manage custom commands.')
        .addSubcommand(subcommand =>
            subcommand.setName('create')
                .setDescription('Create a custom command')
                .addStringOption(option => option.setName('name').setDescription('Command name').setRequired(true))
                .addStringOption(option => option.setName('response').setDescription('Command response').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Delete a custom command')
                .addStringOption(option => option.setName('name').setDescription('Command name').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('List all custom commands')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');
        const response = interaction.options.getString('response');

        if (subcommand === 'create') {
            const data = db.getCustomCommand(interaction.guild.id, name);
            if (data) return interaction.reply({ content: `Command ${name} already exists!`, ephemeral: true });

            db.addCustomCommand(interaction.guild.id, name, response);
            await interaction.reply({ content: `Custom command ${name} created!` });

        } else if (subcommand === 'delete') {
            const data = db.getCustomCommand(interaction.guild.id, name);
            if (!data) return interaction.reply({ content: `Command ${name} does not exist!`, ephemeral: true });

            db.removeCustomCommand(interaction.guild.id, name);
            await interaction.reply({ content: `Custom command ${name} deleted!` });

        } else if (subcommand === 'list') {
            const data = db.getAllCustomCommands(interaction.guild.id);
            if (!data || data.length === 0) return interaction.reply({ content: 'No custom commands found!', ephemeral: true });

            const list = data.map((cmd, i) => `${i + 1}. ${cmd.CommandName}`).join('\n');
            await interaction.reply({ content: `**Custom Commands**\n${list}` });
        }
    }
};
