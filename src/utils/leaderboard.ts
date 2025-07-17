import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction, ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import {ephemeralReply, noReply, reply} from "./utils.ts";
import {Database} from "../database/database.ts";
import {Player} from "../models/player.ts";
import {TermManager} from "./term.ts";

export const leaderboardCache = new Map<string, [EmbedBuilder, ActionRowBuilder<ButtonBuilder>]>;

export async function handleLeaderboardAction(interaction: ButtonInteraction | ChatInputCommandInteraction, action: LeaderboardAction, page: number, termId: string) {
    switch (action) {
        case "left": {
            page -= 1;
            break;
        }

        case "right": {
            page += 1;
            break;
        }

        case "refresh": {
            break;
        }

        default: {
            await ephemeralReply(interaction, { content: "Unknown Leaderboard Action" });
            return;
        }
    }

    const itemsPerPage = 10;
    const skip = (page - 1) * itemsPerPage;
    const [embed, components] = await generateLeaderboard(page, skip, itemsPerPage, termId);

    if (!embed || !components) {
        await ephemeralReply(interaction, { content: "No players found for this page." });
        return;
    }

    if (interaction.isChatInputCommand()) {
        await reply(interaction, { embeds: [ embed ], components: [ components ] });
    } else {
        await noReply(interaction);
        await interaction.message.edit({ embeds: [ embed ], components: [ components ] });
    }
}

export async function generateLeaderboard(page: number, skip: number, itemsPerPage: number, termId: string) {
    const pipeline = [
        { // Find players with games this term
            $match: {
                stats: {
                    $elemMatch: {
                        termId: termId,
                        games: {
                            $gt: 0,
                        },
                    },
                },
            },
        },
        { // Create an index on which to sort players -- their elo this term
            $addFields: {
                sortStats: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$stats",
                                as: "stat",
                                cond: {
                                    $and: [
                                        { $eq: ["$$stat.termId", termId] },
                                        { $gt: ["$$stat.games", 0] },
                                    ],
                                },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        { // Perform sort
            $sort: {
                "sortStats.elo": -1,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: itemsPerPage,
        }
    ];

    if (!leaderboardCache.has(createKey(page, termId))) {
        const players = await Database.players.aggregate(pipeline).toArray();

        if (players.length == 0) {
            return [null, null];
        }

        const classifiedPlayers = players.map(player => new Player(player.id, player.username, player.stats));
        const embed = new LeaderboardEmbed(classifiedPlayers, page, skip, termId);
        const components = new LeaderboardComponents(page, players.length, termId);
        leaderboardCache.set(createKey(page, termId), [ embed, components ]);
    }

    return leaderboardCache.get(createKey(page, termId))!;
}

export class LeaderboardEmbed extends EmbedBuilder {
    public constructor(players: Player[], page: number, skip: number, termId: string) {
        super();
        const term = TermManager.getTerm(termId)
        this.setAuthor({ name: term.Name })
        this.setTitle(`Leaderboard Page ${page}`);
        this.setDescription(`${players
                .map(player => {
                    const stats = player.getStats(term.Id);
                    const emote = `<:test:${player.getEmote(term.Id)}>`;
                    const index = players.indexOf(player);
                    const wins = `${stats.wins}W`
                    const losses = `${stats.losses}L`
                    const elo = `**${Math.round(stats.elo)}** elo`;
                    const username = removeFormatChars(player.username)
                    return `**#${skip + index + 1} ${emote} ${username}** - ${elo} - ${wins}/${losses}`;
                })
                .join('\n')
            }`
        )
    }
}

class LeaderboardComponents extends ActionRowBuilder<ButtonBuilder> {
    public constructor(page: number, players: number, termId: string) {
        super();
        const leftButtonDisabled = page == 1;
        const rightButtonDisabled = players != 10;
        this.setComponents(
            new ButtonBuilder()
                .setEmoji("1162429590954844340")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,left,${page},${termId}`)
                .setDisabled(leftButtonDisabled),
            new ButtonBuilder()
                .setEmoji("1162430047899099136")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,right,${page},${termId}`)
                .setDisabled(rightButtonDisabled),
            new ButtonBuilder()
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,refresh,${page},${termId}`)
        )
    }
}

function createKey(page: number, termId: string) {
    return [page, termId].join(',');
}

function removeFormatChars(value: string) {
    return value
        .replace('_', '\_')
        .replace('*', '\*')
        .replace('~', '\~')
        .replace('`', '\`')
        .replace('|', '\|')
        .replace('#', '\#')
        .replace('-', '\-')
        .replace('.', '\.')
}