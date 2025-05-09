import {ephemeralReply, getEnv, noReply, reply} from "./utils.ts";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type Interaction,
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

            const uploadGame = async (matchId: string) => {
                const match = await Tracker.fetchMatch(matchId);
                if (match == null) {
                    await ephemeralReply(interaction, { content: `Failed to fetch match, please download match data from this [link](${getEnv("API_URL_MATCH") + matchId}) and upload via command` });
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
                            game.teamBlue = new Team("Blue", game.termId, score, hasWon)
                        }
                    }
                }

                if (!game.teamRed.hasWon && !game.teamBlue.hasWon) {
                    await ephemeralReply(interaction, { content: `Failed to load teams, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                for (const segment of match.data.segments) {
                    if (segment.type == "player-summary") {
                        const username = segment.attributes.platformUserIdentifier;
                        const player = game.players.find(player => player.username.toLowerCase() == username.toLowerCase());

                        if (player == null) {
                            await ephemeralReply(interaction, { content: `Unregistered player in match: ${username}` });
                            return;
                        }

                        player.getStats(game.termId).acs = Math.round(segment.stats.scorePerRound.value);

                        const teamId = segment.metadata.teamId;
                        if (teamId == "Red") {
                            game.teamRed.players.push(player);
                        } else {
                            game.teamBlue.players.push(player);
                        }
                    }
                }

                if (game.teamRed.players.length != 5) {
                    await ephemeralReply(interaction, { content: `Failed to load all players for Team Red, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                if (game.teamBlue.players.length != 5) {
                    await ephemeralReply(interaction, { content: `Failed to load all players for Team Blue, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                if (game.players.length != 10) {
                    await ephemeralReply(interaction, { content: `Failed to load all 10 players, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                game.matchId = matchId;
                game.cancelled = false;
                await propagateGameChange(interaction, game);
            }

            if (interaction.isChatInputCommand()) {
                const attachment = interaction.options.getAttachment("game-data", true);
                const response = await fetch(attachment.url);
                if (!response.ok) {
                    await ephemeralReply(interaction, {content: "Failed to retrieved attached data"});
                    return;
                }

                const data = await response.json() as MatchResponse;
                const matchId = data.data.attributes.id;
                Tracker.setMatchData(matchId, data);
                await uploadGame(matchId)
            } else if (interaction.isModalSubmit()) {
                const url = interaction.fields.getTextInputValue("url")
                const regex = /https:\/\/tracker\.gg\/valorant\/match\/([0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i;
                const match = url.match(regex);
                const matchId = match?.at(1);
                if (!matchId) {
                    await ephemeralReply(interaction, { content: "Invalid URL" });
                    return;
                }
                await uploadGame(matchId);
            }

            break;
        }

        case "cancel": {
            if (!interaction.isButton()) {
                await noReply(interaction);
                return;
            }

            const component = new ActionRowBuilder<ButtonBuilder>()
                .setComponents(
                    new ButtonBuilder()
                        .setLabel("Confirm Cancellation")
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId(["game", game.id, "cancel-confirm"].join(','))
                )
            await ephemeralReply(interaction, { content: "Please confirm, or dismiss. This action is irreversible", components: [ component ] });
            break;
        }

        case "cancel-confirm": {
            game.cancelled = true;
            await game.save();

            if (interaction.isButton()) {
                const embed = game.createEmbed();
                const component = game.createComponents();
                const message = await interaction.message.fetchReference();
                await message.edit({ embeds: [ embed ], components: [ component ] });
            }

            await propagateGameChange(interaction, game);
            break;
        }
    }
}

export async function propagateGameChange(interaction: Interaction, game: Game) {
    const games = await game.fetchAllAfter();
    games.unshift(game);

    const channel = QueueHandler.getChannel();
    const modChannel = QueueHandler.getModChannel();

    if (games.length == 1) {
        if (game.cancelled) {
            const embed = game.createEmbed();
            const components = game.createComponents();
            await channel.send({ content: `Game ${game.id} has been cancelled by <@${interaction.user.id}>.`, embeds: [ embed ] });
            await modChannel.send({ content: `Game ${game.id} has been cancelled by <@${interaction.user.id}>.`, embeds: [ embed ], components: [ components ] });
            return;
        }
    }

    const modifiedPlayers = new Map<string, Player>()
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        if (game.cancelled) {
            for (const player of game.players) {
                const modifiedPlayer = new Player(player.id, player.username, player.stats);
                modifiedPlayers.set(player.id, modifiedPlayer);
            }
            continue;
        }

        game.players = [];
        const teamRed = game.teamRed;
        const teamBlue = game.teamBlue;

        for (let i = 0; i < teamRed.players.length; i++) {
            const player = teamRed.players[i];

            const modifiedPlayer = modifiedPlayers.get(player.id);
            if (modifiedPlayer) { // Copy everything but ACS
                const stats = player.getStats(game.termId);
                const modifiedStats = modifiedPlayer.getStats(game.termId);
                stats.elo = modifiedStats.elo;
                stats.wins = modifiedStats.wins;
                stats.losses = modifiedStats.losses;
                stats.games = modifiedStats.games;
            }
        }

        for (let i = 0; i < teamBlue.players.length; i++) {
            const player = teamBlue.players[i];
            const modifiedPlayer = modifiedPlayers.get(player.id);
            if (modifiedPlayer) {
                const stats = player.getStats(game.termId);
                const modifiedStats = modifiedPlayer.getStats(game.termId);
                stats.elo = modifiedStats.elo;
                stats.wins = modifiedStats.wins;
                stats.losses = modifiedStats.losses;
                stats.games = modifiedStats.games;
            }
        }

        for (let i = 0; i < teamRed.players.length; i++) {
            const player = teamRed.players[i];
            const teamElo = teamRed.getAverageElo();
            const opponentElo = teamBlue.getAverageElo();
            const opponentScore = teamBlue.score;
            const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, teamRed.hasWon, game.termId);
            const modifiedPlayer = new Player(player.id, player.username, player.stats);
            const modifiedStats = modifiedPlayer.getStats(game.termId);
            if (game.id == 0 && teamRed.hasWon) {
                modifiedStats.elo += Math.round(eloDelta * 1.5);
            } else if (game.id == 0) {
                modifiedStats.elo += Math.round(eloDelta * 0.5);
            } else {
                modifiedStats.elo += eloDelta;
            }
            modifiedStats.games += 1;
            if (teamRed.hasWon) {
                modifiedStats.wins += 1;
            } else {
                modifiedStats.losses += 1;
            }
            game.players.push(player);
            modifiedPlayers.set(player.id, modifiedPlayer);
        }

        for (let i = 0; i < teamBlue.players.length; i++) {
            const player = teamBlue.players[i];
            const teamElo = teamBlue.getAverageElo();
            const opponentElo = teamRed.getAverageElo();
            const opponentScore = teamRed.score;
            const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, teamBlue.hasWon, game.termId);
            const modifiedPlayer = new Player(player.id, player.username, player.stats);
            const modifiedStats = modifiedPlayer.getStats(game.termId);
            if (game.id == 0 && teamBlue.hasWon) {
                modifiedStats.elo += Math.round(eloDelta * 1.5);
            } else if (game.id == 0) {
                modifiedStats.elo += Math.round(eloDelta * 0.5);
            } else {
                modifiedStats.elo += eloDelta;
            }
            modifiedStats.games += 1;
            if (teamBlue.hasWon) {
                modifiedStats.wins += 1;
            } else {
                modifiedStats.losses += 1;
            }
            game.players.push(player);
            modifiedPlayers.set(player.id, modifiedPlayer);
        }

        for (const player of modifiedPlayers.values()) {
            await player.save();
        }

        console.log("Saving game ", game.id);
        await game.save();
        const embed = game.createEmbed();
        const components = game.createComponents();
        const winnerText = game.teamRed.hasWon ? "Team Red has won!" : "Team Blue has won!"
        await channel.send({ content: `Game ${game.id} has been updated by <@${interaction.user.id}>. ${winnerText}`, embeds: [ embed ] });
        await modChannel.send({ content: `Game ${game.id} has been updated by <@${interaction.user.id}>.`, embeds: [ embed ], components: [ components ] });
    }

    const pluralityText = games.length == 1 ? "game update was" : "game updates were";
    await reply(interaction, { content: `${games.length} ${pluralityText} applied successfully.` });

    if (interaction.isButton() || interaction.isModalSubmit()) {
        if (interaction.message?.deletable) {
            try {
                await interaction.message?.delete()
            } catch (_) { }
        }
    }

    // Delete leaderboard pages for this term
    leaderboardCache.keys().forEach(key => {
        if (key.includes(game.termId)) {
            leaderboardCache.delete(key);
        }
    });
}