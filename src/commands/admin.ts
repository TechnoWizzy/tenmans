import {type ChatInputCommandInteraction, type Guild, SlashCommandBuilder} from "discord.js";
import {ephemeralReply} from "../utils/utils.ts";
import Command from "./command.ts";
import Player from "../models/player.ts";
import Tracker from "../utils/tracker.ts";
import Game from "../models/game.ts";

const builder = new SlashCommandBuilder()
    .setName("admin")
    .setDescription("10-mans management commands")
    .addSubcommand((subcommand) => subcommand
        .setName("force-register")
        .setDescription("force a registered player's username - DOUBLE CHECK THE RIOT ID FOR CORRECTNESS")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user to be registered")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("riot-id")
            .setDescription("the Riot ID of the user (Name#Tag)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("re-register")
        .setDescription("change a registered player's username")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user to be reregistered")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("riot-id")
            .setDescription("the new Riot ID of the user (Name#Tag)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("reset-player")
        .setDescription("reset a single player")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("the player to be reset")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("reset-all")
        .setDescription("reset everyone's elo")
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case "force-register": {
            const user = interaction.options.getUser("user", true);
            const username = interaction.options.getString("riot-id", true);
            const player = await Player.fetch(user.id);
            if (player != null) {
                await ephemeralReply(interaction, { content: `This person is already registered as **${player.username}**` });
                return;
            }

            const existingPlayer = await Player.fetchByUsername(username);
            if (existingPlayer != null) {
                await ephemeralReply(interaction, { content: `Another user is already registered as **${username}** ` });
                return;
            }

            const oldPlayer = await Player.fetchOld(interaction.user.id);
            await new Player(interaction.user.id, username, oldPlayer?.stats).save();

            if (oldPlayer) {
                await ephemeralReply(interaction, { content: `Successfully registered as **${username}** - Their elo has been set at ${oldPlayer.stats.elo}` });
            } else {
                await ephemeralReply(interaction, { content: `Successfully registered as **${username}**` });
            }
            break;
        }
        case "re-register": {
            const user = interaction.options.getUser("user", true);
            const username = interaction.options.getString("riot-id", true);
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }

            const trackerUser = await Tracker.fetchUser(username);
            if (trackerUser == null) {
                await ephemeralReply(interaction, { content: `Failed to fetch user from Riot API - **${username}**` });
                return;
            }

            const existingPlayer = await Player.fetchByUsername(username);
            if (existingPlayer != null) {
                await ephemeralReply(interaction, { content: `Another user is already registered as **${username}** - Please re-register them first to free this username` });
                return;
            }

            const updatedPlayer = await new Player(player.id, username, player.stats).save();
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
            break;
        }

        case "reset-player": {
            const target = interaction.options.getUser("target", true);
            const player = await Player.fetch(target.id)
            if (!player) {
                await ephemeralReply(interaction, { content: "This user does not have any playerdata" });
            } else {
                player.stats.elo = 500;
                player.stats.games = 0;
                player.stats.wins = 0;
                player.stats.losses = 0;
                await player.save();
                await ephemeralReply(interaction, { content: `${player.username} has been completely reset`})
            }
            break;
        }

        case "reset-all": {
            const players = await Player.fetchAll();

            for (const player of players) {
                player.stats.elo = 500;
                player.stats.games = 0;
                player.stats.wins = 0;
                player.stats.losses = 0;
                await player.save();
            }

            await ephemeralReply(interaction, { content: "Success" });

            break;
        }

        default: {
            await ephemeralReply(interaction, { content: `Unknown subcommand: ${subcommand}` });
        }
    }
}

export default class AdminCommand extends Command {
    constructor() {
        super(true, builder, execute);
    }
}