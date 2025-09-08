import {ChatInputCommandInteraction, EmbedBuilder, type Guild, SlashCommandBuilder, TextChannel} from "discord.js";
import {ephemeralReply, noReply, reply} from "../utils/utils.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {Game} from "../models/game.ts";
import {TermManager} from "../utils/term.ts";
import {confirmReregistration} from "../utils/register.ts";
import {propagateGameChange} from "../utils/game.ts";
import {Tracker} from "../utils/tracker.ts";

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
    if (!interaction.guild) {
        await ephemeralReply(interaction, { content: `No guild` });
        return;
    }

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
                    played: games.length,
                    cancelled: cancelled.length
                }
            }));

            const sorted = stuff2.sort((a, b) =>
                b.cancelled - a.cancelled
            ).slice(0, 25);

            const term = TermManager.currentTerm;
            const embed = new EmbedBuilder()
            embed.setTitle("Cancel Rates by Player")
            embed.setDescription(sorted
                .map(stuff => {
                    const player = stuff.player
                    const index = sorted.indexOf(stuff);
                    const emote = `<:test:${player.getEmote(term.Id)}>`;
                    const rate = `${stuff.cancelled} of ${stuff.played} games cancelled`
                    return `**${index + 1} ${emote} ${player.username}** - ${rate}`;
                })
                .join('\n')
            );

            await reply(interaction, { embeds: [embed] });
            break;
        }

        case 3: {
            let count = 0;
            const players = await Player.fetchAll();
            for (const player of players) {
                try {
                    await interaction.guild.members.fetch(player.id);
                } catch {
                    count++;
                    const games = await Game.fetchByPlayerId(player.id);
                    for (const game of games) {
                        for (let i = 0; i < game.players.length; i++ ) {
                            const gamePlayer = game.players[i];
                            if (gamePlayer.id == player.id) {
                                game.players[i] = new Player(gamePlayer.id, player.id, gamePlayer.stats);
                            }
                        }
                        for (let i = 0; i < game.teamRed.players.length; i++ ) {
                            const redPlayer = game.teamRed.players[i];
                            if (redPlayer.id == player.id) {
                                game.teamRed.players[i] = new Player(redPlayer.id, player.id, redPlayer.stats);
                            }
                        }
                        for (let i = 0; i < game.teamBlue.players.length; i++ ) {
                            const bluePlayer = game.teamBlue.players[i];
                            if (bluePlayer.id == player.id) {
                                game.teamBlue.players[i] = new Player(bluePlayer.id, player.id, bluePlayer.stats);
                            }
                        }

                        await game.save();
                    }
                }
            }

            await ephemeralReply(interaction, { content: `${count}/${players.length} players caught leaving` });
            break;
        }

        case 4: {
            const game = await Game.fetch(25);
            await propagateGameChange(interaction, game);
            break;
        }

        case 5: {
            let count = 0;
            const players = await Player.fetchAll();
            for (const player of players) {
                try {
                    const regex = /\d{13,}/;
                    const match = player.username.match(regex);
                    if (!match ) {
                        const result = await Tracker.fetchProfile(player.username);
                        if (!result) {
                            const games = await Game.fetchByPlayerId(player.id);
                            for (const game of games) {
                                for (let i = 0; i < game.players.length; i++ ) {
                                    const gamePlayer = game.players[i];
                                    if (gamePlayer.id == player.id) {
                                        game.players[i] = new Player(gamePlayer.id, player.id, gamePlayer.stats);
                                    }
                                }
                                for (let i = 0; i < game.teamRed.players.length; i++ ) {
                                    const redPlayer = game.teamRed.players[i];
                                    if (redPlayer.id == player.id) {
                                        game.teamRed.players[i] = new Player(redPlayer.id, player.id, redPlayer.stats);
                                    }
                                }
                                for (let i = 0; i < game.teamBlue.players.length; i++ ) {
                                    const bluePlayer = game.teamBlue.players[i];
                                    if (bluePlayer.id == player.id) {
                                        game.teamBlue.players[i] = new Player(bluePlayer.id, player.id, bluePlayer.stats);
                                    }
                                }

                                await game.save();
                            }
                        }
                    }
                } catch {
                    count++;
                }
            }

            await ephemeralReply(interaction, { content: `${count}/${players.length} players have outdated usernames` });
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