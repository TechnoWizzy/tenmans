import {ChatInputCommandInteraction, EmbedBuilder, type Guild, SlashCommandBuilder, type User} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, getEnv, reply} from "../utils/utils.ts";
import {Player, RankEmote} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";
import NodeCache from "node-cache";

const builder = new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Look up a user's tracker profile")
    .addUserOption((user) => user
        .setName("target")
        .setDescription("the user to look up")
        .setRequired(true)
    )

const profileStore = new NodeCache({stdTTL: 20, checkperiod: 2});

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const target = interaction.options.getUser("target", true);
    const player = await Player.fetch(target.id);

    if (!player) {
        await ephemeralReply(interaction, { content: `<@${target.id}> is not currently registered` });
        return;
    }

    const profile = await Tracker.fetchProfile(player.username);

    const time = profileStore.get<number>(player.id);
    if (time) {
        await ephemeralReply(interaction, { content: `You will be able to use this command <t:{time}:R>` });
        return;
    }
    profileStore.set<number>(player.id, Date.now() + (20 * 1000));

    if (!profile) {
        await ephemeralReply(interaction, { content: `Unable to fetch <@${target.id}>'s profile from Tracker. Please try again later.` });
        return;
    }

    const embed = createProfileEmbed(target, profile?.data);
    await reply(interaction, { embeds: [ embed ] });
    return;
}

function createProfileEmbed(user: User, data: ProfileData) {
    const embed = new EmbedBuilder()
        .setAuthor({
            name: data.platformInfo.platformUserHandle,
            iconURL: user.displayAvatarURL({ extension: "png" }),
            url: getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(data.platformInfo.platformUserHandle),
        });

    let currentRank: SeasonSegment["stats"]["rank"] | null = null;
    let peakRank: SeasonSegment["stats"]["peakRank"] | null = null;

    for (const segment of data.segments) {
        if (segment.type === "season") {
            currentRank = segment.stats.rank;
            peakRank = segment.stats.peakRank;

            if (!currentRank) {
                return new EmbedBuilder()
                    .setTitle("You don't play the game")
                    .setDescription("Why are you using this command?")
            }

            const currentRankName = currentRank.metadata.tierName.replace(' ', '');
            const peakRankName = peakRank?.metadata?.tierName.replace(' ', '') ?? "unrated";
            const currentRankEmote = `<:${currentRankName}:${getEmoteFromRank(currentRank.metadata.tierName)}>`;
            const peakRankEmote = `<:${peakRankName}:${getEmoteFromRank(peakRank?.metadata?.tierName)}>`;

            // Add main season stats to description
            embed.setDescription(
                `**Current Rank:** ${currentRank.metadata.tierName} ${currentRankEmote}\n` +
                `**Peak Rank:** ${peakRank?.metadata?.tierName ?? "N/A"} ${peakRankEmote}\n` +
                `**Win %:** ${segment.stats.matchesWinPct.displayValue}\n` +
                `**K/D:** ${segment.stats.kDRatio.displayValue}\n` +
                `**ACS:** ${segment.stats.scorePerRound.displayValue}\n` +
                `**HS%:** ${segment.stats.headshotsPercentage.displayValue}`
            );
        }
    }

    const agentSegments = data.segments
        .filter((segment) => segment.type === "agent")
        .sort(
            (a, b) =>
                (b as AgentSegment).stats.timePlayed.value -
                (a as AgentSegment).stats.timePlayed.value
        )
        .slice(0, 3) as AgentSegment[];

    const topAgent = agentSegments.at(0);
    if (topAgent) {
        embed.setColor(topAgent.metadata.color);
        embed.setThumbnail(topAgent.metadata.imageUrl);
    }

    for (const agent of agentSegments) {
        embed.addFields({
            name: `${agent.metadata.name}`,
            value:
                `Matches: ${agent.stats.matchesPlayed.displayValue}\n` +
                `Win %: ${agent.stats.matchesWinPct.displayValue}\n` +
                `K/D: ${agent.stats.kDRatio.displayValue}\n` +
                `ACS: ${agent.stats.scorePerRound.displayValue}`,
            inline: true,
        });
    }

    return embed;
}

function getEmoteFromRank(value?: string) {
    if (value == "Radiant") return RankEmote.Radiant;
    if (value == "Immortal 3") return RankEmote.ImmortalIII;
    if (value == "Immortal 2") return RankEmote.ImmortalII;
    if (value == "Immortal 1") return RankEmote.ImmortalI;
    if (value == "Ascendant 3") return RankEmote.AscendantIII;
    if (value == "Ascendant 2") return RankEmote.AscendantII;
    if (value == "Ascendant 1") return RankEmote.AscendantI;
    if (value == "Diamond 3") return RankEmote.DiamondIII;
    if (value == "Diamond 2") return RankEmote.DiamondII;
    if (value == "Diamond 1") return RankEmote.DiamondI;
    if (value == "Platinum 3") return RankEmote.PlatinumIII;
    if (value == "Platinum 2") return RankEmote.PlatinumII;
    if (value == "Platinum 1") return RankEmote.PlatinumI;
    if (value == "Gold 3") return RankEmote.GoldIII;
    if (value == "Gold 2") return RankEmote.GoldII;
    if (value == "Gold 1") return RankEmote.GoldI;
    if (value == "Silver 3") return RankEmote.SilverIII;
    if (value == "Silver 2") return RankEmote.SilverII;
    if (value == "Silver 1") return RankEmote.SilverI;
    if (value == "Bronze 3") return RankEmote.BronzeIII;
    if (value == "Bronze 2") return RankEmote.BronzeII;
    if (value == "Bronze 1") return RankEmote.BronzeI;
    if (value == "Iron 3") return RankEmote.IronIII;
    if (value == "Iron 2") return RankEmote.IronII;
    if (value == "Iron 1") return RankEmote.IronI;
    return RankEmote.Unrated;
}

export class TrackerCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}