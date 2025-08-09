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

const builder = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for 10mans")
    .addStringOption((option) => option
        .setName("riot-id")
        .setDescription("Your Riot ID (Name#Tag)")
        .setRequired(true)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    console.log("Register Command!!!");
    const player = await Player.fetch(interaction.user.id);
    if (player != null) {
        await ephemeralReply(interaction, { content: `You are already registered as **${player.username}** - Please contact an Admin to change your registration` });
        return;
    }

    const username = interaction.options.getString("riot-id", true);
    const existingPlayer = await Player.fetchByUsername(username);
    if (existingPlayer != null) {
        await ephemeralReply(interaction, { content: `Another user is already registered as **${username}** - Please contact an Admin for further assistance` });
        return;
    }

    console.log(username);
    const profile = await Tracker.fetchProfile(username);
    if (profile == null) {
        await ephemeralReply(interaction, { content: `Failed to fetch user from Riot API - **${username}** - Please double check your Riot Id. If this issue continues, please contact an Admin.` });
        return;
    }

    const component = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(createCustomId("register", interaction.user.id, username, Date.now()))
            .setStyle(ButtonStyle.Primary)
            .setLabel("Confirm"),
    )

    const profileURL = getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(username)
    await ephemeralReply(interaction, { content: `Please click this [**Link**](${profileURL}) to verify your profile is correct. If your profile is wrong, dismiss and try again. Otherwise, click "Confirm"`, components: [ component ] });
}

export class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}