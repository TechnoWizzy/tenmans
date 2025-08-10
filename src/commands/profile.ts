import {ChatInputCommandInteraction, Colors, EmbedBuilder, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, getEnv} from "../utils/utils.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";

const builder = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Look up a user's profile on tracker")
    .addUserOption((user) => user
        .setName("target")
        .setDescription("the user to look up")
        .setRequired(true)
    )

async function execute(interaction: ChatInputCommandInteraction, _: Guild) {
    const target = interaction.options.getUser("target", true);
    const player = await Player.fetch(target.id);

    if (!player) {
        await ephemeralReply(interaction, { content: `<@${target.id}> is not currently registered` });
        return;
    }

    const profile = await Tracker.fetchProfile(player.username);

    if (!profile) {
        await ephemeralReply(interaction, { content: `Unable to fetch <@${target.id}>'s profile from Tracker. Please try again later.` });
        return;
    }

    const embed = createProfileEmbed(profile?.data);
    await ephemeralReply(interaction, { embeds: [ embed ] });
    return;
}

function createProfileEmbed(data: ProfileData) {
    const embed = new EmbedBuilder()
        .setThumbnail(data.platformInfo.avatarUrl)


    for (const segment of data.segments) {
        switch (segment.type) {
            case "season":
                const currentRank = segment.stats.rank;
                // const peakRank = segment.stats.peakRank;

                embed.setAuthor({
                    name: data.platformInfo.platformUserHandle,
                    iconURL: currentRank.metadata.iconUrl,
                    url: getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(data.platformInfo.platformUserHandle)
                });
                break;
        }
    }

    const agentSegments = data.segments
        .filter(segment => segment.type == "agent")
        .sort((a, b) => b.stats.timePlayed.value - a.stats.timePlayed.value);

    const topAgent = agentSegments.at(0);
    if (topAgent) {
        const agentName = topAgent.metadata.name.toLowerCase();
        const imageUrl = getEnv("TRACKER_IMAGE_CDN") + getEnv("TRACKER_HERO_CDN").replace("{HERO_NAME}", agentName)

        embed.setColor(topAgent.metadata.color);
        embed.setImage(imageUrl);
    }

    return embed;
}

export class StatsCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}