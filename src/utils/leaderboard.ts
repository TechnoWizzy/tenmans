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

export const leaderboardCache = new Map<number, [EmbedBuilder, ActionRowBuilder<ButtonBuilder>]>;

export async function handleLeaderboardAction(interaction: ButtonInteraction | ChatInputCommandInteraction, action: LeaderboardAction, page: number) {
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
    const query = {
        "stats.games": {
            "$gt": 0
        }
    };

    try {
        if (!leaderboardCache.has(page)) {
            const players = await Database.players.find(query).sort({ "stats.elo": -1 })
                .skip(skip)
                .limit(itemsPerPage)
                .toArray()

            if (players.length == 0) {
                await ephemeralReply(interaction, { content: "No players found for this page." });
                return;
            }

            const embed = new LeaderboardEmbed(players.map(player => new Player(player.id, player.username, player.stats)), page, skip);
            const components = new LeaderboardComponents(page, players.length);
            leaderboardCache.set(page, [ embed, components ]);
        }

        const [embed, components] = leaderboardCache.get(page)!;
        if (interaction.isChatInputCommand()) {
            await reply(interaction, { embeds: [ embed ], components: [ components ] });
        } else {
            await noReply(interaction);
            await interaction.message.edit({ embeds: [ embed ], components: [ components ] });
        }
    } catch (error) {
        await ephemeralReply(interaction, { content: "An error occurred while fetching the leaderboard." });
    }
}

class LeaderboardEmbed extends EmbedBuilder {
    public constructor(players: Player[], page: number, skip: number) {
        super();
        const term = TermManager.currentTerm;
        this.setTitle(`Leaderboard Page ${page}: ${term.Name}`);
        this.setDescription(`${players
                .map(player => {
                    const stats = player.getStats(term.Id);
                    const emote = `<:test:${player.getEmote(term.Id)}>`;
                    const index = players.indexOf(player);
                    const gameS = stats.games == 1 ? "game" : "games";
                    const elo = Math.round(stats.elo);
                    return `**#${skip + index + 1} ${emote} ${player.username}** - **${stats.games}** ${gameS} - **${elo}** elo`;
                })
                .join('\n')
            }`
        )
    }
}

class LeaderboardComponents extends ActionRowBuilder<ButtonBuilder> {
    public constructor(page: number, players: number, disabled = false) {
        super();
        const leftButtonDisabled = page == 1 || disabled;
        const rightButtonDisabled = players != 10 || disabled;
        this.setComponents(
            new ButtonBuilder()
                .setEmoji("1162429590954844340")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,left,${page}`)
                .setDisabled(leftButtonDisabled),
            new ButtonBuilder()
                .setEmoji("1162430047899099136")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,right,${page}`)
                .setDisabled(rightButtonDisabled),
            new ButtonBuilder()
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`leaderboard,refresh,${page}`)
                .setDisabled(disabled)
        )
    }
}