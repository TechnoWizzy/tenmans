import {Database} from "../database/database.ts";
import {Player, RankEmote} from "./player.ts";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {createCustomId, getEnv, removeFormatChars} from "../utils/utils.ts";
import type {WithId} from "mongodb";
import {TermManager} from "../utils/term.ts";

/**
 * Data model version written on new games. Games without a version predate linked Riot accounts: they are
 * frozen and are never edited or replayed again, so their stats stay exactly as they were computed.
 */
export const CURRENT_GAME_VERSION = 2;

/**
 * Who played which slot of a match. Resolved once, when the match is attached to the game, and reused by every
 * later replay - so renames, newly linked accounts and shared accounts can never change a past game.
 */
export interface Participant {
    /** Discord ID of the player */
    playerId: string;
    /** Riot ID as it appears in the match */
    riotId: string;
    puuid?: string;
    team: TeamName;
    /** Played on a ranked (public, PUUID-linked) account: the game counts toward their stats and elo */
    ranked: boolean;
    resolvedBy: "name" | "puuid" | "elimination";
}

/**
 * Represents a game with teams, players, and other relevant details such as match ID,
 * modifiers, and cancellation status.
 */
export class Game {
    public readonly id: number;
    public termId: string;
    public matchId?: string;
    public teamRed: Team;
    public teamBlue: Team;
    public players: Player[];
    public modifiers: Modifier[];
    public cancelled: boolean;
    public cancelReason?: string;
    /** Absent on legacy games */
    public version?: number;
    /** Resolved match slots for {@link matchId}. Absent on legacy games and until a match is attached. */
    public participants?: Participant[];
    /** When the queue popped. Absent on legacy games. */
    public startedAt?: Date;

    /**
     * Constructs a new instance of a Game.
     *
     * @param {number} id - The unique identifier for the match.
     * @param {string} termId - The ID of the term during which the game was created
     * @param {Player[]} players - The list of players participating in the match.
     * @param {Team} [teamRed] - The red team participating in the match. Defaults to a new red team instance if not provided.
     * @param {Team} [teamBlue] - The blue team participating in the match. Defaults to a new blue team instance if not provided.
     * @param {string} [matchId] - The trackerID for the match, which isn't set until the game is played
     * @param {Modifier[]} [modifiers=[]] - A list of match modifiers, which defaults to an empty array if not provided.
     * @param {boolean} [cancelled=false] - Indicates if the match is canceled. Defaults to false.
     * @param {string} [cancelReason=false] - Indicates the reason a the match is canceled. Defaults to undefined.
     * @param {number} [version] - The data model version. Pass {@link CURRENT_GAME_VERSION} for new games.
     * @param {Participant[]} [participants] - The resolved match slots
     */
    public constructor(id: number, termId?: string, players?: Player[], teamRed?: Team, teamBlue?: Team, matchId?: string, modifiers: Modifier[] = [], cancelled: boolean = false, cancelReason?: string, version?: number, participants?: Participant[]) {
        this.id = id;
        this.termId = termId ?? TermManager.currentTerm.Id
        this.matchId = matchId;
        this.teamRed = teamRed ?? new Team("Red", this.termId);
        this.teamBlue = teamBlue ?? new Team("Blue", this.termId);
        this.players = players ?? [];
        this.modifiers = modifiers;
        this.cancelled = cancelled;
        this.cancelReason = cancelReason;
        this.version = version;
        this.participants = participants;
    }

    /** Legacy games predate linked accounts and are frozen */
    public isLegacy() {
        return (this.version ?? 1) < CURRENT_GAME_VERSION;
    }

    public getParticipant(playerId: string) {
        return this.participants?.find(participant => participant.playerId == playerId);
    }

    /**
     * Whether this game counts toward the player's stats. Before a match is attached, this is whether the
     * player has any ranked account. Legacy games counted for everyone.
     */
    public isRankedFor(player: Player) {
        if (this.isLegacy()) return true;
        const participant = this.getParticipant(player.id);
        return participant ? participant.ranked : player.isRanked();
    }

    /**
     * Average elo of the team's ranked players. Unranked players have no elo and are left out; a team
     * without any ranked players counts as the default 500.
     */
    public getTeamElo(team: Team): number {
        const ranked = team.players.filter(player => this.isRankedFor(player));
        if (ranked.length == 0) return 500;
        return ranked
            .map(player => player.getStats(this.termId).elo)
            .reduce((a, b) => a + b) / ranked.length;
    }

    /**
     * Saves the current game instance to the database. If the game does not already exist, it will be inserted.
     *
     * @return {Promise<Game>} A promise that resolves with the current game instance if the operation is successful.
     * @throws {Error} Throws an error if the save operation fails.
     */
    public async save(): Promise<Game> {
        const query = { id: this.id };
        const update = { $set: this };
        const options = { upsert: true };
        const result = await Database.games.updateOne(query, update, options);
        if (!result.acknowledged) throw new Error(`Unable to save game: ${this.id}`);
        return this;
    }

    /**
     * Creates and returns an EmbedBuilder representation of the game's current state.
     * The embed's title, description, color, and URL are dynamically set based on the game context.
     * If the game has been canceled, the embed reflects this status. Otherwise, it shows details about teams,
     * players, scores, and other relevant information depending on whether the game has concluded or not.
     *
     * @return {EmbedBuilder} An instance of EmbedBuilder containing the structured embed data.
     */
    public createEmbed(eloChange?: Map<string, number>): EmbedBuilder {
        const builder = new EmbedBuilder();
        const term = TermManager.getTerm(this.termId);
        builder.setAuthor({ name: term.Name })
        if (this.cancelled) {
            builder.setTitle(`Game ${this.id} - Cancelled`);
        } else {
            builder.setTitle(`Game ${this.id}`);
        }

        if (this.matchId) {
            builder.setURL(getEnv("TRACKER_URL_MATCH") + this.matchId);
        }

        if (this.teamRed.hasWon || this.teamBlue.hasWon) {
            const teamRedText = this.teamRed.players
                .map(player => this.formatPlayer(player, eloChange?.get(player.id)))
                .join('\n');

            const teamBlueText = this.teamBlue.players
                .map(player => this.formatPlayer(player, eloChange?.get(player.id)))
                .join('\n');

            builder.setDescription(`🔴 Team Red : **${this.teamRed.score}**\n${teamRedText}\n\n🔵 Team Blue: **${this.teamBlue.score}**\n${teamBlueText}`)

            if (this.teamRed.hasWon) {
                builder.setColor(Colors.Red)
            } else if (this.teamBlue.hasWon) {
                builder.setColor(Colors.Blue)
            }
        } else {
            const playerText = this.players
                .map(player => {
                    const stats = player.getStats(this.termId);
                    const emote = `<:test:${player.getEmote(this.termId)}>`;
                    const elo = this.isRankedFor(player) ? `${stats.elo} elo` : "Unranked";
                    return `${emote}: **${player.username}** - ${elo}`;
                })
                .join('\n');


            builder.setDescription(playerText);
        }

        return builder;
    }

    /**
     * Formats the player's information into a string based on their performance, team result, and other stats.
     *
     * @param {Player} player - The player object containing the stats and relevant information about the player.
     * @param {number} eloDelta
     * details.
     * @return {string} A formatted string containing the player's username, updated elo, elo change, and acs, along
     * with an associated rank Emoji.
     */
    private formatPlayer(player: Player, eloDelta: number = 0): string {
        const username = removeFormatChars(player.username);
        if (!this.isRankedFor(player)) {
            const riotId = this.getParticipant(player.id)?.riotId;
            const playedAs = riotId && riotId.toLowerCase() != player.username.toLowerCase()
                ? ` (as ${removeFormatChars(riotId)})` : "";
            return `<:test:${RankEmote.Unrated}>: **${username}**${playedAs} - Unranked`;
        }
        const stats = player.getStats(this.termId);
        const acs = stats.acs;
        const elo = stats.elo
        const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
        const emote = `<:test:${player.getEmote(this.termId)}>`;
        return `${emote}: **${username}** - ${elo} ${eloDeltaString} elo - ${acs} acs`;
    }

    /**
     * Creates and returns a set of button components for game actions such as setting a match URL or canceling the game.
     * These components are attached to the Game Embed in the tenmans mod channel.
     *
     * @return {ActionRowBuilder<ButtonBuilder>} An action row of buttons for interacting with the game, including
     * buttons to set a match URL and cancel the game.
     */
    public createComponents(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel("Set Match URL")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(createCustomId("game", this.id, "set-url"))
                .setDisabled(this.cancelled || this.isLegacy()),
            new ButtonBuilder()
                .setLabel("Cancel Game")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(createCustomId("game", this.id, "cancel"))
                .setDisabled(this.cancelled || this.isLegacy())
        )
    }

    /**
     * Creates and returns a modal instance for setting a game URL.
     *
     * The modal includes a title derived from the game ID, a custom identifier for processing,
     * and a text input component where the user can input a match URL.
     *
     * @return {ModalBuilder} The configured modal instance.
     */
    public createModal(): ModalBuilder {
        return new ModalBuilder()
            .setTitle(`Game ${this.id}`)
            .setCustomId(createCustomId("game", this.id, "set-url"))
            .setComponents(
                new ActionRowBuilder<TextInputBuilder>().setComponents(
                    new TextInputBuilder()
                        .setCustomId(createCustomId("url"))
                        .setLabel("Match URL")
                        .setStyle(TextInputStyle.Short)
                )
            )
    }

    /**
     * Fetches a game record from the database using the provided game ID.
     *
     * @param {number} id - The unique identifier of the game to be fetched.
     * @return {Promise<Object>} - A promise that resolves to the formatted game object.
     * @throws {Error} - Throws an error if the game with the specified ID is not found.
     */
    public static async fetch(id: number): Promise<Game> {
        const query = { id: id };
        const game = await Database.games.findOne(query);
        if (!game) throw new Error(`Game Not Found: ${id}`);
        return formatGame(game);
    }

    public static async fetchByMatchId(matchId: string): Promise<Game> {
        const query = { matchId: matchId };
        const game = await Database.games.findOne(query);
        if (!game) throw new Error(`Game Not Found: ${matchId}`);
        return formatGame(game);
    }

    /**
     * Fetches all games from the database, formats them, and sorts them by their ID in ascending order.
     *
     * @return {Promise<Array>} A promise that resolves to an array of formatted game objects.
     */
    public static async fetchAll(): Promise<Game[]> {
        const games = await Database.games.find().toArray();
        return games
            .map(game => formatGame(game))
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Fetches games associated with a specific player ID.
     *
     * @param {string} id - The unique identifier of the player to search for.
     * @return {Promise<Array>} A promise that resolves to an array of formatted game objects
     * sorted by their game IDs.
     */
    public static async fetchByPlayerId(id: string): Promise<Game[]> {
        const query = { players: { $elemMatch: { id: id } } };
        const games = await Database.games.find(query).toArray();
        return games
            .map(game => formatGame(game))
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Fetches all game records from the database with an ID greater than the current game's ID.
     * Records are formatted and sorted by their ID in ascending order. Because IDs are generated in ascending order,
     * this function returns all games that occur after the current game.
     *
     * @return {Promise<Array>} A promise that resolves to an array of formatted and sorted game records.
     */
    public async fetchAllAfter(): Promise<Game[]> {
        const query = {
            id: {
                $gt: this.id
            },
            termId: this.termId
        };
        const games = await Database.games.find(query).toArray();
        return games
            .map(game => formatGame(game))
            // Legacy games are frozen and never replayed
            .filter(game => !game.isLegacy())
            .sort((a, b) => a.id - b.id);
    }

    public isOngoing() {
        return !this.cancelled && !this.teamRed.hasWon && !this.teamBlue.hasWon;
    }
}

/**
 * Represents a team in a game.
 */
export class Team {
    public name: TeamName;
    public readonly termId: string;
    public score: number;
    public hasWon: boolean;
    public players: Player[];

    /**
     * Constructs a new instance of a Team, initializing its properties with the provided arguments.
     *
     * @param {TeamName} name - The name of the Team
     * @param {string} termId - The ID of the term during which this was created
     * @param {number} score - The number of rounds won by the team, default 0
     * @param {boolean} hasWon - A flag indicating whether the Team won the game, default false
     * @param {Player[]} players - An array of Player objects on this team, default empty array
     */
    public constructor(name: TeamName, termId?: string, score: number = 0, hasWon: boolean = false, players: Player[] = []) {
        this.name = name;
        this.termId = termId ?? TermManager.currentTerm.Id;
        this.score = score;
        this.hasWon = hasWon;
        this.players = players.map(player => Player.from(player));
    }
}

/**
 * Represents a modifier that can apply an Elo multiplier.
 */
export class Modifier {
    eloMultiplier: number;

    /**
     * Constructs a new instance of the class with the specified Elo multiplier.
     *
     * @param {number} eloMultiplier - The multiplier used for Elo calculations.
     */
    public constructor(eloMultiplier: number) {
        this.eloMultiplier = eloMultiplier;
    }
}

/**
 * Formats a game object by creating instances of Player, Team, and Game classes
 * based on the provided data. This ensures all model types are classes and not types when loaded from MongoDB
 *
 * @param {WithId<Game>} game - The game object containing data to be formatted.
 * @return {Game} A new instance of the Game class with formatted player and team data.
 */
function formatGame(game: WithId<Game>): Game {
    const players = game.players.map(player => Player.from(player));
    const teamRed = new Team(game.teamRed.name, game.teamRed.termId, game.teamRed.score, game.teamRed.hasWon, game.teamRed.players);
    const teamBlue = new Team(game.teamBlue.name, game.teamBlue.termId, game.teamBlue.score, game.teamBlue.hasWon, game.teamBlue.players);
    const result = new Game(game.id, game.termId, players, teamRed, teamBlue, game.matchId, game.modifiers, game.cancelled,
        game.cancelReason, game.version, game.participants);
    result.startedAt = game.startedAt;
    return result;
}