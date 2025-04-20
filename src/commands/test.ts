import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder, TextChannel} from "discord.js";
import {ephemeralReply, reply} from "../utils/utils.ts";
import Command from "./command.ts";

const builder = new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test 10-mans!")
    .addIntegerOption((integer) => integer
        .setName("number")
        .setDescription("test number")
        .setMinValue(1)
        .setMaxValue(5)
        .setRequired(true)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const testNumber = interaction.options.getInteger("number", true);

    switch (testNumber) {
        case 1: {
            await ephemeralReply(interaction, { content: "Test 1" });
            break;
        }

        case 2: {
            await reply(interaction, { content: "Test 2" });
            break;
        }

        default: {
            await ephemeralReply(interaction, { content: `unknown test number: ${testNumber}.`});
            break;
        }
    }
}

export default class TestCommand extends Command {
    constructor() {
        super(true, builder, execute);
    }
}