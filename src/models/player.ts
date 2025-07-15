import {Database} from "../database/database.ts";
import {TermManager} from "../utils/term.ts";

/**
 * Represents a tenmans player
 */
export class Player {
    public readonly id: string;
    public readonly username: string;
    public readonly stats: PlayerStats[];

    /**
     * Creates a new instance of the player class. This constructor should be called on all Players
     * retrieved from Mongo, as those objects are not instances of the Player class - rather the Player type.
     * Player types are unable to call class methods.
     *
     * @param {string} id - The unique identifier for the player. This is the same as their Discord ID
     * @param {string} username - The username of the player. This is their full RiotID
     * @param {PlayerStats} [stats=new PlayerStats()] - The player's statistics. Defaults to a new `PlayerStats` instance.
     */
    public constructor(id: string, username: string, stats: PlayerStats[] = []) {
        this.id = id;
        this.username = username;
        this.stats = stats.map(stat => {
            return new PlayerStats(stat.games, stat.wins, stat.losses, stat.elo, stat.acs, stat.timeout, stat.termId);
        })
    }

    public getStats(termId: string) {
        let termStats = this.stats.find(stat => stat.termId == termId);
        if (!termStats) {
            termStats = new PlayerStats();
            this.stats.push(termStats);
        }
        return termStats;
    }

    /**
     * Saves the current instance of the player to the database. If the player does not exist, it creates a new record.
     * Throws an error if the save operation is unsuccessful.
     *
     * @return {Promise<this>} Returns the saved instance of the player.
     */
    public async save(): Promise<Player> {
        const query = { id: this.id };
        const update = { $set: this };
        const options = { upsert: true };
        const result = await Database.players.updateOne(query, update, options);
        if (!result.acknowledged) throw new Error(`Unable to save player: ${this.id}`);
        return this;
    }

    /**
     * Fetches a player record from the database using the provided ID.
     *
     * @param {string} id - The unique identifier of the player to be fetched.
     * @return {Promise<Player|null>} Returns a Player object if a record is found, otherwise null.
     */
    public static async fetch(id: string): Promise<Player | null> {
        const query = { id: id };
        const player = await Database.players.findOne(query);
        if (!player) return null;
        return new Player(player.id, player.username, player.stats);
    }

    /**
     * Fetches a player by their username from the database.
     *
     * @param {string} username - The username of the player to be fetched.
     * @return {Promise<Player|null>} A promise that resolves to a Player instance if a player is found, or null if
     * no player exists with the given username.
     */
    public static async fetchByUsername(username: string): Promise<Player | null> {
        const query = { username: new RegExp(`^${username}$`, 'i') };
        const player = await Database.players.findOne(query);
        if (!player) return null;
        return new Player(player.id, player.username, player.stats);
    }

    /**
     * Fetches all players from the database and maps them to Player instances.
     *
     * @return {Promise<Player[]>} A promise that resolves to an array of Player instances.
     */
    public static async fetchAll(): Promise<Player[]> {
        const players = await Database.players.find().toArray();
        return players.map(player => new Player(player.id, player.username, player.stats));
    }

    /**
     * Calculates the Elo rating change based on the team's performance, opponent's Elo, and match outcome.
     *
     * @param {number} teamElo - The Elo rating of the team.
     * @param {number} opponentElo - The Elo rating of the opponent.
     * @param {number} opponentScore - The score of the opponent team in the match.
     * @param {boolean} isWinner - Indicates whether the team won the match.
     * @param {string} termId - The ID of the term during which this calculation should be considered
     * @return {number} The calculated Elo rating change for the team.
     */
    public getEloChange(teamElo: number, opponentElo: number, opponentScore: number, isWinner: boolean, termId: string): number {
        const c = 1 + (10 - Math.min(opponentScore, 12)) / 50;
        const stats = this.getStats(termId);
        if (isWinner) {
            const a = 25 * (stats.acs / 200) * (1 - (teamElo - opponentElo) / teamElo);
            const b = 1 + (opponentElo - stats.elo) / opponentElo;
            return Math.round(a * b * c);
        } else {
            const a = 25 * (150 / stats.acs) * (1 - (opponentElo - teamElo) / teamElo);
            const b = 1 - (opponentElo - stats.elo) / opponentElo;
            const loss = Math.round(-1 * a * b * c);
            if (stats.elo + loss < 0) {
                return -stats.elo;
            } else {
                return loss;
            }
        }
    }

    /**
     * Determines the emojiID corresponding to the player's elo, optionally adjusted by an additional delta value.
     *
     * @param termId The termId to specify which term stats should be considered
     * @param delta An optional numerical adjustment to the player's elo. Defaults to 0.
     * @return The corresponding emojiID based on the adjusted elo.
     */
    public getEmote(termId: string, delta: number = 0) {
        const elo = this.getStats(termId).elo + delta;
        if (elo >= 1100) return RankEmote.Radiant
        if (elo >= 1000) return RankEmote.ImmortalIII;
        if (elo >= 900) return RankEmote.ImmortalII;
        if (elo >= 800) return RankEmote.ImmortalI;
        if (elo >= 770) return RankEmote.AscendantIII;
        if (elo >= 730) return RankEmote.AscendantII;
        if (elo >= 700) return RankEmote.AscendantI;
        if (elo >= 670) return RankEmote.DiamondIII;
        if (elo >= 630) return RankEmote.DiamondII;
        if (elo >= 600) return RankEmote.DiamondI;
        if (elo >= 570) return RankEmote.PlatinumIII;
        if (elo >= 530) return RankEmote.PlatinumII;
        if (elo >= 500) return RankEmote.PlatinumI;
        if (elo >= 470) return RankEmote.GoldIII;
        if (elo >= 430) return RankEmote.GoldII;
        if (elo >= 400) return RankEmote.GoldI;
        if (elo >= 370) return RankEmote.SilverIII;
        if (elo >= 330) return RankEmote.SilverII;
        if (elo >= 300) return RankEmote.SilverI;
        if (elo >= 270) return RankEmote.BronzeIII;
        if (elo >= 230) return RankEmote.BronzeII;
        if (elo >= 200) return RankEmote.BronzeI;
        if (elo >= 150) return RankEmote.IronIII;
        if (elo >= 100) return RankEmote.IronII;
        return RankEmote.IronI;
    }
}

/**
 * Represents the statistical data of a player, including their performance and status.
 */
export class PlayerStats {
    public games: number;
    public wins: number;
    public losses: number;
    public elo: number;
    public acs: number;
    public timeout: Date;
    public termId: string;

    /**
     * Initializes a new instance of the class with the provided values.
     *
     * @param {number} games - The number of games played. Defaults to 0.
     * @param {number} wins - The number of games won. Defaults to 0.
     * @param {number} losses - The number of games lost. Defaults to 0.
     * @param {number} elo - The Elo rating of the player. Defaults to 500.
     * @param {number} acs - The average combat score of the player. Defaults to 0.
     * @param {string} termId - The ID of the current school term
     */
    public constructor(games: number = 0, wins: number = 0, losses: number = 0, elo: number = 500, acs: number = 0, timeout?: Date, termId?: string) {
        this.games = games;
        this.wins = wins
        this.losses = losses;
        this.elo = elo;
        this.acs = acs;
        this.timeout = timeout ?? new Date(0);
        this.termId = termId ?? TermManager.currentTerm.Id;
    }
}

/**
 * Enum representing different rank emotes with their corresponding emoji ID values.
 * This can be used to map rank names to specific emotes for display purposes.
 */
export enum RankEmote {
    Radiant = "1171284215090921603",
    ImmortalIII = "1171284097197420594",
    ImmortalII = "1171284066369290340",
    ImmortalI = "1171284019174969425",
    AscendantIII = "1171283869367021689",
    AscendantII = "1171283856377249883",
    AscendantI = "1171283842343116800",
    DiamondIII = "1171283763544735794",
    DiamondII = "1171283748386521192",
    DiamondI = "1171283715587047464",
    PlatinumIII = "1171283684490477618",
    PlatinumII = "1171283671966285895",
    PlatinumI = "1171283659186249790",
    GoldIII = "1171283643264679976",
    GoldII = "1171283631038267462",
    GoldI = "1171283618497318943",
    SilverIII = "1171283599589388359",
    SilverII = "1171283585173565550",
    SilverI = "1171283551308742740",
    BronzeIII = "1171283527933902908",
    BronzeII = "1171283513484525661",
    BronzeI = "1171283497302896660",
    IronIII = "1171283462355943475",
    IronII = "1171283398199877632",
    IronI = "1171283369972203592",
}