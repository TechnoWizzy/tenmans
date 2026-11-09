/**
 * Backfill games that were cancelled while match fetching / command registration was broken.
 *
 * Two steps, so a human reviews the matches before anything is written:
 *
 *   1. plan   Find cancelled games with no matchId, look for the tracker match each one was
 *             actually played as, and write the result to a plan file. Read-only.
 *
 *             bun scripts/backfill-games.ts plan --from 2026-07-15 --to 2026-10-20 [--season <seasonId>]...
 *                 [--manual fixes.csv] [--out backfill-plan.json]
 *
 *             Pass --season once per Valorant season the date range covers (the seasonId is in any match's
 *             metadata, e.g. a tracker.json for a game from that period). Without it, tracker's default season is used.
 *
 *   2. apply  Read the (reviewed / hand-edited) plan, un-cancel those games, attach their matchIds and
 *             rebuild every affected term's stats by replaying all of its games in order from scratch.
 *             Dry-run unless --commit is passed.
 *
 *             bun scripts/backfill-games.ts apply [--plan backfill-plan.json] [--commit]
 *
 * Where a match comes from, in priority order:
 *   - manual   A CSV of `gameId,trackerUrlOrMatchId` lines passed with --manual
 *   - reason   A tracker URL / match UUID pasted into the game's cancel reason
 *   - history  The players' standard-mode custom games from tracker (fetcher `/matches/:riotId`, paged back to
 *              the start of the date range), started after the game was created and before the next game with
 *              mostly the same players. Players are checked one at a time until a match verifies.
 * Every candidate is verified against the full match: at least MIN_ROSTER_OVERLAP of the game's players
 * must appear in it, one team must have won, and no other game may already use that matchId.
 *
 * Why apply rebuilds the whole term instead of calling propagateGameChange: propagateGameChange replays
 * later games starting from the player snapshots stored in each game document, and those snapshots
 * already include that game's kills/deaths, so a replay months back would double-count stats and could
 * overwrite newer profile changes. Rebuilding from fresh term stats avoids both.
 *
 * Stop the bot (or at least the queue) before `apply --commit`, and restart it afterwards so the
 * leaderboard cache is cleared. Every match is cached on disk in .backfill-cache/, so re-runs are cheap.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {parseArgs} from "node:util";
import {Database} from "../src/database/database.ts";
import {Game} from "../src/models/game.ts";
import {Player, PlayerStats} from "../src/models/player.ts";
import {Tracker} from "../src/utils/tracker.ts";
import {Fetcher} from "../src/utils/fetcher.ts";
import {TermManager} from "../src/utils/term.ts";
import {parseGameStats} from "../src/utils/game.ts";

const MIN_ROSTER_OVERLAP = 8;
// A game is created when the queue pops; the match should start within this window
const WINDOW_BEFORE_MS = 10 * 60 * 1000;
const WINDOW_AFTER_MS = 3 * 60 * 60 * 1000;
const CACHE_DIR = ".backfill-cache";
// Pages of 20 custom matches to read per player and season
const HISTORY_MAX_PAGES = 30;
// A later game sharing this many players means this game's match must have started before that one was created
const NEXT_GAME_OVERLAP = 5;
const MATCH_ID_REGEX = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i;

type Source = "manual" | "reason" | "history";

interface PlanEntry {
    gameId: number;
    termId: string;
    createdAt: string;
    cancelReason?: string;
    matchId: string;
    source: Source;
    rosterOverlap: number;
    score: string;
}

interface Unmatched {
    gameId: number;
    createdAt: string;
    cancelReason?: string;
    why: string;
}

interface Plan {
    generatedAt: string;
    entries: PlanEntry[];
    unmatched: Unmatched[];
}

const {positionals, values: args} = parseArgs({
    allowPositionals: true,
    options: {
        from: {type: "string"},
        to: {type: "string"},
        manual: {type: "string"},
        out: {type: "string", default: "backfill-plan.json"},
        plan: {type: "string", default: "backfill-plan.json"},
        commit: {type: "boolean", default: false},
        season: {type: "string", multiple: true},
    },
});

mkdirSync(CACHE_DIR, {recursive: true});

// ---------------------------------------------------------------------------------------------------------
// Caching wrappers. Tracker fetches go through a headed browser and are slow, so persist everything.
// ---------------------------------------------------------------------------------------------------------

function readCache<T>(name: string): T | undefined {
    const path = join(CACHE_DIR, name);
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as T : undefined;
}

function writeCache(name: string, data: unknown) {
    writeFileSync(join(CACHE_DIR, name), JSON.stringify(data));
}

async function fetchMatch(matchId: string): Promise<MatchResponse | null> {
    const name = `match-${matchId.toLowerCase()}.json`;
    const cached = readCache<MatchResponse>(name);
    if (cached) return cached;
    try {
        const data = await Tracker.fetchMatch(matchId);
        writeCache(name, data);
        return data;
    } catch (e) {
        console.log(`  could not fetch match ${matchId}: ${(e as Error).message}`);
        return null;
    }
}

/**
 * A player's standard-mode ("bomb") custom matches back to `until`, across every --season.
 * 10mans are always bomb, so deathmatch/escalation/swiftplay customs are dropped before any full match is fetched.
 */
async function fetchHistory(riotId: string, until: Date): Promise<{ id: string, time: number }[]> {
    const matches: { id: string, time: number }[] = [];
    const seasons: (string | undefined)[] = args.season?.length ? args.season : [undefined];
    for (const season of seasons) {
        const name = `history-${riotId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}-${season ?? "default"}.json`;
        let data = readCache<MatchHistoryResponse>(name);
        if (!data) {
            try {
                data = await Fetcher.fetchCustomMatches(riotId, {seasonId: season, until, pages: HISTORY_MAX_PAGES});
                writeCache(name, data);
            } catch (e) {
                console.log(`  could not fetch history for ${riotId} (season ${season ?? "default"}): ${(e as Error).message}`);
                continue;
            }
        }
        for (const m of data?.data?.matches ?? []) {
            if (m.metadata?.modeKey && m.metadata.modeKey != "bomb") continue;
            const id = m.attributes?.id ?? "";
            const time = Date.parse(m.metadata?.timestamp ?? "");
            if (id && !Number.isNaN(time)) matches.push({id, time});
        }
    }
    return matches;
}

// ---------------------------------------------------------------------------------------------------------
// plan
// ---------------------------------------------------------------------------------------------------------

function loadManual(path?: string): Map<number, string> {
    const manual = new Map<number, string>();
    if (!path) return manual;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
        const [gameId, value] = line.split(",").map(s => s.trim());
        const matchId = value?.match(MATCH_ID_REGEX)?.[0];
        if (gameId && matchId && !Number.isNaN(Number(gameId))) manual.set(Number(gameId), matchId);
    }
    return manual;
}

function rosterOverlap(match: MatchResponse, players: { username: string, altUsername?: string, accounts?: { riotId: string }[] }[]) {
    // Legacy game snapshots still carry altUsername in Mongo; newer ones carry accounts
    const names = new Set(players.flatMap(p => [p.username, p.altUsername, ...(p.accounts ?? []).map(a => a.riotId)])
        .filter((n): n is string => !!n)
        .map(n => n.toLowerCase()));
    return match.data.segments
        .filter(s => s.type == "player-summary")
        .filter(s => names.has((s as PlayerSummarySegment).attributes.platformUserIdentifier.toLowerCase()))
        .length;
}

function describeScore(match: MatchResponse) {
    const teams = match.data.segments.filter(s => s.type == "team-summary") as TeamSummarySegment[];
    const winner = teams.find(t => t.metadata.hasWon);
    if (!winner) return null;
    return teams.map(t => `${t.attributes.teamId} ${t.stats.roundsWon.value}`).join(" - ");
}

async function plan() {
    if (!args.from || !args.to) throw new Error("plan requires --from and --to (YYYY-MM-DD)");
    const from = new Date(args.from);
    const to = new Date(args.to);
    const manual = loadManual(args.manual);

    const docs = await Database.games
        .find({cancelled: true, $or: [{matchId: {$exists: false}}, {matchId: ""}, {matchId: null as unknown as string}]})
        .sort({id: 1})
        .toArray();
    const games = docs.filter(doc => {
        const created = doc._id.getTimestamp();
        return created >= from && created <= to;
    });
    console.log(`${games.length} cancelled games without a match between ${args.from} and ${args.to}`);

    const usedMatchIds = new Set((await Database.games.distinct("matchId")).filter(Boolean) as string[]);
    // Every game from the first cancelled one onwards, to bound each game's search window
    const laterGames = games.length == 0 ? [] : await Database.games
        .find({id: {$gt: games[0].id}}, {projection: {id: 1, players: 1}})
        .sort({id: 1})
        .toArray();
    const historyUntil = new Date(from.getTime() - 24 * 60 * 60 * 1000);
    const entries: PlanEntry[] = [];
    const unmatched: Unmatched[] = [];

    for (const doc of games) {
        const createdAt = doc._id.getTimestamp();
        const base = {gameId: doc.id, createdAt: createdAt.toISOString(), cancelReason: doc.cancelReason};
        console.log(`Game ${doc.id} (${base.createdAt}) "${doc.cancelReason ?? ""}"`);

        // The match started after the queue popped, and before the next game with mostly the same players
        const playerIds = new Set(doc.players.map(p => p.id));
        const nextGame = laterGames.find(g => g.id > doc.id
            && g.players.filter(p => playerIds.has(p.id)).length >= NEXT_GAME_OVERLAP);
        const windowStart = createdAt.getTime() - WINDOW_BEFORE_MS;
        const windowEnd = Math.min(createdAt.getTime() + WINDOW_AFTER_MS,
            nextGame ? nextGame._id.getTimestamp().getTime() : Infinity);

        let why = "no candidate matches found";
        const tried = new Set<string>();
        const verify = async (matchId: string, source: Source): Promise<PlanEntry | undefined> => {
            if (tried.has(matchId)) return;
            tried.add(matchId);
            if (usedMatchIds.has(matchId)) {
                why = `match ${matchId} is already attached to another game`;
                return;
            }
            const match = await fetchMatch(matchId);
            if (!match) {
                why = `match ${matchId} could not be fetched`;
                return;
            }
            const overlap = rosterOverlap(match, doc.players);
            const score = describeScore(match);
            if (overlap < MIN_ROSTER_OVERLAP) {
                why = `candidate ${matchId} only shares ${overlap}/10 players`;
                return;
            }
            if (!score) {
                why = `match ${matchId} has no winner`;
                return;
            }
            return {...base, termId: doc.termId, matchId, source, rosterOverlap: overlap, score};
        };

        // Explicit links first
        let found: PlanEntry | undefined;
        const manualId = manual.get(doc.id);
        if (manualId) found = await verify(manualId, "manual");
        const reasonId = doc.cancelReason?.match(MATCH_ID_REGEX)?.[0];
        if (!found && reasonId) found = await verify(reasonId, "reason");

        // Then the players' custom history, one player at a time, earliest match in the window first.
        // Histories are cached, so a player shared with an earlier game costs nothing.
        for (const player of doc.players) {
            if (found) break;
            const inWindow = (await fetchHistory(player.username, historyUntil))
                .filter(m => m.time >= windowStart && m.time <= windowEnd)
                .sort((a, b) => a.time - b.time);
            for (const m of inWindow) {
                found = await verify(m.id, "history");
                if (found) break;
            }
        }

        if (found) {
            usedMatchIds.add(found.matchId);
            entries.push(found);
            console.log(`  -> ${found.matchId} via ${found.source} (${found.rosterOverlap}/10, ${found.score})`);
        } else {
            unmatched.push({...base, why});
            console.log(`  -> unmatched: ${why}`);
        }
    }

    const result: Plan = {generatedAt: new Date().toISOString(), entries, unmatched};
    writeFileSync(args.out!, JSON.stringify(result, null, 2));
    console.log(`
Matched ${entries.length}, unmatched ${unmatched.length}. Review ${args.out}, delete any wrong`
        + ` entries, add missing ones to a --manual CSV and re-run, then run "apply".`);
}

// ---------------------------------------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------------------------------------

async function apply() {
    const commit = args.commit!;
    const {entries} = JSON.parse(readFileSync(args.plan!, "utf8")) as Plan;
    if (entries.length == 0) throw new Error(`No entries in ${args.plan}`);

    if (!commit) {
        // Simulate everything in memory
        Game.prototype.save = async function (this: Game) { return this; };
        Player.prototype.save = async function (this: Player) { return this; };
        console.log("DRY RUN: nothing will be written. Pass --commit to apply.\n");
    } else {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        writeCache(`backup-${stamp}-games.json`, await Database.games.find().toArray());
        writeCache(`backup-${stamp}-players.json`, await Database.players.find().toArray());
        console.log(`Backed up both collections to ${CACHE_DIR}/backup-${stamp}-*.json\n`);
    }

    const allGames = await Game.fetchAll();
    const report: Record<string, unknown> = {};

    for (const termId of new Set(entries.map(e => e.termId))) {
        console.log(`Term ${termId}`);
        // PlayerStats/getStats default to the current term; point it at the term being rebuilt
        TermManager.currentTerm = {Id: termId} as Term;

        // 1. Un-cancel the planned games
        const termEntries = entries.filter(e => e.termId == termId);
        for (const entry of termEntries) {
            const game = allGames.find(g => g.id == entry.gameId);
            if (!game || !game.cancelled || game.matchId) {
                throw new Error(`Game ${entry.gameId} is no longer a cancelled game without a match. Re-run plan.`);
            }
            game.cancelled = false;
            game.cancelReason = undefined;
            game.matchId = entry.matchId;
            await game.save();
        }

        // 2. Make sure every match in the term is available before touching any stats
        const games = allGames.filter(g => g.termId == termId && !g.cancelled && g.matchId);
        const matches = new Map<string, MatchResponse>();
        const missing: number[] = [];
        for (const game of games) {
            const match = await fetchMatch(game.matchId!);
            if (match) matches.set(game.matchId!, match); else missing.push(game.id);
        }
        if (missing.length > 0) {
            throw new Error(`Could not fetch matches for games ${missing.join(", ")}; aborting before stats are rebuilt.`
                + (commit ? " The un-cancelled games were already saved; restore from the backup or re-run." : ""));
        }

        // 3. Reset this term's stats on the live player documents
        const players = await Player.fetchAll();
        const before = new Map(players.map(p => {
            const s = p.stats.find(s => s.termId == termId);
            return [p.id, {elo: s?.elo ?? 500, games: s?.games ?? 0}];
        }));
        for (const player of players) {
            const index = player.stats.findIndex(s => s.termId == termId);
            if (index != -1) player.stats.splice(index, 1, new PlayerStats());
        }

        // 4. Replay every game in order. Pre-seeding modifiedPlayers makes parseGameStats use the live
        //    players instead of the snapshots stored in each game.
        const modifiedPlayers = new Map(players.map(p => [p.id, p]));
        for (const game of games) {
            Tracker.setMatchData(game.matchId!, matches.get(game.matchId!)!);
            await parseGameStats(game, modifiedPlayers);
        }
        for (const player of players) {
            if (player.stats.some(s => s.termId == termId)) await player.save();
        }

        // 5. Report
        const changes = players
            .map(p => {
                const after = p.stats.find(s => s.termId == termId);
                const b = before.get(p.id)!;
                return {player: p.username, eloBefore: b.elo, eloAfter: after?.elo ?? 500,
                    gamesBefore: b.games, gamesAfter: after?.games ?? 0};
            })
            .filter(c => c.eloBefore != c.eloAfter || c.gamesBefore != c.gamesAfter)
            .sort((a, b) => Math.abs(b.eloAfter - b.eloBefore) - Math.abs(a.eloAfter - a.eloBefore));
        report[termId] = {backfilledGames: termEntries.map(e => e.gameId), replayedGames: games.length, changes};
        console.log(`  backfilled ${termEntries.length}, replayed ${games.length}, ${changes.length} players changed`);
        console.table(changes.slice(0, 15));
    }

    writeFileSync("backfill-report.json", JSON.stringify(report, null, 2));
    console.log(`\nFull report written to backfill-report.json. ${commit ? "Restart the bot." : "Dry run complete."}`);
}

// ---------------------------------------------------------------------------------------------------------

const command = positionals[0];
await Database.connect();
try {
    if (command == "plan") await plan();
    // Games from before linked Riot accounts are frozen and their stats are never recomputed, so apply - which
    // replays whole terms - is disabled. plan still works as a read-only report.
    else if (command == "apply") throw new Error("apply is disabled: games before linked Riot accounts are frozen.");
    else throw new Error("Usage: bun scripts/backfill-games.ts <plan|apply> [options]");
    process.exit(0);
} catch (e) {
    console.error(e);
    process.exit(1);
}
