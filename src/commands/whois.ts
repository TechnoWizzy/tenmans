import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply} from "../utils/utils.ts";
import {Player} from "../models/player.ts";

const builder = new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Look up a riot Id")
    .addStringOption(string => (string)
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(24)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const riotId = interaction.options.getString("riotId", true);
    const player = await Player.fetchByUsername(riotId);

    if (!player) {
        await ephemeralReply(interaction, { content: `\`${riotId}\` is not currently registered` });
        return;
    }

    await ephemeralReply(interaction, { content: `\`${riotId}\` is currently registered to <@${player.id}>` });
    return;
}

export class WhoisCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}