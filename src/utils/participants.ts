import {Player, type RiotAccount} from "../models/player.ts";
import type {Game, Participant} from "../models/game.ts";
import {Tracker} from "./tracker.ts";

/**
 * Thrown when the slots of a match cannot be matched to the game's players with confidence. The message explains
 * what an admin needs to fix (link an account, record a substitute) before setting the match again.
 */
export class ParticipantResolutionError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "ParticipantResolutionError";
    }
}

interface Slot {
    riotId: string;
    team: TeamName;
    lookup?: AccountLookup;
    player?: Player;
    account?: RiotAccount;
    resolvedBy?: Participant["resolvedBy"];
}

function getSlots(match: MatchResponse): Slot[] {
    return match.data.segments
        .filter(segment => segment.type == "player-summary")
        .map(segment => {
            const summary = segment as PlayerSummarySegment;
            return { riotId: summary.attributes.platformUserIdentifier, team: summary.metadata.teamId };
        });
}

async function lookup(slot: Slot) {
    slot.lookup ??= await Tracker.lookupAccount(slot.riotId);
    return slot.lookup;
}

/** The account as seen in this match, to link to (or refresh on) the player who played it */
function observedAccount(slot: Slot): RiotAccount | undefined {
    const now = new Date();
    switch (slot.lookup?.status) {
        case "public":
            return { riotId: slot.riotId, puuid: slot.lookup.puuid, visibility: "public", verifiedAt: now };
        case "private":
            return { riotId: slot.riotId, visibility: "private", verifiedAt: now };
        case "not-found":
        case "error":
        case undefined:
            // Name-only: lets the next game match by name, never ranked
            return slot.account ? undefined : { riotId: slot.riotId, visibility: "unknown" };
    }
}

/**
 * Matches every slot of the match to one of the game's players and stores the result on the game. Resolution
 * only ever considers the game's roster, so an account shared between players is unambiguous unless two of its
 * players are in the same lobby - and then only one of them can be on it.
 *
 *  1. name:        the slot's Riot ID is linked to exactly one remaining player
 *  2. puuid:       the slot's Riot ID resolves (tracker, public profiles only) to an account linked to exactly one
 *                  remaining player - this follows renames
 *  3. elimination: exactly one slot and one player remain, and nobody else has that account linked
 *
 * Steps repeat until nothing changes. Renamed and newly seen accounts are linked to their players.
 *
 * @return Notes for the mod channel about accounts that were learned along the way
 * @throws {ParticipantResolutionError} If any slot is left unresolved
 */
export async function resolveParticipants(game: Game, match: MatchResponse): Promise<string[]> {
    const slots = getSlots(match);
    let remaining = [...game.players];

    const assign = (slot: Slot, player: Player, resolvedBy: Participant["resolvedBy"], account?: RiotAccount) => {
        slot.player = player;
        slot.account = account;
        slot.resolvedBy = resolvedBy;
        remaining = remaining.filter(other => other.id != player.id);
    };
    const unassigned = () => slots.filter(slot => !slot.player);

    let progress = true;
    while (progress && unassigned().length > 0) {
        progress = false;

        for (const slot of unassigned()) {
            const candidates = remaining.filter(player => player.findAccount(slot.riotId));
            if (candidates.length == 1) {
                assign(slot, candidates[0], "name", candidates[0].findAccount(slot.riotId));
                progress = true;
            }
        }

        for (const slot of unassigned()) {
            const result = await lookup(slot);
            if (result.status != "public") continue;
            const candidates = remaining.filter(player => player.findAccountByPuuid(result.puuid));
            if (candidates.length == 1) {
                assign(slot, candidates[0], "puuid", candidates[0].findAccountByPuuid(result.puuid));
                progress = true;
            }
        }

        // Matching one slot can disambiguate another (shared accounts): only eliminate once matching is stuck
        if (progress) continue;

        const left = unassigned();
        if (left.length == 1 && remaining.length == 1) {
            const slot = left[0];
            const player = remaining[0];
            const owners = await findOwners(slot);
            // Sharers who are in this lobby played their own slots; only someone off the roster is a conflict
            const others = owners.filter(owner => !game.players.some(rostered => rostered.id == owner.id));
            if (others.length > 0) {
                const mentions = others.map(owner => `<@${owner.id}>`).join(", ");
                throw new ParticipantResolutionError(`**${slot.riotId}** played in game ${game.id} but is linked to `
                    + `${mentions}, who is not on the roster. If they subbed in for <@${player.id}>, use `
                    + `\`/admin substitute\`; if <@${player.id}> shares the account, use \`/admin link-account\`. `
                    + `Then set the match URL again.`);
            }
            assign(slot, player, "elimination");
            progress = true;
        }
    }

    const left = unassigned();
    if (left.length > 0) {
        throw new ParticipantResolutionError(await describeUnresolved(game, left, remaining));
    }

    // Learn renamed and newly seen accounts. Update the stored player (its accounts may be newer than the
    // snapshot in this game) and the snapshot alike.
    const notes: string[] = [];
    for (const slot of slots) {
        const player = slot.player!;
        if (slot.resolvedBy == "name") continue;
        const observed = observedAccount(slot);
        if (!observed) continue;

        const previous = slot.account?.riotId;
        slot.account = player.linkAccount(observed);
        const live = await Player.fetch(player.id);
        if (live) {
            live.linkAccount(observed);
            await live.saveAccounts();
        }

        if (slot.resolvedBy == "puuid" && previous && previous.toLowerCase() != slot.riotId.toLowerCase()) {
            notes.push(`Renamed account **${previous}** → **${slot.riotId}** for <@${player.id}>`);
        } else if (slot.resolvedBy == "elimination") {
            notes.push(`Linked **${slot.riotId}** (${observed.visibility}) to <@${player.id}> by elimination`);
        }
    }

    game.participants = slots.map(slot => ({
        playerId: slot.player!.id,
        riotId: slot.riotId,
        puuid: slot.account?.puuid,
        team: slot.team,
        ranked: Player.isRankedAccount(slot.account),
        resolvedBy: slot.resolvedBy!,
    }));

    return notes;
}

/**
 * Builds a roster for a game created without one (admin match upload): every slot must belong to exactly one
 * registered player, by name or by PUUID.
 *
 * @throws {ParticipantResolutionError} If a slot has no single owner
 */
export async function resolveRoster(game: Game, match: MatchResponse): Promise<Player[]> {
    const players: Player[] = [];
    const problems: string[] = [];
    for (const slot of getSlots(match)) {
        const owners = await findOwners(slot);
        if (owners.length == 1) {
            players.push(owners[0]);
        } else if (owners.length == 0) {
            problems.push(`**${slot.riotId}** is not linked to any registered player`);
        } else {
            problems.push(`**${slot.riotId}** is linked to ${owners.map(owner => `<@${owner.id}>`).join(", ")}`);
        }
    }
    if (problems.length > 0) {
        throw new ParticipantResolutionError(`Cannot build a roster for game ${game.id}:\n- ${problems.join("\n- ")}`);
    }
    return players;
}

/** Registered players with the slot's account linked, by name or (for public profiles) by PUUID */
async function findOwners(slot: Slot): Promise<Player[]> {
    const byName = await Player.fetchByRiotId(slot.riotId);
    const result = await lookup(slot);
    const byPuuid = result.status == "public" ? await Player.fetchByPuuid(result.puuid) : [];
    const owners = new Map<string, Player>();
    for (const player of [...byName, ...byPuuid]) owners.set(player.id, player);
    return [...owners.values()];
}

async function describeUnresolved(game: Game, slots: Slot[], remaining: Player[]) {
    const lines: string[] = [];
    for (const slot of slots) {
        const owners = await findOwners(slot);
        const status = slot.lookup?.status ?? "not looked up";
        const linked = owners.length > 0
            ? `linked to ${owners.map(owner => `<@${owner.id}>`).join(", ")}`
            : "not linked to anyone";
        lines.push(`**${slot.riotId}** (${status}, ${linked})`);
    }
    const players = remaining.length > 0 ? remaining.map(player => `<@${player.id}>`).join(", ") : "none";
    return `Could not tell who played these accounts in game ${game.id}:\n- ${lines.join("\n- ")}\n`
        + `Unmatched players on the roster: ${players}.\n`
        + `Link each account with \`/admin link-account\` (or record subs with \`/admin substitute\`), `
        + `then set the match URL again.`;
}
