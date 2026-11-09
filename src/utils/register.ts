import type {ButtonInteraction} from "discord.js";
import {ephemeralReply} from "./utils.ts";
import {Player, type RiotAccount} from "../models/player.ts";
import {Tracker} from "./tracker.ts";
import {QueueHandler} from "../queue/queue_handler.ts";

export const PRIVATE_PROFILE_NOTICE = "This account's tracker profile is **private**. You can queue on it, but its "
    + "games are **unranked**: they do not count toward stats or elo. To get stats, make your profile public on "
    + "tracker.gg and run `/register` again.";

/**
 * Looks up a Riot ID and links it to a player, creating the player if they are not registered yet. Past games are
 * never touched: they keep the Riot ID each slot was played as.
 *
 * Linking an account that is already linked to someone else is allowed (shared accounts), but the mods are told.
 *
 * @param primary - Make it the player's primary account (their display name). New players always are.
 * @return A message describing the result, and whether the account was linked
 */
export async function linkRiotAccount(userId: string, riotId: string, primary: boolean): Promise<{ linked: boolean, message: string }> {
    const lookup = await Tracker.lookupAccount(riotId);
    if (lookup.status == "not-found") {
        return { linked: false, message: `**${riotId}** does not exist. Please double check the Riot ID (Name#Tag).` };
    }
    if (lookup.status == "error") {
        return { linked: false, message: `Could not reach tracker to verify **${riotId}**. Please try again later.` };
    }

    const account: RiotAccount = lookup.status == "public"
        ? { riotId: lookup.riotId, puuid: lookup.puuid, visibility: "public", verifiedAt: new Date() }
        : { riotId: riotId.trim(), visibility: "private", verifiedAt: new Date() };

    const existing = await Player.fetch(userId);
    const player = existing ?? new Player(userId, account.riotId);
    player.linkAccount(account, primary || !existing);
    if (existing) {
        await player.saveAccounts();
    } else {
        await player.save();
    }

    const others = (account.puuid ? await Player.fetchByPuuid(account.puuid) : await Player.fetchByRiotId(account.riotId))
        .filter(other => other.id != userId);
    if (others.length > 0) {
        const mentions = others.map(other => `<@${other.id}>`).join(", ");
        await QueueHandler.getModChannel().send({
            content: `Shared account: **${account.riotId}** was linked to <@${userId}> and is also linked to ${mentions}.`
        });
    }

    const action = existing ? "Linked" : "Registered with";
    const notice = account.visibility == "private" ? `\n${PRIVATE_PROFILE_NOTICE}` : "";
    return { linked: true, message: `${action} **${account.riotId}**.${notice}` };
}

export async function confirmRegistration(interaction: ButtonInteraction, userId: string, riotId: string) {
    const { message } = await linkRiotAccount(userId, riotId, true);
    await ephemeralReply(interaction, { content: message });
}

export function formatAccounts(player: Player) {
    if (player.accounts.length == 0) return "No linked accounts";
    return player.accounts
        .map(account => {
            const state = Player.isRankedAccount(account) ? "ranked"
                : account.visibility == "private" ? "private, unranked" : "unverified, unranked";
            return `**${account.riotId}** (${state})`;
        })
        .join("\n");
}
