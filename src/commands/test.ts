import {ChatInputCommandInteraction, EmbedBuilder, type Guild, SlashCommandBuilder, TextChannel} from "discord.js";
import {ephemeralReply, reply} from "../utils/utils.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {Game} from "../models/game.ts";
import {TermManager} from "../utils/term.ts";

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
            const stuff1 = await Player.fetchAll();
            const stuff2 = await Promise.all(stuff1.map(async (player: Player) => {
                const games = await Game.fetchByPlayerId(player.id);
                const cancelled = games.filter(game => game.cancelled)
                return {
                    player: player,
                    cancelRate: cancelled.length / games.length
                }
            }));

            const sorted = stuff2.sort((a, b) => b.cancelRate - a.cancelRate);

            const term = TermManager.currentTerm;
            const embed = new EmbedBuilder()
            embed.setTitle("Cancel Rates by Player")
            embed.setDescription(sorted
                .sort((a, b) => b.cancelRate - a.cancelRate)
                .map(stuff => {
                    const player = stuff.player
                    const index = sorted.indexOf(stuff);
                    const rateV = Math.floor(1000 * stuff.cancelRate) * 1000;
                    const rate = `${String(100 * rateV)}% games cancelled`
                    return `**${index + 1} ${player.username}** - ${rate}`;
                })
                .join('\n')
            );

            await reply(interaction, { embeds: [embed] });
            break;
        }

        default: {
            await ephemeralReply(interaction, { content: `unknown test number: ${testNumber}.`});
            break;
        }
    }
}

export class TestCommand extends Command {
    constructor() {
        super(true, builder, execute);
    }
}