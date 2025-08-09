import {ChatInputCommandInteraction, EmbedBuilder, type Guild, SlashCommandBuilder} from "discord.js";
import {Command} from "./command.ts";
import {ephemeralReply, getEnv} from "../utils/utils.ts";
import {Player} from "../models/player.ts";
import {Tracker} from "../utils/tracker.ts";

const builder = new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Look up a user's stats")
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
        .setTitle(data.platformInfo.platformUserHandle)
        .setURL(getEnv("TRACKER_URL_PROFILE") + encodeURIComponent(data.platformInfo.platformUserHandle))
        .setImage(data.platformInfo.avatarUrl)

    for (const segment of data.segments) {
        switch (segment.type) {
            case "peak-rating":
                const ratingStats = segment.stats;
                embed.setThumbnail(ratingStats.peakRating.metadata.iconUrl);
                break;

            case "season":

                break;
        }
    }

    return embed;
}

export class StatsCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}