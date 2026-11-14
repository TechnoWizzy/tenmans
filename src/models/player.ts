import {Database} from "../database/database.ts";
import {TermManager} from "../utils/term.ts";
import type {HexColorString} from "discord.js";
import {Game} from "./game.ts";
import {riotIdRegex, sameRiotId} from "../utils/utils.ts";

/**
 * A Riot account linked to a player. A player may link any number of accounts, and an account may be linked to
 * more than one player (shared accounts) - which player played on it is decided per game, see `Participant`.
 *
 * Only accounts with a known PUUID and a public tracker profile are ranked: games played on them count toward
 * stats and elo. Private accounts can queue, but they are unranked.
 */
export interface RiotAccount {
    /** Most recently known Name#Tag */
    riotId: string;
    /** Riot account id, only known when the tracker profile was public */
    puuid?: string;
    visibility: AccountVisibility;
    /** When the account was last looked up on tracker */
    verifiedAt?: Date;
}

/**
 * Represents a tenmans player
 */
export class Player {
    public readonly id: string;
    /** Display name: the Riot ID of the primary (first) account */
    public username: string;
    public accounts: RiotAccount[];
    public readonly stats: PlayerStats[];

    /**
     * Creates a new instance of the player class. Use {@link Player.from} for documents retrieved from Mongo,
     * as those objects are not instances of the Player class - rather the Player type.
     *
     * @param {string} id - The unique identifier for the player. This is the same as their Discord ID
     * @param {string} username - The display name of the player, the Riot ID of their primary account
     * @param {RiotAccount[]} accounts - The Riot accounts linked to this player, primary first
     * @param {PlayerStats[]} [stats=[]] - The player's statistics per term
     */
    public constructor(id: string, username: string, accounts: RiotAccount[] = [], stats: PlayerStats[] = []) {
        this.id = id;
        this.username = username;
        this.accounts = accounts.map(account => ({...account}));
        this.stats = stats.map(stat => {
            const agents = stat.agents?.map(agent => {
                return new AgentStats(agent.id, agent.name, agent.color, agent.games, agent.wins, agent.losses,
                    agent.kills, agent.assists, agent.deaths, agent.headshots, agent.totalshots, agent.totalAcs);
            })
            return new PlayerStats(stat.games, stat.wins, stat.losses, stat.kills, stat.assists, stat.deaths,
                stat.headshots, stat.totalshots, stat.elo, stat.acs, stat.totalAcs, stat.agentId, agents, stat.termId);
        });
    }

    /**
     * Builds a Player from a Mongo document (or a player snapshot embedded in a game). Legacy snapshots have no
     * accounts, and some very old ones store a single stats object instead of an array.
     */
    public static from(doc: { id: string, username: string, accounts?: RiotAccount[], stats?: PlayerStats[] | PlayerStats }): Player {
        const stats = doc.stats == undefined ? [] : Array.isArray(doc.stats) ? doc.stats : [doc.stats];
        return new Player(doc.id, doc.username, doc.accounts ?? [], stats);
    }

    public static isRankedAccount(account?: RiotAccount) {
        return !!account?.puuid && account.visibility == "public";
    }

    /** Whether any linked account is ranked. Unranked players have no elo; their existing stats are frozen. */
    public isRanked() {
        return this.accounts.some(account => Player.isRankedAccount(account));
    }

    public findAccount(riotId: string) {
        return this.accounts.find(account => sameRiotId(account.riotId, riotId));
    }

    public findAccountByPuuid(puuid: string) {
        return this.accounts.find(account => account.puuid == puuid);
    }

    /**
     * Adds or refreshes a linked account. An existing account is matched by PUUID first (it survives renames),
     * then by Riot ID. The display name follows the primary account.
     *
     * @param update - The account as last seen
     * @param primary - Move the account to the front, making it the display name
     * @return The stored account
     */
    public linkAccount(update: RiotAccount, primary: boolean = false): RiotAccount {
        let account = (update.puuid ? this.findAccountByPuuid(update.puuid) : undefined) ?? this.findAccount(update.riotId);
        if (account) {
            account.riotId = update.riotId;
            account.visibility = update.visibility;
            account.puuid = update.puuid ?? account.puuid;
            account.verifiedAt = update.verifiedAt ?? account.verifiedAt;
        } else {
            account = {...update};
            this.accounts.push(account);
        }

        // A stale name-only entry with the same Riot ID is the same account: keep one
        const kept = account;
        this.accounts = this.accounts.filter(other => other === kept || !sameRiotId(other.riotId, kept.riotId)
            || (other.puuid != undefined && other.puuid != kept.puuid));

        if (primary) {
            this.accounts = [kept, ...this.accounts.filter(other => other !== kept)];
        }
        this.username = this.accounts[0]?.riotId ?? this.username;
        return kept;
    }

    /** @return Whether an account was removed */
    public unlinkAccount(riotId: string): boolean {
        const before = this.accounts.length;
        this.accounts = this.accounts.filter(account => !sameRiotId(account.riotId, riotId));
        this.username = this.accounts[0]?.riotId ?? this.username;
        return this.accounts.length != before;
    }

    public getStats(termId: string) {
        let termStats = this.stats.find(stat => stat.termId == termId);
        if (!termStats) {
            termStats = new PlayerStats();
            this.stats.push(termStats);
        }
        return termStats;
    }

    public getBestStats() {
        const sorted = this.stats.sort((a, b) => b.elo - a.elo);
        return sorted.at(0);
    }

    public async isInGame() {
        const games = await Game.fetchAll();
        for (const game of games) {
            if (!game.isOngoing()) {
                continue;
            }
            if (game.players.some(player => player.id == this.id)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Saves the current instance of the player to the database. If the player does not exist, it creates a new record.
     * Throws an error if the save operation is unsuccessful.
     *
     * Note this writes stats too. Players embedded in games are snapshots, so only save those through the stats
     * pipeline; use {@link saveAccounts} to persist account changes alone.
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
     * Persists only the stats. Used by the stats pipeline, whose players are game snapshots: their accounts may be
     * older than the stored ones (e.g. an account linked after the queue popped) and must not overwrite them.
     */
    public async saveStats(): Promise<Player> {
        const result = await Database.players.updateOne({ id: this.id }, { $set: { stats: this.stats } });
        if (!result.acknowledged) throw new Error(`Unable to save stats for player: ${this.id}`);
        return this;
    }

    /** Persists only the linked accounts and display name, leaving the stored stats untouched */
    public async saveAccounts(): Promise<Player> {
        const result = await Database.players.updateOne(
            { id: this.id },
            { $set: { accounts: this.accounts, username: this.username } }
        );
        if (!result.acknowledged) throw new Error(`Unable to save accounts for player: ${this.id}`);
        return this;
    }

    /**
     * Fetches a player record from the database using the provided ID.
     *
     * @param {string} id - The unique identifier of the player to be fetched.
     * @return {Promise<Player|null>} Returns a Player object if a record is found, otherwise null.
     */
    public static async fetch(id: string): Promise<Player | null> {
        const player = await Database.players.findOne({ id: id });
        if (!player) return null;
        return Player.from(player);
    }

    /** Fetches every player with an account currently known by this Riot ID (more than one if it is shared) */
    public static async fetchByRiotId(riotId: string): Promise<Player[]> {
        const players = await Database.players.find({ "accounts.riotId": riotIdRegex(riotId) }).toArray();
        return players.map(player => Player.from(player));
    }

    /** Fetches every player with this account linked (more than one if it is shared) */
    public static async fetchByPuuid(puuid: string): Promise<Player[]> {
        const players = await Database.players.find({ "accounts.puuid": puuid }).toArray();
        return players.map(player => Player.from(player));
    }

    /**
     * Fetches all players from the database and maps them to Player instances.
     *
     * @return {Promise<Player[]>} A promise that resolves to an array of Player instances.
     */
    public static async fetchAll(): Promise<Player[]> {
        const players = await Database.players.find().toArray();
        return players.map(player => Player.from(player));
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
     * Determines the emojiID corresponding to the player's elo.
     *
     * @param termId The termId to specify which term stats should be considered
     * @return The corresponding emojiID based on the player's elo.
     */
    public getEmote(termId?: string) {
        if (!termId || !this.isRanked()) return RankEmote.Unrated;
        const elo = this.getStats(termId).elo;
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
    public kills: number;
    public assists: number;
    public deaths: number;
    public headshots: number;
    public totalshots: number;
    public elo: number;
    public acs: number;
    public totalAcs: number;
    public agentId: string;
    public agents: AgentStats[];
    public termId: string;

    /**
     * Initializes a new instance of the class with the provided values.
     *
     * @param {number} games - The number of games played. Defaults to 0.
     * @param {number} wins - The number of games won. Defaults to 0.
     * @param {number} losses - The number of games lost. Defaults to 0.
     * @param {number} kills - The number of all kills
     * @param {number} assists - The number of all assists
     * @param {number} deaths - The number of all deaths
     * @param {number} headshots - The number of all headshots
     * @param {number} totalshots - The number of all shots
     * @param {number} elo - The Elo rating of the player. Defaults to 500.
     * @param {number} acs - The average combat score of the player. Defaults to 0.
     * @param {number} totalAcs - The number of all ACS
     * @param {string} agentId - The id of the agent
     * @param {AgentStats[]} agents - The list of Agent Stats
     * @param {string} termId - The ID of the current school term
     */
    public constructor(games: number = 0, wins: number = 0, losses: number = 0, kills: number = 0, assists: number = 0,
                       deaths: number = 0,  headshots: number = 0, totalshots: number = 0, elo: number = 500,
                       acs: number = 0, totalAcs: number = 0, agentId: string = "", agents: AgentStats[] = [],
                       termId?: string) {
        this.games = games;
        this.wins = wins
        this.losses = losses;
        this.kills = kills;
        this.assists = assists;
        this.deaths = deaths;
        this.headshots = headshots;
        this.totalshots = totalshots;
        this.elo = elo;
        this.acs = acs;
        this.totalAcs = totalAcs;
        this.agentId = agentId;
        this.agents = agents;
        this.termId = termId ?? TermManager.currentTerm.Id;
    }

    public getAgentStats(id: string, options?: { name: string, color: HexColorString }) {
        if (id == "") {
            return new AgentStats("", "", "#000000");
        }

        const stats = this.agents.find(agent => agent.id == id);
        if (stats) {
            return stats;
        } else {
            if (!options) {
                throw new Error("Agent not found and no options were provided");
            }
            const agent = new AgentStats(id, options.name, options.color);
            this.agents.push(agent);
            return agent;
        }
    }
}

/**
 * Represents the statistical data of an agent, including their performance.
 */
export class AgentStats {
    public id: string;
    public name: string;
    public color: HexColorString;
    public games: number;
    public wins: number;
    public losses: number;
    public kills: number;
    public assists: number;
    public deaths: number;
    public headshots: number;
    public totalshots: number;
    public totalAcs: number;

    /**
     * Initializes a new instance of the class with the provided values.
     *
     * @param {string} id - The id of the agent.
     * @param {string} name - The name of the agent.
     * @param {HexColorString} color - The color of agent.
     * @param {number} games - The number of games played. Defaults to 0.
     * @param {number} wins - The number of games won. Defaults to 0.
     * @param {number} losses - The number of games lost. Defaults to 0.
     * @param {number} kills - The number of all kills
     * @param {number} assists - The number of all assists
     * @param {number} deaths - The number of all deaths
     * @param {number} headshots - The number of all headshots
     * @param {number} totalshots - The number of all shots
     * @param {number} totalAcs - The number of all ACS
     */
    public constructor(id: string, name: string, color: HexColorString, games: number = 0, wins: number = 0,
                       losses: number = 0, kills: number = 0, assists: number = 0, deaths: number = 0,
                       headshots: number = 0, totalshots: number = 0, totalAcs: number = 0) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.games = games;
        this.wins = wins
        this.losses = losses;
        this.kills = kills;
        this.assists = assists;
        this.deaths = deaths;
        this.headshots = headshots;
        this.totalshots = totalshots;
        this.totalAcs = totalAcs;
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
    Unrated = "1406402175520997497",
}