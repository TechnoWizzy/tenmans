import {createCustomId, ephemeralReply, getEnv, noReply, reply} from "./utils.ts";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type Interaction, ModalBuilder, TextInputBuilder, TextInputStyle,
} from "discord.js";
import {Game, Team} from "../models/game.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "./tracker.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {leaderboardCache} from "./leaderboard.ts";

export async function handleGameAction(interaction: Interaction, game: Game, action: GameAction) {
    switch (action) {

        case "set-url": {
            if (interaction.isButton()) {
                await interaction.showModal(game.createModal());
                return;
            }

            // if (interaction.isChatInputCommand()) {
            //     const attachment = interaction.options.getAttachment("game-data", true);
            //     const response = await fetch(attachment.url);
            //     if (!response.ok) {
            //         await ephemeralReply(interaction, {content: "Failed to retrieved attached data"});
            //         return;
            //     }
            //
            //     const data = await response.json() as MatchResponse;
            //     const matchId = data.data.attributes.id;
            //     Tracker.setMatchData(matchId, data);
            //     await uploadGame(matchId)
            // }

            if (!interaction.isModalSubmit()) {
                await ephemeralReply(interaction, { content: `This interaction type is temporarily disabled for game uploads.`});
                return;
            }

            const url = interaction.fields.getTextInputValue("url")
            const regex = /https:\/\/tracker\.gg\/valorant\/match\/([0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i;
            const regexMatch = url.match(regex);
            const matchId = regexMatch?.at(1);
            if (!matchId) {
                await ephemeralReply(interaction, { content: "Invalid URL" });
                return;
            }

            game.matchId = matchId;
            await propagateGameChange(interaction, game);
            break;
        }

        case "cancel": {
            if (!interaction.isButton()) {
                await noReply(interaction);
                return;
            }

            const modal = new ModalBuilder()
                .setTitle("Cancel")
                .setCustomId(createCustomId("game", game.id, "cancel-confirm"))
                .setComponents(new ActionRowBuilder<TextInputBuilder>()
                    .setComponents(
                        new TextInputBuilder()
                            .setLabel("Reason")
                            .setPlaceholder("Why was the game cancelled?")
                            .setCustomId(createCustomId("reason"))
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                )

            await interaction.showModal(modal);
            break;
        }

        case "cancel-confirm": {
            if (interaction.isModalSubmit()) {
                const reason = interaction.fields.getTextInputValue("reason");
                game.cancelled = true;
                game.cancelReason = reason;
                await game.save();

                // for (const player of game.players) {
                //     const stats = player.getStats(TermManager.currentTerm.Id);
                //     const timeout = 60 * 1000; // 1 minute
                //     stats.timeout = new Date(Date.now() + timeout);
                //     await player.save();
                // }

                await propagateGameChange(interaction, game);
            } else {
                await ephemeralReply(interaction, { content: "This operation is not supported." });
            }

            break;
        }
    }
}

export async function propagateGameChange(interaction: Interaction, game: Game, silent: boolean = false) {
    const games = await game.fetchAllAfter();
    games.unshift(game);

    const channel = QueueHandler.getChannel();
    const modChannel = QueueHandler.getModChannel();

    if (games.length == 1) {
        if (game.cancelled) {
            const embed = game.createEmbed();
            const components = game.createComponents();
            if (!silent) {
                await channel.send({ content: `Game ${game.id} has been cancelled by <@${interaction.user.id}>.`, embeds: [ embed ] });
                await modChannel.send({ content: `Game ${game.id} has been cancelled by <@${interaction.user.id}>.`, embeds: [ embed ], components: [ components ] });
            }
            return;
        }
    }

    const modifiedPlayers = new Map<string, Player>()

    for (const game of games) {
        const eloChange = await parseGameStats(game, modifiedPlayers);

        const embed = game.createEmbed(eloChange);
        const components = game.createComponents();
        if (!silent) {
            await modChannel.send({ content: `Game ${game.id} has been updated by <@${interaction.user.id}>.`, embeds: [ embed ], components: [ components ] });
        }

        if (!game.isOngoing() && !silent) {
            const winnerText = game.teamRed.hasWon ? "Team Red has won!" : game.teamBlue.hasWon ? "Team Blue has won!" : "Cancelled";
            await channel.send({ content: `Game ${game.id} has been updated by <@${interaction.user.id}>. ${winnerText}`, embeds: [ embed ] });
        }
    }

    const pluralityText = games.length == 1 ? "game update was" : "game updates were";
    await reply(interaction, { content: `${games.length} ${pluralityText} applied successfully.` });


    // Delete leaderboard pages for this term
    leaderboardCache.keys().forEach(key => {
        if (key.includes(game.termId)) {
            leaderboardCache.delete(key);
        }
    });
}

async function parseGameStats(game: Game, modifiedPlayers: Map<string, Player>) {
    for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        const modifiedPlayer = modifiedPlayers.get(player.id);
        if (modifiedPlayer) {
            game.players[i] = modifiedPlayer;
        }
    }

    if (!game.matchId) {
        return;
    }

    const match = await Tracker.fetchMatch(game.matchId);
    if (match == null) {
        return;
    }

    for (const segment of match.data.segments) {
        if (segment.type == "team-summary") {
            const teamId = segment.attributes.teamId;
            const score = segment.stats.roundsWon.value;
            const hasWon = segment.metadata.hasWon;
            if (teamId == "Red") {
                game.teamRed = new Team("Red", game.termId, score, hasWon)
            } else {
                game.teamBlue = new Team("Blue", game.termId, score, hasWon);
            }
        }
    }

    if (!game.teamRed.hasWon && !game.teamBlue.hasWon) {
        throw new Error(`Neither team has won game ${game.id}`);
    }

    let missingPlayers = 0;
    const knownMissingPlayers = game.players
        .filter(player => {
        const regex = /\d{13,}/;
        const match = player.username.match(regex);
        return match && match.length > 0;
        })
        .length;

    for (const segment of match.data.segments) {
        if (segment.type == "player-summary") {
            const username = segment.attributes.platformUserIdentifier;
            const player = game.players.find(player =>
                player.username.toLowerCase() == username.toLowerCase() ||
                player.altUsername?.toLowerCase() == username.toLowerCase());

            if (player == null) {

                if (missingPlayers + 1 > knownMissingPlayers) {
                    throw new Error(`Player ${username} is in game ${game.id} but is not registered on discord.`);
                    // throw new Error(`More players missing than expected (> ${knownMissingPlayers}).`);
                }
                missingPlayers += 1;
                continue;
            }

            const stats = player.getStats(game.termId);
            const agentStats = stats.getAgentStats(segment.metadata.agentKey, {
                name: segment.metadata.agentName,
                color: segment.metadata.agentColor,
            });

            stats.agentId = agentStats.id;
            stats.acs = Math.round(segment.stats.scorePerRound.value);
            stats.kills += segment.stats.kills.value;
            stats.assists += segment.stats.assists.value;
            stats.deaths += segment.stats.deaths.value;
            stats.headshots += segment.stats.headshots.value;
            stats.totalAcs += stats.acs;
            stats.games += 1;

            agentStats.kills += segment.stats.kills.value;
            agentStats.assists += segment.stats.assists.value;
            agentStats.deaths += segment.stats.deaths.value;
            agentStats.headshots += segment.stats.headshots.value;
            agentStats.totalAcs += stats.acs;
            agentStats.games += 1;

            const headshots = segment.stats.headshots.value;
            const hsAccuracy = segment.stats.hsAccuracy.value;
            const totalShots = Math.round(100 * headshots / hsAccuracy);
            stats.totalshots += totalShots;
            agentStats.totalshots += totalShots;

            const teamId = segment.metadata.teamId;
            if (teamId == "Red") {
                game.teamRed.players.push(player);
            } else {
                game.teamBlue.players.push(player);
            }
        }
    }

    // Save game before doing win/loss/elo stats
    await game.save();
    const eloChange = new Map<string, number>();

    // Win/Loss stats + elo
    for (const player of game.players) {
        let team: Team;
        let opponent: Team;

        if (game.teamBlue.players.some(teamPlayer => teamPlayer.id == player.id)) {
            team = game.teamBlue;
            opponent = game.teamRed;
        } else if (game.teamRed.players.some(teamPlayer => teamPlayer.id == player.id)) {
            team = game.teamRed;
            opponent = game.teamBlue;
        } else {
            continue;
        }

        const teamElo = team.getAverageElo();
        const opponentElo = opponent.getAverageElo();
        const opponentScore = opponent.score;
        const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, team.hasWon, game.termId);

        const stats = player.getStats(game.termId);
        const agentStats = stats.getAgentStats(stats.agentId);

        stats.elo += eloDelta;
        eloChange.set(player.id, eloDelta);
        if (team.hasWon) {
            stats.wins += 1;
            agentStats.wins += 1;
        } else {
            stats.losses += 1;
            agentStats.losses += 1;
        }

        await player.save();
        modifiedPlayers.set(player.id, player);
    }

    return eloChange;
}
