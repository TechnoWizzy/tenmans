import {ChatInputCommandInteraction, Colors, EmbedBuilder, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, getEnv, reply} from "../utils/utils.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";
import NodeCache from "node-cache";

const builder = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Look up a user's profile on tracker")
    .addUserOption((user) => user
        .setName("target")
        .setDescription("the user to look up")
        .setRequired(true)
    )

const profileStore = new NodeCache({ stdTTL: 20, checkperiod: 2 });

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

    if (!profile) {
        await ephemeralReply(interaction, { content: `Unable to fetch <@${target.id}>'s profile from Tracker. Please try again later.` });
        return;
    }

    const embed = createProfileEmbed(profile?.data);
    await reply(interaction, { embeds: [ embed ] });
    return;
}

function createProfileEmbed(data: ProfileData) {
    const embed = new EmbedBuilder().setThumbnail(data.platformInfo.avatarUrl);

    let currentRank: SeasonSegment["stats"]["rank"] | null = null;
    let peakRank: SeasonSegment["stats"]["peakRank"] | null = null;

    for (const segment of data.segments) {
        if (segment.type === "season") {
            currentRank = segment.stats.rank;
            peakRank = segment.stats.peakRank;

            embed.setAuthor({
                name: data.platformInfo.platformUserHandle,
                iconURL: currentRank.metadata.iconUrl,
                url:
                    getEnv("TRACKER_URL_PROFILE") +
                    encodeURIComponent(data.platformInfo.platformUserHandle),
            });

            // Add main season stats to description
            embed.setDescription(
                `**Current Rank:** ${currentRank.metadata.tierName}\n` +
                `**Peak Rank:** ${peakRank?.metadata?.tierName ?? "N/A"}\n` +
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
        ) as AgentSegment[];

    const topAgent = agentSegments.at(0);
    if (topAgent) {
        const agentName = topAgent.metadata.name.toLowerCase();
        const agentImagePath = encodeURIComponent(
            getEnv("TRACKER_HERO_CDN").replace("{HERO_NAME}", agentName)
        );
        const imageUrl =
            getEnv("TRACKER_IMAGE_CDN") + agentImagePath + "/image.jpg";

        embed.setColor(topAgent.metadata.color);
        embed.setImage(imageUrl);
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

export class StatsCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}