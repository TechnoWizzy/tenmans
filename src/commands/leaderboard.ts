import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {handleLeaderboardAction} from "../utils/leaderboard.ts";
import {TermManager} from "../utils/term.ts";

const builder = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("10-mans leaderboard")
    .addIntegerOption((integer) => integer
        .setName("page")
        .setDescription("which page to use")
        .setMinValue(1)
        .setRequired(false)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const page = interaction.options.getInteger("page") ?? 1;
    const term = interaction.options.getString("term") ?? TermManager.currentTerm.Id;
    await handleLeaderboardAction(interaction, "refresh", page, term);
}

export class LeaderboardCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}