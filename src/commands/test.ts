import {ChatInputCommandInteraction, type Guild, SlashCommandBuilder, TextChannel} from "discord.js";
import {ephemeralReply, noReply, reply} from "../utils/utils.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
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
            await reply(interaction, { content: "Test 2" });
            break;
        }

        case 3: {
            const { data } = await Bun.file("./tracker.json").json() as MatchResponse;
            const users: string[] = [
                "333424829279633408",
                "204537858269118466",
                "258440905327902720",
                "723394718863458325",
                "398853655681433601",
                "457929277015326740",
                "408612451546955787",
                "751910711218667562",
                "312770439631994880",
                "193850796918571019"
            ];
            const players: Player[] = [];
            for (const segment of data.segments) {
                if (segment.type == "player-summary") {
                    const username = segment.attributes.platformUserIdentifier;
                    const userId = users.pop();
                    if (!userId) throw new Error(
                        `Failed to find userId for username: ${username}`
                    )
                    players.push(new Player(userId, username));
                }
            }

            let text = '';
            for (const player of players) {
                text = text.concat(player.username + " - ");
                await player.save();
            }
            await reply(interaction, { content: text });
            break;
        }

        case 4: {
            const players = await Player.fetchAll();
            for (let i = 0; i < 10; i++) {
                const user = await interaction.client.users.fetch(players[i].id);
                await QueueHandler.join(user, interaction);
            }
            break;
        }

        case 5: {
            const player = await Player.fetch(interaction.user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: "Register" });
                return;
            }
            const stats = player.getStats(TermManager.currentTerm.Id);
            const timeout = 60 * 1000; // 1 minute
            stats.timeout = new Date(Date.now() + timeout);
            await player.save();
            await noReply(interaction);
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