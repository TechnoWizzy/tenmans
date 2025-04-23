import type {ButtonInteraction} from "discord.js";
import {ephemeralReply, getEnv} from "./utils.ts";
import Player from "../models/player";
import Game from "../models/game.ts";

export async function confirmRegistration(interaction: ButtonInteraction, userId: string, username: string) {
    const oldPlayer = await Player.fetchOld(userId);
    await new Player(userId, username, oldPlayer?.stats).save();

    if (oldPlayer) {
        await ephemeralReply(interaction, { content: `Successfully registered as **${username}** - Your elo has been set at ${oldPlayer.stats.elo}` });
    } else {
        await ephemeralReply(interaction, { content: `Successfully registered as **${username}**` });
    }
}

export async function confirmReregistration(interaction: ButtonInteraction, userId: string, username: string) {
    const player = await Player.fetch(userId);

    if (!player) {
        await ephemeralReply(interaction, { content: `Could not load old player profile, please contact <@${getEnv("OWNER_ID")}>` });
        return;
    }

    const updatedPlayer = await new Player(userId, username, player.stats).save();
    const games = await Game.fetchByPlayerId(player.id);
    for (const game of games) {
        for (let i = 0; i < game.players.length; i++ ) {
            const gamePlayer = game.players[i];
            if (gamePlayer.id == player.id) {
                game.players[i] = new Player(gamePlayer.id, updatedPlayer.username, gamePlayer.stats);
            }
        }
        for (let i = 0; i < game.teamRed.players.length; i++ ) {
            const redPlayer = game.teamRed.players[i];
            if (redPlayer.id == player.id) {
                game.teamRed.players[i] = new Player(redPlayer.id, updatedPlayer.username, redPlayer.stats);
            }
        }
        for (let i = 0; i < game.teamBlue.players.length; i++ ) {
            const bluePlayer = game.teamBlue.players[i];
            if (bluePlayer.id == player.id) {
                game.teamBlue.players[i] = new Player(bluePlayer.id, updatedPlayer.username, bluePlayer.stats);
            }
        }

        await game.save();
    }

    await ephemeralReply(interaction, { content: `Successfully re-registered as **${username}**` });
}