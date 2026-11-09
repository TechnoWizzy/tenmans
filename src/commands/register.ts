import {
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction,
    type Guild,
    SlashCommandBuilder
} from "discord.js";
import {createCustomId, ephemeralReply, getEnv} from "../utils/utils.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";
import {PRIVATE_PROFILE_NOTICE} from "../utils/register.ts";

const builder = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for 10mans, or link a new / renamed Riot account")
    .addStringOption((option) => option
        .setName("riot-id")
        .setDescription("Your Riot ID (Name#Tag)")
        .setRequired(true)
    )

/**
 * Registers a player, or - for registered players - links a Riot account (new account, renamed account, or a
 * profile made public) and makes it their primary account. Past games are not affected.
 */
async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const player = await Player.fetch(interaction.user.id);
    const riotId = interaction.options.getString("riot-id", true).trim();

    const lookup = await Tracker.lookupAccount(riotId);
    if (lookup.status == "not-found") {
        await ephemeralReply(interaction, { content: `**${riotId}** does not exist. Please double check your Riot ID (Name#Tag).` });
        return;
    }
    if (lookup.status == "error") {
        await ephemeralReply(interaction, { content: `Could not reach tracker to verify **${riotId}**. Please try again later. If this issue continues, please contact an Admin.` });
        return;
    }

    const component = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(createCustomId("register", interaction.user.id, riotId, Date.now()))
            .setStyle(ButtonStyle.Primary)
            .setLabel("Confirm"),
    )

    const profileURL = getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(riotId)
    const action = player ? `link **${riotId}** as your primary account` : `register as **${riotId}**`;
    const notice = lookup.status == "private" ? `\n\n${PRIVATE_PROFILE_NOTICE}` : "";
    await ephemeralReply(interaction, { content: `Please click this [**Link**](${profileURL}) to verify the profile is yours, then click "Confirm" to ${action}. If it is wrong, dismiss and try again.${notice}`, components: [ component ] });
}

export class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}