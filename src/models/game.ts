import {Database} from "../database/database.ts";
import {Player} from "./player.ts";
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
import {createCustomId, getEnv} from "../utils/utils.ts";
import type {WithId} from "mongodb";
import {TermManager} from "../utils/term.ts";

/**
 * Represents a game with teams, players, and other relevant details such as match ID,
 * modifiers, and cancellation status.
 */
export class Game {
    public readonly id: number;
    public readonly termId: string;
    public matchId?: string;
    public teamRed: Team;
    public teamBlue: Team;
    public players: Player[];
    public modifiers: Modifier[];
    public cancelled: boolean;

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
     */
    public constructor(id: number, termId?: string, players?: Player[], teamRed?: Team, teamBlue?: Team, matchId?: string, modifiers: Modifier[] = [], cancelled: boolean = false) {
        this.id = id;
        this.termId = termId ?? TermManager.currentTerm.Id
        this.matchId = matchId;
        this.teamRed = teamRed ?? new Team("Red", this.termId);
        this.teamBlue = teamBlue ?? new Team("Blue", this.termId);
        this.players = players ?? [];
        this.modifiers = modifiers;
        this.cancelled = cancelled
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
    public createEmbed(): EmbedBuilder {
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
                .map(player => this.formatPlayer(player, this.teamRed, this.teamBlue))
                .join('\n');

            const teamBlueText = this.teamBlue.players
                .map(player => this.formatPlayer(player, this.teamBlue, this.teamRed))
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
                    return `${emote}: **${player.username}** - ${stats.elo} elo`;
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
     * @param {Team} team - The team object representing the team the player belongs to, including its performance
     * details.
     * @param {Team} opponent - The opposing team object containing its performance and stats.
     * @return {string} A formatted string containing the player's username, updated elo, elo change, and acs, along
     * with an associated rank Emoji.
     */
    private formatPlayer(player: Player, team: Team, opponent: Team): string {
        const stats = player.getStats(this.termId);
        const acs = stats.acs;
        const elo = stats.elo
        if (this.id == 0) {
            if (team.hasWon) {
                const eloDelta = Math.round(1.5 * player.getEloChange(team.getAverageElo(), opponent.getAverageElo(), opponent.score, team.hasWon, this.termId));
                const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
                const emote = `<:test:${player.getEmote(this.termId, eloDelta)}>`;
                return `${emote}: **${player.username}** - ${elo + eloDelta} ${eloDeltaString} elo - ${acs} acs`;
            } else {
                const eloDelta = Math.round(0.5 * player.getEloChange(team.getAverageElo(), opponent.getAverageElo(), opponent.score, team.hasWon, this.termId));
                const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
                const emote = `<:test:${player.getEmote(this.termId, eloDelta)}>`;
                return `${emote}: **${player.username}** - ${elo + eloDelta} ${eloDeltaString} elo - ${acs} acs`;
            }
        } else {
            const eloDelta = player.getEloChange(team.getAverageElo(), opponent.getAverageElo(), opponent.score, team.hasWon, this.termId);
            const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
            const emote = `<:test:${player.getEmote(this.termId, eloDelta)}>`;
            return `${emote}: **${player.username}** - ${elo + eloDelta} ${eloDeltaString} elo - ${acs} acs`;
        }
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
                .setDisabled(this.cancelled),
            new ButtonBuilder()
                .setLabel("Cancel Game")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(createCustomId("game", this.id, "cancel"))
                .setDisabled(this.cancelled)
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
        const query = { id: { $gt: this.id } };
        const games = await Database.games.find(query).toArray();
        return games
            .map(game => formatGame(game))
            .sort((a, b) => a.id - b.id);
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
        this.players = players.map(player => new Player(player.id, player.username, player.stats));
    }

    /**
     * Computes and returns the average Elo rating of all players on the team.
     *
     * @return {number} The average Elo rating of the players.
     */
    public getAverageElo(): number {
        return this.players
            .map(player => player.getStats(this.termId).elo)
            .reduce((a, b) => a + b) / this.players.length;
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
    const oldTerm = "35d622bc-75a8-44d9-aea9-6271e49c37ed";
    const players = game.players.map(player => {
        console.log(player)
        return new Player(player.id, player.username, player.stats)
    });
    const teamRed = new Team(game.teamRed.name, game.teamRed.termId ?? oldTerm, game.teamRed.score, game.teamRed.hasWon, game.teamRed.players);
    const teamBlue = new Team(game.teamBlue.name, game.teamBlue.termId ?? oldTerm, game.teamBlue.score, game.teamBlue.hasWon, game.teamBlue.players);
    return new Game(game.id, game.termId ?? oldTerm, players, teamRed, teamBlue, game.matchId, game.modifiers, game.cancelled);
}