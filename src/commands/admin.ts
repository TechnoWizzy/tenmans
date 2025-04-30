import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type ChatInputCommandInteraction,
    type Guild,
    SlashCommandBuilder
} from "discord.js";
import {calculateDate, createCustomId, ephemeralReply, formatDate, getEnv, reply} from "../utils/utils.ts";
import {handleGameAction} from "../utils/game.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {Game} from "../models/game.ts";

const builder = new SlashCommandBuilder()
    .setName("admin")
    .setDescription("10-mans management commands")
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
    .addSubcommand((subcommand) => subcommand
        .setName("input-game-data")
        .setDescription("manually input game data from API")
        .addIntegerOption((option) => option
            .setName("game-id")
            .setDescription("the game ID to be input")
            .setRequired(true)
        )
        .addAttachmentOption((option) => option
            .setName("game-data")
            .setDescription("the data to be input")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("ban")
        .setDescription("ban a user from tenmans")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user to be banned")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("duration")
            .setDescription("the duration of the ban")
            .setChoices([
                {name: '1 Hour', value: 'hour'},
                {name: '1 Day', value: 'day'},
                {name: '1 Week', value: 'week'},
                {name: '1 Month', value: 'month'},
                {name: '1 Year', value: 'year'},
                {name: 'Forever', value: 'forever'}
            ])
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("unban")
        .setDescription("unban a user from tenmans")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user to be unbanned")
            .setRequired(true)
        )
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case "re-register": {
            const user = interaction.options.getUser("user", true);
            const username = interaction.options.getString("riot-id", true);
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }

            const existingPlayer = await Player.fetchByUsername(username);
            if (existingPlayer != null) {
                await ephemeralReply(interaction, { content: `Another user is already registered as **${username}** - Please re-register them first to free this username` });
                return;
            }

            const component = new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId(createCustomId("re-register",user.id, username, Date.now()))
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("Confirm"),
            )

            const profileURL = getEnv("TRACKER_URL_USER") + encodeURIComponent(username)
            await ephemeralReply(interaction, { content: `Please click this [**Link**](${profileURL}) and verify the profile. Then, click "Confirm"`, components: [ component ] });
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

        case "input-game-data": {
            const gameId = interaction.options.getInteger("game-id", true);
            const game = await Game.fetch(gameId);
            await handleGameAction(interaction, game, "set-url");
            break;
        }

        case "ban": {
            const user = interaction.options.getUser("user", true);
            const duration = interaction.options.getString("duration", false) ?? "forever";
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }

            if (player.stats.bannedUntil.getTime() > Date.now()) {
                await ephemeralReply(interaction, { content: `This user is already banned` });
                return;
            }

            player.stats.bannedUntil = calculateDate(duration);
            const date = formatDate(player.stats.bannedUntil);
            await player.save();
            await QueueHandler.leave(user, interaction, true);
            await reply(interaction, { content: `<@${user.id}> has been banned. They will be unbanned ${date}` });
            break;
        }

        case "unban": {
            const user = interaction.options.getUser("user", true);
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }

            if (player.stats.bannedUntil.getTime() < Date.now()) {
                await ephemeralReply(interaction, { content: `This user is not currently banned` });
                return;
            }

            player.stats.bannedUntil = new Date(0);
            await player.save();
            await reply(interaction, { content: `<@${user.id}> has been unbanned` });
            break;
        }

        default: {
            await ephemeralReply(interaction, { content: `Unknown subcommand: ${subcommand}` });
        }
    }
}

export class AdminCommand extends Command {
    constructor() {
        super(true, builder, execute);
    }
}