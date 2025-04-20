import {ephemeralReply, getEnv, noReply} from "./utils.ts";
import {ActionRowBuilder, ButtonBuilder, type ButtonInteraction, ButtonStyle, ModalSubmitInteraction} from "discord.js";
import Game, {Team} from "../models/game.ts";
import Player from "../models/player.ts";
import Tracker from "./tracker.ts";
import QueueHandler from "../queue/queue_handler.ts";

export async function handleGameAction(interaction: ButtonInteraction | ModalSubmitInteraction, game: Game, action: GameAction) {
    switch (action) {

        case "set-url": {
            if (interaction.isModalSubmit()) {
                await interaction.deferUpdate();
                const url = interaction.fields.getTextInputValue("url")
                const segments = url.split("/");
                const matchId = segments[segments.length - 1];
                const trackerMatch = await Tracker.fetchMatch(matchId)
                if (trackerMatch == null) {
                    await ephemeralReply(interaction, { content: `Failed to fetch match, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                let teamRed;
                let teamBlue;
                for (const segment of trackerMatch.data.segments) {
                    if (segment.type == "team-summary") {
                        const teamId = segment.attributes.teamId;
                        const score = segment.stats.roundsWon.value;
                        const hasWon = segment.metadata.hasWon;
                        if (teamId == "Red") {
                            teamRed = new Team("Red", score, hasWon, [])
                        } else {
                            teamBlue = new Team("Blue", score, hasWon, [])
                        }
                    }
                }

                if (!teamRed || !teamBlue) {
                    await ephemeralReply(interaction, { content: `Failed to load teams, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                const players = [];
                for (const segment of trackerMatch.data.segments) {
                    if (segment.type == "player-summary") {
                        const username = segment.attributes.platformUserIdentifier;
                        const player = await Player.fetchByUsername(username);

                        if (player == null) {
                            await ephemeralReply(interaction, { content: `Unregistered player in match: ${username}` });
                            return;
                        }

                        player.stats.acs = segment.stats.scorePerRound.value;
                        players.push(player);

                        const teamId = segment.metadata.teamId;
                        if (teamId == "Red") {
                            teamRed.players.push(player);
                        } else {
                            teamBlue.players.push(player);
                        }
                    }
                }

                if (players.length != 10) {
                    await ephemeralReply(interaction, { content: `Failed to load all 10 players, please contact <@${getEnv("OWNER_ID")}>` });
                    return;
                }

                await propagateGameChange(interaction, game);

            } else {
                await interaction.showModal(game.createModal());
                return;
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

export async function propagateGameChange(interaction: ButtonInteraction | ModalSubmitInteraction, game: Game) {
    await noReply(interaction);
    const games = await game.fetchAllAfter();
    games.unshift(game);

    const channel = QueueHandler.getChannel();
    const modChannel = QueueHandler.getModChannel();

    if (games.length == 1) {
        if (game.cancelled) {
            const embed = game.createEmbed();
            const components = game.createComponents();
            await channel.send({ content: `Game ${game.id} has been cancelled.`, embeds: [ embed ] });
            await modChannel.send({ content: `Game ${game.id} has been cancelled.`, embeds: [ embed ], components: [ components ] });
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
            if (modifiedPlayer) {
                teamRed.players[i] = modifiedPlayer;
            }
        }

        for (let i = 0; i < teamBlue.players.length; i++) {
            const player = teamBlue.players[i];
            const modifiedPlayer = modifiedPlayers.get(player.id);
            if (modifiedPlayer) {
                teamBlue.players[i] = modifiedPlayer;
            }
        }

        for (let i = 0; i < teamRed.players.length; i++) {
            const player = teamRed.players[i];
            const teamElo = teamRed.getAverageElo();
            const opponentElo = teamBlue.getAverageElo();
            const opponentScore = teamBlue.score;
            const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, teamRed.hasWon);
            const modifiedPlayer = new Player(player.id, player.username, player.stats);
            modifiedPlayer.stats.elo += eloDelta;
            modifiedPlayer.stats.games += 1;
            if (teamRed.hasWon) {
                modifiedPlayer.stats.wins += 1;
            } else {
                modifiedPlayer.stats.losses += 1;
            }
            game.players.push(player);
            modifiedPlayers.set(player.id, modifiedPlayer);
        }

        for (let i = 0; i < teamBlue.players.length; i++) {
            const player = teamBlue.players[i];
            const teamElo = teamBlue.getAverageElo();
            const opponentElo = teamRed.getAverageElo();
            const opponentScore = teamRed.score;
            const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, teamBlue.hasWon);
            const modifiedPlayer = new Player(player.id, player.username, player.stats);
            modifiedPlayer.stats.elo += eloDelta;
            modifiedPlayer.stats.games += 1;
            if (teamBlue.hasWon) {
                modifiedPlayer.stats.wins += 1;
            } else {
                modifiedPlayer.stats.losses += 1;
            }
            game.players.push(player);
            modifiedPlayers.set(player.id, modifiedPlayer);
        }

        await game.save();
        const embed = game.createEmbed();
        const components = game.createComponents();
        const winnerText = game.teamRed.hasWon ? "Team Red has won!" : "Team Blue has won!"
        await channel.send({ content: `Game ${game.id} has been updated. ${winnerText}`, embeds: [ embed ] });
        await modChannel.send({ content: `Game ${game.id} has been updated.`, embeds: [ embed ], components: [ components ] });
    }
}