const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Removes the timeout/mute from a member.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member to unmute')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');

        if (!target) {
            return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
        }

        try {
            // Passing null completely removes the timeout
            await target.timeout(null);
            return interaction.reply({ content: `Successfully unmuted ${target.user.tag}.` });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to unmute this member.', ephemeral: true });
        }
    }
};
