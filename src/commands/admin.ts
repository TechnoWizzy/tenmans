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
import {Command} from "./command.ts";
import {Player} from "../models/player.ts";
import {CURRENT_GAME_VERSION, Game} from "../models/game.ts";
import {formatAccounts, linkRiotAccount} from "../utils/register.ts";
import {TermManager} from "../utils/term.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {Database} from "../database/database.ts";

const builder = new SlashCommandBuilder()
    .setName("admin")
    .setDescription("10-mans management commands")
    .addSubcommand((subcommand) => subcommand
        .setName("link-account")
        .setDescription("link a Riot account to a player, registering them if needed")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("riot-id")
            .setDescription("the Riot ID (Name#Tag)")
            .setRequired(true)
        )
        .addBooleanOption((option) => option
            .setName("primary")
            .setDescription("make it the player's primary account (display name), default false")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("unlink-account")
        .setDescription("unlink a Riot account from a player")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("riot-id")
            .setDescription("the Riot ID (Name#Tag)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("accounts")
        .setDescription("list a player's linked Riot accounts")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user")
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
        .setName("input-game-data")
        .setDescription("manually input game data from API")
        .addAttachmentOption((option) => option
            .setName("game-data")
            .setDescription("the data to be input")
            .setRequired(true)
        )
        .addIntegerOption((option) => option
            .setName("game-id")
            .setDescription("the game ID to be input")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand
        .setName("substitute")
        .setDescription("substitute players in a tenmans game")
        .addUserOption((option) => option
            .setName("sub")
            .setDescription("the player to be subbed in")
            .setRequired(true)
        )
        .addUserOption((option) => option
            .setName("target")
            .setDescription("the player to be subbed out")
            .setRequired(true)
        )
        .addIntegerOption((option) => option
            .setName("game-id")
            .setDescription("the id of the game")
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
        .setName("timeout")
        .setDescription("timeout a user on discord")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("the discord user to be timed out")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("duration")
            .setDescription("the duration of the timeout")
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
        case "link-account": {
            const user = interaction.options.getUser("user", true);
            const riotId = interaction.options.getString("riot-id", true);
            const primary = interaction.options.getBoolean("primary", false) ?? false;
            const { message } = await linkRiotAccount(user.id, riotId, primary);
            await ephemeralReply(interaction, { content: `<@${user.id}>: ${message}` });
            break;
        }

        case "unlink-account": {
            const user = interaction.options.getUser("user", true);
            const riotId = interaction.options.getString("riot-id", true);
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }
            if (player.accounts.length == 1 && player.findAccount(riotId)) {
                await ephemeralReply(interaction, { content: `**${riotId}** is <@${user.id}>'s only account. Link another account first.` });
                return;
            }
            if (!player.unlinkAccount(riotId)) {
                await ephemeralReply(interaction, { content: `**${riotId}** is not linked to <@${user.id}>` });
                return;
            }
            await player.saveAccounts();
            await ephemeralReply(interaction, { content: `Unlinked **${riotId}** from <@${user.id}>` });
            break;
        }

        case "accounts": {
            const user = interaction.options.getUser("user", true);
            const player = await Player.fetch(user.id);
            if (!player) {
                await ephemeralReply(interaction, { content: `Player is not currently registered` });
                return;
            }
            await ephemeralReply(interaction, { content: `<@${user.id}>'s accounts:\n${formatAccounts(player)}` });
            break;
        }

        case "reset-player": {
            const target = interaction.options.getUser("target", true);
            const player = await Player.fetch(target.id)
            if (!player) {
                await ephemeralReply(interaction, { content: "This user does not have any playerdata" });
            } else {
                const stats = player.getStats(TermManager.currentTerm.Id);
                stats.elo = 500;
                stats.games = 0;
                stats.wins = 0;
                stats.losses = 0;
                await player.save();
                await reply(interaction, { content: `${player.username} has been completely reset`})
            }
            break;
        }

        case "substitute": {
            const target = interaction.options.getUser("target", true);
            const sub = interaction.options.getUser("sub", true);
            const gameId = interaction.options.getInteger("game-id", true);

            const game = await Game.fetch(gameId);
            if (!game) {
                await ephemeralReply(interaction, { content: `Sorry, game ${gameId} was not found.` });
                return;
            }

            if (!game.isOngoing()) {
                await ephemeralReply(interaction, { content: `Sorry, players cannot be retroactively subbed into games.` });
                return;
            }

            const targetPlayer = await Player.fetch(target.id);
            if (!targetPlayer) {
                await ephemeralReply(interaction, { content: `<@${target.id}> is not currently registered.` });
                return;
            }

            const subPlayer = await Player.fetch(sub.id);
            if (!subPlayer) {
                await ephemeralReply(interaction, { content: `<@${sub.id}> is not currently registered.` });
                return;
            }

            const targetIndex = game.players.findIndex(player => player.id === targetPlayer.id);
            if (targetIndex == -1) {
                await ephemeralReply(interaction, { content: `<@${target.id}> is not a member of game ${game.id}.` });
                return;
            }

            const isInGame = await subPlayer.isInGame();
            if (isInGame) {
                await ephemeralReply(interaction, { content: `<@${sub.id}> is already a member of another active game.` });
                return;
            }

            game.players[targetIndex] = subPlayer;
            await game.save();

            const embed = game.createEmbed();
            const message = `<@${sub.id}> has been subbed in for <@${target.id}> by <@${interaction.user.id}>`;

            const channel = QueueHandler.getChannel();
            await channel.send({ content: message, embeds: [ embed ] });
            await ephemeralReply(interaction, { content: `Success` });
            break;
        }

        case "input-game-data": {
            const gameId = interaction.options.getInteger("game-id", false);
            const attachment = interaction.options.getAttachment("game-data", false);

            if (!gameId) {
                const gameId = await Database.games.countDocuments();
                const game = await new Game(gameId, TermManager.currentTerm.Id, [], undefined, undefined, undefined,
                    [], false, undefined, CURRENT_GAME_VERSION).save();
                await handleGameAction(interaction, game, "upload-data");
                return;
            }
            if (attachment) {
                const existing = await Database.games.findOne({ id: gameId });
                if (existing && (existing.version ?? 1) < CURRENT_GAME_VERSION) {
                    await ephemeralReply(interaction, { content: `Game ${gameId} predates linked Riot accounts and is frozen. It can no longer be changed.` });
                    return;
                }
                const game = await new Game(gameId, TermManager.currentTerm.Id, [], undefined, undefined, undefined,
                    [], false, undefined, CURRENT_GAME_VERSION).save();
                await handleGameAction(interaction, game, "upload-data");
            }
            else {
                const game = await Game.fetch(gameId);
                await handleGameAction(interaction, game, "set-url");
            }

            break;
        }

        case "ban": {
            /*
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
             */
            await ephemeralReply(interaction, { content: "Bans are currently disabled" });
            break;
        }

        case "timeout": {
            const user = interaction.options.getUser("user", true);
            const duration = interaction.options.getString("duration", false) ?? "forever";
            const member = await interaction.guild?.members.fetch(user.id);

            if (!member) {
                await ephemeralReply(interaction, { content: `User is not currently in the server` });
                return;
            }

            const now = Date.now();
            const date = calculateDate(duration);
            const expire = formatDate(date);
            await member.timeout(date.getTime() - now, "Timed out for tomfoolery");
            await reply(interaction, { content: `<@${user.id}> has been timed out. This will expire ${expire}` });
            break;
        }

        case "unban": {
            /*
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
             */
            await ephemeralReply(interaction, { content: "Bans are currently disabled" });
            break;
        }

        default: {
            await ephemeralReply(interaction, { content: `Unknown subcommand: ${subcommand}` });
        }
    }
}

/**
 * Interface for all administrative subcommands.
 * Requires the Officer role to be used.
 *e
 * Subcommands:
 * - **link-account**: link a Riot account to a player (registering them if needed). Options: user, riot-id,
 *   primary (optional, makes it their display name). Accounts with a private tracker profile are unranked.
 *
 * - **unlink-account**: unlink a Riot account from a player. Options: user, riot-id.
 *
 * - **accounts**: list a player's linked Riot accounts. Options: user.
 *
 * - **reset-player**:
 *   - Name: "reset-player".
 *   - Description: "reset a single player".
 *   - Options:
 *     - User option:
 *       - Name: "target".
 *       - Description: "the player to be reset".
 *       - Required: true.
 *
 * - **reset-all**:
 *   - Name: "reset-all".
 *   - Description: "reset everyone's elo".
 *   - No options.
 *
 * - **input-game-data**:
 *   - Name: "input-game-data".
 *   - Description: "manually input game data from API".
 *   - Options:
 *     - Integer option:
 *       - Name: "game-id".
 *       - Description: "the game ID to be input".
 *       - Required: true.
 *     - Attachment option:
 *       - Name: "game-data".
 *       - Description: "the data to be input".
 *       - Required: true.
 *
 * - **ban**:
 *   - Name: "ban".
 *   - Description: "ban a user from tenmans".
 *   - Options:
 *     - User option:
 *       - Name: "user".
 *       - Description: "the discord user to be banned".
 *       - Required: true.
 *     - String option:
 *       - Name: "duration".
 *       - Description: "the duration of the ban".
 *       - Choices:
 *         - "1 Hour" (value: "hour").
 *         - "1 Day" (value: "day").
 *         - "1 Week" (value: "week").
 *         - "1 Month" (value: "month").
 *         - "1 Year" (value: "year").
 *         - "Forever" (value: "forever").
 *       - Required: false.
 *
 * - **unban**:
 *   - Name: "unban".
 *   - Description: "unban a user from tenmans".
 *   - Options:
 *     - User option:
 *       - Name: "user".
 *       - Description: "the discord user to be unbanned".
 *       - Required: true.
 * @class
 * @extends Command
 *
 */
export class AdminCommand extends Command {
    constructor() {
        super(true, builder, execute);
    }
}