import {
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction,
    type Guild,
    SlashCommandBuilder
} from "discord.js";
import {createCustomId, ephemeralReply} from "../utils/utils.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";
import {planAccountChange, PRIVATE_PROFILE_NOTICE, profileUrl, toAccount} from "../utils/register.ts";

const builder = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for 10mans, or link a new / renamed Riot account")
    .addStringOption((option) => option
        .setName("riot-id")
        .setDescription("Your Riot ID (Name#Tag)")
        .setRequired(true)
    )

/**
 * Registers a player, or - for registered players - updates a linked account (renamed, or profile made public),
 * replaces their accounts when none is ranked, or asks the mods to approve another account. Past games are not
 * affected.
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

    const change = planAccountChange(player, toAccount(riotId, lookup));
    if (change == "deny-private") {
        await ephemeralReply(interaction, { content: `**${riotId}** has a private tracker profile, so it cannot be added as another account. Make the profile public on tracker.gg and run \`/register\` again.` });
        return;
    }

    const component = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(createCustomId("register", interaction.user.id, riotId, Date.now()))
            .setStyle(ButtonStyle.Primary)
            .setLabel("Confirm"),
    )

    const action = {
        register: `register as **${riotId}**`,
        update: `update **${riotId}**`,
        replace: `replace your current account with **${riotId}**`,
        request: `ask the mods to approve **${riotId}** as another account`,
    }[change];
    const notice = lookup.status == "private" ? `

${PRIVATE_PROFILE_NOTICE}` : "";
    await ephemeralReply(interaction, { content: `Please click this [**Link**](${profileUrl(riotId)}) to verify the profile is yours, then click "Confirm" to ${action}. If it is wrong, dismiss and try again.${notice}`, components: [ component ] });
}

export class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}