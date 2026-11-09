import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply} from "../utils/utils.ts";
import {Player} from "../models/player.ts";

const builder = new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Look up a riot Id")
    .addStringOption((string) => string
        .setName("riot-id")
        .setDescription("the new Riot ID of the user (Name#Tag)")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(24)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const riotId = interaction.options.getString("riot-id", true);
    const players = await Player.fetchByRiotId(riotId);

    if (players.length == 0) {
        await ephemeralReply(interaction, { content: `\`${riotId}\` is not currently registered` });
        return;
    }

    const mentions = players.map(player => `<@${player.id}>`).join(", ");
    const shared = players.length > 1 ? " (shared account)" : "";
    await ephemeralReply(interaction, { content: `\`${riotId}\` is currently linked to ${mentions}${shared}` });
    return;
}

export class WhoisCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}