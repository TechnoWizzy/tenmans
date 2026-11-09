/**
 * One-off migration from `username` / `altUsername` to linked Riot accounts (`Player.accounts`).
 *
 * Two steps, so a human reviews the lookups before anything is written:
 *
 *   1. plan   Look up every active player's username and alt on tracker and record whether each account is
 *             public (with its PUUID), private, or no longer exists. Read-only.
 *
 *             bun scripts/migrate-accounts.ts plan [--active-since 2026-08-01] [--delay-ms 10000] [--out accounts-plan.json]
 *
 *             --delay-ms pauses between tracker lookups (default 10s): looking players up too quickly makes
 *             tracker put a Cloudflare captcha in front of every profile.
 *
 *             Players without a game since --active-since (default: every player) are not looked up; their
 *             names are migrated as unverified, unranked accounts until they run /register.
 *
 *   2. apply  Write `accounts` onto every player from the plan and remove `altUsername`. Dry-run unless --commit
 *             is passed; --commit backs up the players collection first.
 *
 *             bun scripts/migrate-accounts.ts apply [--plan accounts-plan.json] [--commit]
 *
 * Games are not touched: games from before the migration are frozen (they have no `version`).
 * Lookups are cached in .migrate-cache/, so re-running plan only looks up what failed.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {parseArgs} from "node:util";
import {Database} from "../src/database/database.ts";
import {Tracker} from "../src/utils/tracker.ts";
import type {RiotAccount} from "../src/models/player.ts";

const CACHE_DIR = ".migrate-cache";
// Players who left the server had their username replaced by their Discord ID
const DISCORD_ID_REGEX = /^\d{13,}$/;

const {values: args, positionals} = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: {
        "active-since": {type: "string"},
        "delay-ms": {type: "string", default: "10000"},
        out: {type: "string", default: "accounts-plan.json"},
        plan: {type: "string", default: "accounts-plan.json"},
        commit: {type: "boolean", default: false},
    },
});

interface PlannedAccount {
    riotId: string;
    lookup: AccountLookup | { status: "skipped" };
}

interface PlannedPlayer {
    id: string;
    username: string;
    active: boolean;
    accounts: PlannedAccount[];
}

interface Plan {
    generatedAt: string;
    players: PlannedPlayer[];
}

function cachePath(riotId: string) {
    return join(CACHE_DIR, `${encodeURIComponent(riotId.toLowerCase())}.json`);
}

// Cloudflare's guidance for tracker's rate limit (error 1015): wait 30s, double on each retry, stop after 5
const BACKOFF_START_MS = 30 * 1000;
const MAX_RETRIES = 5;

class RateLimitedError extends Error {}

async function lookup(riotId: string): Promise<AccountLookup> {
    const path = cachePath(riotId);
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));

    // A failed lookup almost always means tracker is rate limiting or challenging us: back off and retry the
    // same account instead of moving on, which would only keep the limit going
    for (let attempt = 0; ; attempt++) {
        const result = await Tracker.lookupAccount(riotId);
        if (result.status != "error") {
            writeFileSync(path, JSON.stringify(result));
            await Bun.sleep(Number(args["delay-ms"]));
            return result;
        }
        if (attempt >= MAX_RETRIES) {
            throw new RateLimitedError(`Tracker lookups kept failing (${riotId}, ${MAX_RETRIES} retries). `
                + `Wait a while, then re-run plan: it continues from the cache. Consider a larger --delay-ms.`);
        }
        const wait = BACKOFF_START_MS * 2 ** attempt;
        console.log(`Lookup of ${riotId} failed, waiting ${wait / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}`);
        await Bun.sleep(wait);
    }
}

async function plan() {
    mkdirSync(CACHE_DIR, {recursive: true});
    const since = args["active-since"] ? new Date(args["active-since"]) : undefined;

    let activeIds: Set<string> | undefined;
    if (since) {
        activeIds = new Set();
        for (const game of await Database.games.find({}, {projection: {players: 1}}).toArray()) {
            if (game._id.getTimestamp() < since) continue;
            for (const player of game.players) activeIds.add(player.id);
        }
        console.log(`${activeIds.size} players active since ${args["active-since"]}`);
    }

    const docs = await Database.players.find().toArray();
    const players: PlannedPlayer[] = [];
    for (const [index, doc] of docs.entries()) {
        const legacy = doc as unknown as { id: string, username: string, altUsername?: string };
        const active = !activeIds || activeIds.has(legacy.id);
        const names = [legacy.username, legacy.altUsername]
            .filter((name): name is string => !!name && !DISCORD_ID_REGEX.test(name.trim()))
            .map(name => name.trim())
            .filter((name, i, all) => all.findIndex(other => other.toLowerCase() == name.toLowerCase()) == i);

        const accounts: PlannedAccount[] = [];
        for (const riotId of names) {
            accounts.push({riotId, lookup: active ? await lookup(riotId) : {status: "skipped"}});
        }
        players.push({id: legacy.id, username: legacy.username, active, accounts});

        const summary = accounts.map(a => `${a.riotId}: ${a.lookup.status}`).join(", ") || "no names";
        console.log(`[${index + 1}/${docs.length}] ${legacy.id} ${summary}`);
    }

    writeFileSync(args.out!, JSON.stringify({generatedAt: new Date().toISOString(), players} satisfies Plan, null, 2));
    report(players);
    console.log(`\nReview ${args.out}, re-run plan to retry errors, then run "apply".`);
}

function report(players: PlannedPlayer[]) {
    const active = players.filter(p => p.active);
    const counts = new Map<string, number>();
    for (const player of active) {
        for (const account of player.accounts) {
            counts.set(account.lookup.status, (counts.get(account.lookup.status) ?? 0) + 1);
        }
    }
    const ranked = active.filter(p => p.accounts.some(a => a.lookup.status == "public")).length;
    console.log(`\nActive players: ${active.length}, ranked after migration: ${ranked}, unranked: ${active.length - ranked}`);
    console.log("Accounts by status:", Object.fromEntries(counts));

    const byPuuid = new Map<string, string[]>();
    for (const player of players) {
        for (const account of player.accounts) {
            if (account.lookup.status != "public") continue;
            byPuuid.set(account.lookup.puuid, [...(byPuuid.get(account.lookup.puuid) ?? []), player.id]);
        }
    }
    const shared = [...byPuuid.entries()].filter(([, ids]) => ids.length > 1);
    if (shared.length > 0) {
        console.log("Shared accounts (same PUUID on several players):");
        for (const [puuid, ids] of shared) console.log(`  ${puuid}: ${ids.join(", ")}`);
    }

    const missing = active.flatMap(p => p.accounts.filter(a => a.lookup.status == "not-found").map(a => `${p.id} ${a.riotId}`));
    if (missing.length > 0) {
        console.log("Riot IDs that no longer exist (these players should run /register):");
        for (const line of missing) console.log(`  ${line}`);
    }
}

function toAccount(planned: PlannedAccount, verifiedAt: Date): RiotAccount {
    switch (planned.lookup.status) {
        case "public":
            return {riotId: planned.lookup.riotId, puuid: planned.lookup.puuid, visibility: "public", verifiedAt};
        case "private":
            return {riotId: planned.riotId, visibility: "private", verifiedAt};
        default:
            // not-found, error, skipped: kept by name so matching still works; unranked until /register
            return {riotId: planned.riotId, visibility: "unknown"};
    }
}

async function apply() {
    const {generatedAt, players} = JSON.parse(readFileSync(args.plan!, "utf8")) as Plan;
    const verifiedAt = new Date(generatedAt);

    if (args.commit) {
        mkdirSync(CACHE_DIR, {recursive: true});
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backup = join(CACHE_DIR, `backup-${stamp}-players.json`);
        writeFileSync(backup, JSON.stringify(await Database.players.find().toArray()));
        console.log(`Backed up players to ${backup}\n`);
    } else {
        console.log("DRY RUN: nothing will be written. Pass --commit to apply.\n");
    }

    let written = 0;
    for (const player of players) {
        const accounts = player.accounts.map(account => toAccount(account, verifiedAt));
        const username = accounts[0]?.riotId ?? player.username;
        if (args.commit) {
            await Database.players.updateOne(
                {id: player.id},
                {$set: {accounts, username}, $unset: {altUsername: ""}},
            );
        }
        written++;
    }

    if (args.commit) {
        await Database.players.createIndex({"accounts.puuid": 1});
    }
    report(players);
    console.log(`\n${args.commit ? "Migrated" : "Would migrate"} ${written} players. ${args.commit ? "Restart the bot." : ""}`);
}

const command = positionals[0];
await Database.connect();
try {
    if (command == "plan") await plan();
    else if (command == "apply") await apply();
    else throw new Error("Usage: bun scripts/migrate-accounts.ts <plan|apply> [options]");
    process.exit(0);
} catch (e) {
    console.error(e);
    process.exit(1);
}
