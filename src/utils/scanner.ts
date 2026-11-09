import {Game} from "../models/game.ts";
import {Player} from "../models/player.ts";
import {Database} from "../database/database.ts";
import {Fetcher} from "./fetcher.ts";
import {Tracker} from "./tracker.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {propagateGameChange} from "./game.ts";

/** One player's custom history is checked per interval */
const SCAN_INTERVAL_MS = 60 * 1000;
/** Scanning stops this long after the game started */
const SCAN_DURATION_MS = 60 * 60 * 1000;
/** A match may be listed as starting slightly before the queue popped (clock skew, lobby set up early) */
const MATCH_START_TOLERANCE_MS = 10 * 60 * 1000;

/**
 * Detects a game's match on tracker and uploads it automatically.
 *
 * Once a game starts, every {@link SCAN_INTERVAL_MS} the scanner reads the most recent custom games of one of
 * the game's ranked (public profile) players, taking turns through them. A listed match is uploaded only if it
 * is an exact match: every slot's Riot ID is linked to exactly one player of this game's roster and every
 * roster player is in it, and a team has won. Anything less is left for the mods to set by hand.
 *
 * Scanning stops when the match is uploaded, the game is cancelled or set by hand, or after
 * {@link SCAN_DURATION_MS}.
 */
export class MatchScanner {
    private static timers = new Map<number, ReturnType<typeof setInterval>>();

    public static start(game: Game) {
        if (this.timers.has(game.id) || game.isLegacy() || !game.isOngoing() || game.matchId) {
            return;
        }

        const startedAt = game.startedAt ? new Date(game.startedAt).getTime() : Date.now();
        const remaining = startedAt + SCAN_DURATION_MS - Date.now();
        if (remaining <= 0) {
            return;
        }

        let turn = 0;
        let running = false;
        const timer = setInterval(async () => {
            // A slow tracker response must not overlap the next scan
            if (running) return;
            running = true;
            try {
                const done = await this.scan(game.id, startedAt, turn++);
                if (done) this.stop(game.id);
            } catch (e) {
                console.log(`Match scan for game ${game.id} failed`, e);
            } finally {
                running = false;
            }
        }, SCAN_INTERVAL_MS);
        this.timers.set(game.id, timer);

        setTimeout(async () => {
            if (!this.timers.has(game.id)) return;
            this.stop(game.id);
            const current = await Game.fetch(game.id).catch(() => null);
            if (current?.isOngoing() && !current.matchId) {
                await QueueHandler.getModChannel().send({
                    content: `Game ${game.id}: no match was detected automatically within an hour. Please set the match URL.`
                });
            }
        }, remaining);

        console.log(`Scanning for game ${game.id}'s match for ${Math.round(remaining / 60000)} minutes`);
    }

    public static stop(gameId: number) {
        const timer = this.timers.get(gameId);
        if (timer) clearInterval(timer);
        this.timers.delete(gameId);
    }

    /** Resumes scanning for recent games after a restart */
    public static async resume() {
        const since = new Date(Date.now() - SCAN_DURATION_MS);
        const games = await Database.games
            .find({ version: { $exists: true }, cancelled: false, startedAt: { $gte: since } })
            .toArray();
        for (const doc of games) {
            this.start(await Game.fetch(doc.id));
        }
    }

    /** @return Whether scanning is finished for this game */
    private static async scan(gameId: number, startedAt: number, turn: number): Promise<boolean> {
        const game = await Game.fetch(gameId);
        if (!game.isOngoing() || game.matchId) {
            return true;
        }

        const ranked = game.players
            .map(player => ({ player, account: player.accounts.find(account => Player.isRankedAccount(account)) }))
            .filter(entry => entry.account != undefined);
        if (ranked.length == 0) {
            console.log(`Game ${gameId} has no players with a public profile to scan`);
            return true;
        }

        const { player, account } = ranked[turn % ranked.length];
        const history = await Fetcher.fetchCustomMatches(account!.riotId, { pages: 1 });
        const candidates = (history?.data?.matches ?? [])
            .map(match => ({ id: match.attributes?.id, time: Date.parse(match.metadata?.timestamp ?? "") }))
            .filter((match): match is { id: string, time: number } => !!match.id && match.time >= startedAt - MATCH_START_TOLERANCE_MS)
            .sort((a, b) => a.time - b.time);

        for (const candidate of candidates) {
            if (await Database.games.findOne({ matchId: candidate.id })) {
                continue;
            }

            const match = await Tracker.fetchMatch(candidate.id);
            if (!isExactMatch(game, match)) {
                continue;
            }

            // The game may have been set by hand while the match was being fetched
            const current = await Game.fetch(gameId);
            if (!current.isOngoing() || current.matchId) {
                return true;
            }

            console.log(`Detected match ${candidate.id} for game ${gameId} via ${account!.riotId} (<@${player.id}>)`);
            current.matchId = candidate.id;
            current.participants = undefined;
            await propagateGameChange(undefined, current);
            return true;
        }

        return false;
    }
}

/**
 * An exact match: a team has won, and the match's slots map one-to-one onto the game's roster by linked Riot
 * ID - no PUUID lookups, no elimination.
 */
export function isExactMatch(game: Game, match: MatchResponse): boolean {
    const teams = match.data.segments.filter(segment => segment.type == "team-summary") as TeamSummarySegment[];
    if (!teams.some(team => team.metadata.hasWon)) {
        return false;
    }

    const slots = match.data.segments.filter(segment => segment.type == "player-summary") as PlayerSummarySegment[];
    if (slots.length != game.players.length) {
        return false;
    }

    const matched = new Set<string>();
    for (const slot of slots) {
        const owners = game.players.filter(player => player.findAccount(slot.attributes.platformUserIdentifier));
        if (owners.length != 1 || matched.has(owners[0].id)) {
            return false;
        }
        matched.add(owners[0].id);
    }
    return matched.size == game.players.length;
}
