const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutes a member in the server using Discord Timeouts.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member you want to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), // Only admins/mods can use this

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const duration = interaction.options.getInteger('duration');

        if (!target) {
            return interaction.reply({ content: 'I cannot find that member in this server.', ephemeral: true });
        }

        try {
            // Convert minutes to milliseconds
            await target.timeout(duration * 60 * 1000);
            return interaction.reply({ content: `Successfully muted ${target.user.tag} for ${duration} minutes.` });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to mute the member. Make sure my role is higher than theirs!', ephemeral: true });
        }
    },
};
