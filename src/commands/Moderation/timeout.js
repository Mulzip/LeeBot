import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { TitanBotError, ErrorTypes, handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderationService.js';

// Helper function to turn strings like "10s", "5m", "2d" into milliseconds
function parseDurationToMs(str) {
    const regex = /^(\d+)([smhd])$/i;
    const match = str.match(regex);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a user for a specific duration.")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("User to timeout")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("duration")
                .setDescription("Duration format: 10s, 30m, 5h, 2d (Max 28 days)")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("Reason for the timeout"),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: "moderation",

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn(`Timeout interaction defer failed`, {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                commandName: 'timeout'
            });
            return;
        }

        try {
            const targetUser = interaction.options.getUser("target");
            const member = interaction.options.getMember("target");
            const durationInput = interaction.options.getString("duration");
            const reason = interaction.options.getString("reason") || "No reason provided";

            if (!targetUser) {
                throw new TitanBotError(
                    'Missing target user',
                    ErrorTypes.USER_INPUT,
                    'You must specify a user to timeout.',
                    { subtype: 'invalid_user' },
                );
            }

            if (!member) {
                throw new TitanBotError(
                    "Target not found",
                    ErrorTypes.USER_INPUT,
                    "The target user is not currently in this server."
                );
            }

            // Convert string text to milliseconds
            const durationMs = parseDurationToMs(durationInput);
            const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000; // 28 days maximum limit

            if (!durationMs) {
                throw new TitanBotError(
                    "Invalid format",
                    ErrorTypes.VALIDATION,
                    "Invalid duration format! Please use something like: `10s`, `30m`, `5h`, or `2d`."
                );
            }

            if (durationMs > maxTimeoutMs) {
                throw new TitanBotError(
                    "Duration too long",
                    ErrorTypes.VALIDATION,
                    "Discord limits built-in timeouts to a maximum of 28 days!"
                );
            }

            const result = await ModerationService.timeoutUser({
                guild: interaction.guild,
                member,
                moderator: interaction.member,
                durationMs,
                reason,
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        `⏳ **Timed out** ${targetUser.tag} for ${durationInput}.`,
                        `**Reason:** ${reason}\n**Case ID:** #${result.caseId}`,
                    ),
                ],
            });
        } catch (error) {
            logger.error('Timeout command error:', error);
            await handleInteractionError(interaction, error, { subtype: 'timeout_failed' });
        }
    }
};
