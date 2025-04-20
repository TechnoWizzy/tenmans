import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import Command from "./command.ts";
import {ephemeralReply} from "../utils/utils.ts";
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
    const user = await Tracker.fetchUser(username);

    if (user == null) {
        await ephemeralReply(interaction, { content: `Failed to fetch user from Riot API - **${username}** - This RiotId does not exist` });
        return;
    }

    const existingPlayer = await Player.fetchByUsername(username);
    if (existingPlayer != null) {
        await ephemeralReply(interaction, { content: `Another user is already registered as **${username}** - Please contact an Admin for further assistance` });
        return;
    }

    await new Player(interaction.user.id, username).save();
    await ephemeralReply(interaction, { content: `Successfully registered as **${username}**` });
}

export default class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}