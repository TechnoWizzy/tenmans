import {ChatInputCommandInteraction, EmbedBuilder, type Guild, type GuildMember, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, getEnv, reply} from "../utils/utils.ts";
import {Player, PlayerStats, RankEmote} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";
import NodeCache from "node-cache";
import {TermManager} from "../utils/term.ts";

const builder = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Look up a user's tenmans profile")
    .addUserOption((user) => user
        .setName("target")
        .setDescription("the user to look up")
        .setRequired(true)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const target = interaction.options.getUser("target", true);
    const member = await interaction.guild?.members.fetch(target.id);
    const player = await Player.fetch(target.id);

    if (!member) {
        await ephemeralReply(interaction, { content: `<@${target.id}> is not currently in this server` });
        return;
    }

    if (!player) {
        await ephemeralReply(interaction, { content: `<@${target.id}> is not currently registered` });
        return;
    }

    const stats = player.getStats(TermManager.currentTerm.Id);
    const bestStats = player.getBestStats();
    const embed = createProfileEmbed(member, player, stats, bestStats);
    await reply(interaction, {embeds: [embed]});
    return;
}

function createProfileEmbed(member: GuildMember, player: Player, stats: PlayerStats, best?: PlayerStats) {
    const embed = new EmbedBuilder()
        .setAuthor({
            name: player.username,
            iconURL: member.displayAvatarURL({ extension: "png" }),
            url: getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(player.username),
        });

    if (stats.games < 1) {
        return new EmbedBuilder()
            .setTitle("You don't play the game")
            .setDescription("Why are you using this command?")
    }



    const currentRank = player.getEmote(stats.termId);
    const peakRank = player.getEmote(best?.termId);
    const currentRankEmote = `<:rank:${currentRank}>`;
    const peakRankEmote = `<:rank:${peakRank}>`;

    embed.setDescription(
        `**Current Rank:** ${getRankFromEmote(currentRank)} ${currentRankEmote}\n` +
        `**Peak Rank:** ${getRankFromEmote(peakRank)} ${peakRankEmote}\n` +
        `**Win %:** ${(100 * stats.wins / stats.losses).toFixed(1)}%\n` +
        `**K/D:** ${(stats.kills / stats.deaths).toFixed(2)}\n` +
        `**ACS:** ${(stats.totalAcs / stats.games).toFixed(1)}\n` +
        `**HS%:** ${(100 * stats.headshots / stats.totalshots).toFixed(1)}%`
    );

    const agentStats = stats.agents
        .sort((a, b) => b.games - a.games)
        .slice(0, 3);

    const topAgent = agentStats.at(0);
    if (topAgent) {
        embed.setColor(topAgent.color);
        embed.setThumbnail(getEnv("TRACKER_CDN_HERO").replace("{HERO_ID}", topAgent.id));
    }

    for (const agent of agentStats) {
        embed.addFields({
            name: `${agent.name}`,
            value:
                `Matches: ${agent.games}\n` +
                `Win %: ${(100 * agent.wins / agent.losses).toFixed(1)}%\n` +
                `K/D: ${(agent.kills / agent.losses).toFixed(2)}\n` +
                `ACS: ${(agent.totalAcs / agent.games).toFixed(1)}`,
            inline: true,
        });
    }

    return embed;
}

function getRankFromEmote(rank: RankEmote): string {
    if (rank === RankEmote.Radiant) return "Radiant";
    if (rank === RankEmote.ImmortalIII) return "Immortal 3";
    if (rank === RankEmote.ImmortalII) return "Immortal 2";
    if (rank === RankEmote.ImmortalI) return "Immortal 1";
    if (rank === RankEmote.AscendantIII) return "Ascendant 3";
    if (rank === RankEmote.AscendantII) return "Ascendant 2";
    if (rank === RankEmote.AscendantI) return "Ascendant 1";
    if (rank === RankEmote.DiamondIII) return "Diamond 3";
    if (rank === RankEmote.DiamondII) return "Diamond 2";
    if (rank === RankEmote.DiamondI) return "Diamond 1";
    if (rank === RankEmote.PlatinumIII) return "Platinum 3";
    if (rank === RankEmote.PlatinumII) return "Platinum 2";
    if (rank === RankEmote.PlatinumI) return "Platinum 1";
    if (rank === RankEmote.GoldIII) return "Gold 3";
    if (rank === RankEmote.GoldII) return "Gold 2";
    if (rank === RankEmote.GoldI) return "Gold 1";
    if (rank === RankEmote.SilverIII) return "Silver 3";
    if (rank === RankEmote.SilverII) return "Silver 2";
    if (rank === RankEmote.SilverI) return "Silver 1";
    if (rank === RankEmote.BronzeIII) return "Bronze 3";
    if (rank === RankEmote.BronzeII) return "Bronze 2";
    if (rank === RankEmote.BronzeI) return "Bronze 1";
    if (rank === RankEmote.IronIII) return "Iron 3";
    if (rank === RankEmote.IronII) return "Iron 2";
    if (rank === RankEmote.IronI) return "Iron 1";
    if (rank === RankEmote.Unrated) return "Unrated";
    return "Unrated";
}

export class ProfileCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}