import {
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction,
    type Guild,
    SlashCommandBuilder
} from "discord.js";
import Command from "./command.ts";
import {createCustomId, ephemeralReply, getEnv} from "../utils/utils.ts";
import Player from "../models/player.ts";
import Tracker from "../utils/tracker.ts";

const builder = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for 10mans")
    .addStringOption((option) => option
        .setName("riot-id")
        .setDescription("Your Riot ID (Name#Tag)")
        .setRequired(true)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
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

    const component = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(createCustomId("register", interaction.user.id, username, Date.now()))
            .setStyle(ButtonStyle.Primary)
            .setLabel("Confirm"),
        new ButtonBuilder()
            .setCustomId(createCustomId("cancel"))
            .setStyle(ButtonStyle.Danger)
            .setLabel("Cancel")
    )

    const profileURL = getEnv("TRN_URL_USER") + encodeURIComponent(username)
    await ephemeralReply(interaction, { content: `Please visit [this URL](${profileURL}) and verify your profile. Then, click "Confirm"`, components: [ component ] });
}

export default class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}