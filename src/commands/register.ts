import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import Command from "./command.ts";
import {ephemeralReply} from "../utils/utils.ts";
import Player from "../models/player.ts";

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
}

export default class RegisterCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}