import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, reply} from "../utils/utils.ts";

const builder = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping 10-mans!")
    .addIntegerOption((integer) => integer
        .setName("number")
        .setDescription("number of players needed")
        .setMinValue(1)
        .setMaxValue(9)
        .setRequired(false)
    )

let lastPing = Date.now();
const cooldown = 1000 * 60 * 5;

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    if (Date.now() - lastPing < cooldown) {
        const seconds = Math.floor((lastPing + cooldown) / 1000)
        await ephemeralReply(interaction, { content: `This command will be available <t:${seconds}:R>`})
        return;
    }

    lastPing = Date.now();
    const number = interaction.options.getInteger("number", false);
    const role = "822549851530461185"
    const content = number ? `<@&${role}> +${number}` : `<@&${role}>`;
    await reply(interaction, { content: content, allowedMentions: { roles: [ role ] } });
}

export class PingCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}