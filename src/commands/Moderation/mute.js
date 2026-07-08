const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Temporarily mutes a user using Discord Timeouts.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const duration = interaction.options.getInteger('duration');

        if (!target) {
            return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
        }

        try {
            // Converts minutes to milliseconds
            await target.timeout(duration * 60 * 1000);
            return interaction.reply({ content: `Successfully muted ${target.user.tag} for ${duration} minutes.` });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to mute. Check my role hierarchy permissions.', ephemeral: true });
        }
    }
};
