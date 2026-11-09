import {ActionRowBuilder, ButtonBuilder, type ButtonInteraction, ButtonStyle} from "discord.js";
import {createCustomId, ephemeralReply, getEnv} from "./utils.ts";
import {Player, type RiotAccount} from "../models/player.ts";
import {Tracker} from "./tracker.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {Settings} from "../settings/settings.ts";

export const PRIVATE_PROFILE_NOTICE = "This account's tracker profile is **private**. You can queue on it, but its "
    + "games are **unranked**: they do not count toward stats or elo. To get stats, make your profile public on "
    + "tracker.gg and run `/register` again.";

/**
 * What `/register` does with a Riot ID for a given player:
 * - register: the player is new
 * - update: the account is already linked to the player (renamed, or its profile changed visibility)
 * - replace: the player has no ranked account, so the new account replaces what they have
 * - request: a second account for a ranked player, which a mod has to approve
 * - deny-private: a second account for a ranked player whose profile is private, which is never approved
 */
export type AccountChange = "register" | "update" | "replace" | "request" | "deny-private";

export function planAccountChange(player: Player | null, account: RiotAccount): AccountChange {
    if (!player) return "register";
    const linked = (account.puuid ? player.findAccountByPuuid(account.puuid) : undefined) ?? player.findAccount(account.riotId);
    if (linked) return "update";
    if (!player.isRanked()) return "replace";
    return account.visibility == "private" ? "deny-private" : "request";
}

export function toAccount(riotId: string, lookup: AccountLookup & { status: "public" | "private" }): RiotAccount {
    return lookup.status == "public"
        ? { riotId: lookup.riotId, puuid: lookup.puuid, visibility: "public", verifiedAt: new Date() }
        : { riotId: riotId.trim(), visibility: "private", verifiedAt: new Date() };
}

export function profileUrl(riotId: string) {
    return getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(riotId);
}

async function lookupAccount(riotId: string): Promise<{ account?: RiotAccount, message?: string }> {
    const lookup = await Tracker.lookupAccount(riotId);
    if (lookup.status == "not-found") {
        return { message: `**${riotId}** does not exist. Please double check the Riot ID (Name#Tag).` };
    }
    if (lookup.status == "error") {
        return { message: `Could not reach tracker to verify **${riotId}**. Please try again later.` };
    }
    return { account: toAccount(riotId, lookup) };
}

/** Tells the mods when an account is also linked to other players */
async function reportSharedAccount(userId: string, account: RiotAccount) {
    const others = await findOtherOwners(userId, account);
    if (others.length > 0) {
        const mentions = others.map(other => `<@${other.id}>`).join(", ");
        await QueueHandler.getModChannel().send({
            content: `Shared account: **${account.riotId}** was linked to <@${userId}> and is also linked to ${mentions}.`
        });
    }
}

async function findOtherOwners(userId: string, account: RiotAccount) {
    const owners = account.puuid ? await Player.fetchByPuuid(account.puuid) : await Player.fetchByRiotId(account.riotId);
    return owners.filter(other => other.id != userId);
}

/** Saves the account onto the player (creating them if needed) as their primary account */
async function saveAccount(userId: string, existing: Player | null, account: RiotAccount, replace: boolean) {
    const player = existing ?? new Player(userId, account.riotId);
    if (replace) player.accounts = [];
    player.linkAccount(account, true);
    if (existing) {
        await player.saveAccounts();
    } else {
        await player.save();
    }
    await reportSharedAccount(userId, account);
}

/**
 * Looks up a Riot ID and links it to a player without any approval, creating the player if they are not registered
 * yet. Used by admins. Past games are never touched: they keep the Riot ID each slot was played as.
 *
 * @param primary - Make it the player's primary account (their display name). New players always are.
 * @return A message describing the result, and whether the account was linked
 */
export async function linkRiotAccount(userId: string, riotId: string, primary: boolean): Promise<{ linked: boolean, message: string }> {
    const { account, message } = await lookupAccount(riotId);
    if (!account) return { linked: false, message: message! };

    const existing = await Player.fetch(userId);
    const player = existing ?? new Player(userId, account.riotId);
    player.linkAccount(account, primary || !existing);
    if (existing) {
        await player.saveAccounts();
    } else {
        await player.save();
    }
    await reportSharedAccount(userId, account);

    const action = existing ? "Linked" : "Registered with";
    const notice = account.visibility == "private" ? `\n${PRIVATE_PROFILE_NOTICE}` : "";
    return { linked: true, message: `${action} **${account.riotId}**.${notice}` };
}

/** Handles the Confirm button of `/register` */
export async function confirmRegistration(interaction: ButtonInteraction, userId: string, riotId: string) {
    const { account, message } = await lookupAccount(riotId);
    if (!account) {
        await ephemeralReply(interaction, { content: message! });
        return;
    }

    const existing = await Player.fetch(userId);
    const notice = account.visibility == "private" ? `\n${PRIVATE_PROFILE_NOTICE}` : "";
    switch (planAccountChange(existing, account)) {
        case "register":
            await saveAccount(userId, existing, account, false);
            await ephemeralReply(interaction, { content: `Registered with **${account.riotId}**.${notice}` });
            break;

        case "update":
            await saveAccount(userId, existing, account, false);
            await ephemeralReply(interaction, { content: `Updated **${account.riotId}**.${notice}` });
            break;

        case "replace": {
            const replaced = existing!.accounts.map(a => `**${a.riotId}**`).join(", ") || "your previous account";
            await saveAccount(userId, existing, account, true);
            await ephemeralReply(interaction, { content: `Replaced ${replaced} with **${account.riotId}**.${notice}` });
            break;
        }

        case "deny-private":
            await ephemeralReply(interaction, { content: SECOND_PRIVATE_DENIED(account.riotId) });
            break;

        case "request":
            await requestApproval(existing!, account);
            await ephemeralReply(interaction, { content: `Adding **${account.riotId}** as another account needs a mod's approval. The mods have been asked, and you will get a DM once they decide.` });
            break;
    }
}

const SECOND_PRIVATE_DENIED = (riotId: string) => `**${riotId}** has a private tracker profile, so it cannot be added `
    + `as another account. Make the profile public on tracker.gg and run \`/register\` again.`;

/** Asks the mods whether a ranked player may add another account */
async function requestApproval(player: Player, account: RiotAccount) {
    const settings = await Settings.fetchSettings();
    const mentions = settings.roles.admins.map(roleId => `<@&${roleId}>`).join(" ");
    const others = await findOtherOwners(player.id, account);
    const shared = others.length > 0
        ? `\n:warning: Also linked to ${others.map(other => `<@${other.id}>`).join(", ")}.`
        : "";

    const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(createCustomId("account-request", "approve", player.id, account.riotId))
            .setStyle(ButtonStyle.Success)
            .setLabel("Approve"),
        new ButtonBuilder()
            .setCustomId(createCustomId("account-request", "deny", player.id, account.riotId))
            .setStyle(ButtonStyle.Danger)
            .setLabel("Deny"),
    );

    await QueueHandler.getModChannel().send({
        content: `${mentions} <@${player.id}> wants to add another account: [**${account.riotId}**](${profileUrl(account.riotId)})${shared}\n`
            + `Current accounts:\n${formatAccounts(player, true)}`,
        components: [ buttons ],
        allowedMentions: { roles: settings.roles.admins },
    });
}

/** Handles the Approve / Deny buttons of an account request. Only admins may use them. */
export async function decideAccountRequest(interaction: ButtonInteraction, approve: boolean, userId: string, riotId: string) {
    const decidedBy = `<@${interaction.user.id}>`;
    let outcome: string;
    let dm: string;

    if (!approve) {
        outcome = `Denied by ${decidedBy}.`;
        dm = `A mod denied adding **${riotId}** to your 10mans accounts.`;
    } else {
        // Re-check: the profile may have gone private or been renamed since the request
        const { account, message } = await lookupAccount(riotId);
        if (!account) {
            // Leave the buttons so a mod can retry once tracker answers
            await ephemeralReply(interaction, { content: message! });
            return;
        }

        const existing = await Player.fetch(userId);
        if (!existing) {
            await ephemeralReply(interaction, { content: `<@${userId}> is no longer registered.` });
            return;
        }

        const change = planAccountChange(existing, account);
        if (change == "deny-private") {
            outcome = `Approved by ${decidedBy}, but **${account.riotId}** is now private, so it was denied.`;
            dm = SECOND_PRIVATE_DENIED(account.riotId);
        } else {
            // "update" if it was linked meanwhile, "replace" if the player lost their ranked account meanwhile
            await saveAccount(userId, existing, account, change == "replace");
            outcome = `Approved by ${decidedBy}.`;
            dm = `A mod approved **${account.riotId}**. It is now linked to your 10mans account.`;
        }
    }

    await interaction.message.edit({ content: `${interaction.message.content}\n**${outcome}**`, components: [], allowedMentions: { parse: [] } });
    await interaction.client.users.send(userId, dm).catch(() => {
        // DMs closed: the mod channel message is the record
    });
    await ephemeralReply(interaction, { content: outcome });
}

export function formatAccounts(player: Player, links: boolean = false) {
    if (player.accounts.length == 0) return "No linked accounts";
    return player.accounts
        .map(account => {
            const state = Player.isRankedAccount(account) ? "ranked"
                : account.visibility == "private" ? "private, unranked" : "unverified, unranked";
            const name = links ? `[**${account.riotId}**](${profileUrl(account.riotId)})` : `**${account.riotId}**`;
            return `${links ? "- " : ""}${name} (${state})`;
        })
        .join("\n");
}
