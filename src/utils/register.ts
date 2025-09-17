import type {ButtonInteraction, ChatInputCommandInteraction} from "discord.js";
import {ephemeralReply, getEnv} from "./utils.ts";
import {Player} from "../models/player";
import {Game} from "../models/game.ts";

export async function confirmRegistration(interaction: ButtonInteraction, userId: string, username: string) {
    await new Player(userId, username, "").save();
    await ephemeralReply(interaction, { content: `Successfully registered as **${username}**` });
}

export async function confirmReregistration(interaction: ButtonInteraction | ChatInputCommandInteraction, userId: string, username: string) {
    const player = await Player.fetch(userId);

    if (!player) {
        await ephemeralReply(interaction, { content: `Could not load old player profile, please contact <@${getEnv("OWNER_ID")}>` });
        return;
    }

    const updatedPlayer = await new Player(userId, username, player.altUsername, player.stats).save();
    const games = await Game.fetchByPlayerId(player.id);
    for (const game of games) {
        for (let i = 0; i < game.players.length; i++ ) {
            const gamePlayer = game.players[i];
            if (gamePlayer.id == player.id) {
                game.players[i] = new Player(gamePlayer.id, updatedPlayer.username, updatedPlayer.altUsername, gamePlayer.stats);
            }
        }
        for (let i = 0; i < game.teamRed.players.length; i++ ) {
            const redPlayer = game.teamRed.players[i];
            if (redPlayer.id == player.id) {
                game.teamRed.players[i] = new Player(redPlayer.id, updatedPlayer.username, updatedPlayer.altUsername, redPlayer.stats);
            }
        }
        for (let i = 0; i < game.teamBlue.players.length; i++ ) {
            const bluePlayer = game.teamBlue.players[i];
            if (bluePlayer.id == player.id) {
                game.teamBlue.players[i] = new Player(bluePlayer.id, updatedPlayer.username, updatedPlayer.altUsername, bluePlayer.stats);
            }
        }

        await game.save();
    }

    await ephemeralReply(interaction, { content: `Successfully re-registered as **${username}**` });
}

export async function confirmAltUsername(interaction: ButtonInteraction, userId: string, altUsername: string) {
    const player = await Player.fetch(userId);

    if (!player) {
        await ephemeralReply(interaction, { content: `Could not load old player profile, please contact <@${getEnv("OWNER_ID")}>` });
        return;
    }

    await new Player(userId, player.username, altUsername, player.stats).save();
    await ephemeralReply(interaction, { content: `Successfully add the alt **${altUsername}** to <@${player.id}>` });
}