import {createCustomId, ephemeralReply, noReply, reply} from "./utils.ts";
import {
    ActionRowBuilder,
    type Interaction, ModalBuilder, TextInputBuilder, TextInputStyle,
} from "discord.js";
import {Game, Team} from "../models/game.ts";
import {Player} from "../models/player.ts";
import {resolveParticipants, resolveRoster} from "./participants.ts";
import {sameRiotId} from "./utils.ts";
import {Tracker} from "./tracker.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {leaderboardCache} from "./leaderboard.ts";

export async function handleGameAction(interaction: Interaction, game: Game, action: GameAction) {
    if (game.isLegacy()) {
        await ephemeralReply(interaction, { content: `Game ${game.id} predates linked Riot accounts and is frozen. It can no longer be changed.` });
        return;
    }

    switch (action) {
        case "upload-data": {
            if (interaction.isChatInputCommand()) {
                const attachment = interaction.options.getAttachment("game-data", true);
                const response = await fetch(attachment.url);
                if (!response.ok) {
                    await ephemeralReply(interaction, {content: "Failed to retrieved attached data"});
                    return;
                }

                const data = await response.json() as MatchResponse;
                const matchId = data.data.attributes.id;

                // Games created for an upload have no roster: build one from the linked accounts
                if (game.players.length == 0) {
                    game.players = await resolveRoster(game, data);
                }

                Tracker.setMatchData(matchId, data);
                game.matchId = matchId;
                game.participants = undefined;
                await propagateGameChange(interaction, game);
            }
            break;
        }

        case "set-url": {
            if (interaction.isButton()) {
                await interaction.showModal(game.createModal());
                return;
            }

            if (!interaction.isModalSubmit()) {
                await ephemeralReply(interaction, { content: `This interaction type is temporarily disabled for game uploads.`});
                return;
            }

            const url = interaction.fields.getTextInputValue("url")
            const regex = /https:\/\/tracker\.gg\/valorant\/match\/([0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i;
            const regexMatch = url.match(regex);
            const matchId = regexMatch?.at(1);
            if (!matchId) {
                await ephemeralReply(interaction, { content: "Invalid URL" });
                return;
            }

            if (game.matchId != matchId) {
                game.participants = undefined;
            }
            game.matchId = matchId;
            await propagateGameChange(interaction, game);
            break;
        }

        case "cancel": {
            if (!interaction.isButton()) {
                await noReply(interaction);
                return;
            }

            const modal = new ModalBuilder()
                .setTitle("Cancel")
                .setCustomId(createCustomId("game", game.id, "cancel-confirm"))
                .setComponents(new ActionRowBuilder<TextInputBuilder>()
                    .setComponents(
                        new TextInputBuilder()
                            .setLabel("Reason")
                            .setPlaceholder("Why was the game cancelled?")
                            .setCustomId(createCustomId("reason"))
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                )

            await interaction.showModal(modal);
            break;
        }

        case "cancel-confirm": {
            if (interaction.isModalSubmit()) {
                const reason = interaction.fields.getTextInputValue("reason");
                game.cancelled = true;
                game.cancelReason = reason;
                await game.save();

                // for (const player of game.players) {
                //     const stats = player.getStats(TermManager.currentTerm.Id);
                //     const timeout = 60 * 1000; // 1 minute
                //     stats.timeout = new Date(Date.now() + timeout);
                //     await player.save();
                // }

                await propagateGameChange(interaction, game);
            } else {
                await ephemeralReply(interaction, { content: "This operation is not supported." });
            }

            break;
        }
    }
}

/**
 * Applies a change to a game and replays every later game of the term.
 *
 * @param interaction - The interaction that made the change, or undefined when the bot made it (auto-detection)
 */
export async function propagateGameChange(interaction: Interaction | undefined, game: Game, silent: boolean = false) {
    const actor = interaction ? `by <@${interaction.user.id}>` : "automatically";
    const games = await game.fetchAllAfter();
    games.unshift(game);

    const channel = QueueHandler.getChannel();
    const modChannel = QueueHandler.getModChannel();

    if (games.length == 1) {
        if (game.cancelled) {
            const embed = game.createEmbed();
            const components = game.createComponents();
            if (!silent) {
                await channel.send({
                    content: `Game ${game.id} has been cancelled ${actor} with reason "${game.cancelReason}"`,
                    embeds: [ embed ]
                });
                await modChannel.send({
                    content: `Game ${game.id} has been cancelled ${actor} with reason "${game.cancelReason}"`,
                    embeds: [ embed ],
                    components: [ components ]
                });
            }
            return;
        }
    }

    const modifiedPlayers = new Map<string, Player>()

    for (const game of games) {
        const notes: string[] = [];
        const eloChange = await parseGameStats(game, modifiedPlayers, notes);

        const embed = game.createEmbed(eloChange);
        const components = game.createComponents();
        if (!silent) {
            const noteText = notes.map(note => `\n- ${note}`).join("");
            await modChannel.send({ content: `Game ${game.id} has been updated ${actor}.${noteText}`, embeds: [ embed ], components: [ components ] });
        }

        if (!game.isOngoing() && !silent) {
            if (game.cancelled) {
                // Skip cancelled games they just make noise
                continue;
            }
            const winnerText = game.teamRed.hasWon ? "Team Red has won!" : "Team Blue has won!";
            await channel.send({ content: `Game ${game.id} has been updated ${actor}. ${winnerText}`, embeds: [ embed ] });
        }
    }

    const pluralityText = games.length == 1 ? "game update was" : "game updates were";
    if (interaction) {
        await reply(interaction, { content: `${games.length} ${pluralityText} applied successfully.` });
    }


    // Delete leaderboard pages for this term
    leaderboardCache.keys().forEach(key => {
        if (key.includes(game.termId)) {
            leaderboardCache.delete(key);
        }
    });
}

/**
 * Applies a game's match to its players' stats and elo.
 *
 * Who played which slot is resolved once (see {@link resolveParticipants}) and stored on the game, so replays
 * never depend on current Riot IDs. Only participants on a ranked account gain stats and elo, and only they
 * count toward their team's average elo.
 *
 * @param notes - Receives notes about accounts learned while resolving participants
 * @throws {Error} For legacy games, which are frozen
 */
export async function parseGameStats(game: Game, modifiedPlayers: Map<string, Player>, notes: string[] = []) {
    if (game.isLegacy()) {
        throw new Error(`Game ${game.id} predates linked Riot accounts and is frozen`);
    }

    for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        const modifiedPlayer = modifiedPlayers.get(player.id);
        if (modifiedPlayer) {
            game.players[i] = modifiedPlayer;
        }
    }

    if (!game.matchId) {
        return;
    }

    const match = await Tracker.fetchMatch(game.matchId);
    if (match == null) {
        return;
    }

    for (const segment of match.data.segments) {
        if (segment.type == "team-summary") {
            const teamId = segment.attributes.teamId;
            const score = segment.stats.roundsWon.value;
            const hasWon = segment.metadata.hasWon;
            if (teamId == "Red") {
                game.teamRed = new Team("Red", game.termId, score, hasWon)
            } else {
                game.teamBlue = new Team("Blue", game.termId, score, hasWon);
            }
        }
    }

    if (!game.teamRed.hasWon && !game.teamBlue.hasWon) {
        throw new Error(`Neither team has won game ${game.id}`);
    }

    if (!game.participants) {
        notes.push(...await resolveParticipants(game, match));
    }

    for (const segment of match.data.segments) {
        if (segment.type == "player-summary") {
            const riotId = segment.attributes.platformUserIdentifier;
            const participant = game.participants!.find(participant => sameRiotId(participant.riotId, riotId));
            const player = participant && game.players.find(player => player.id == participant.playerId);
            if (!participant || !player) {
                throw new Error(`Slot ${riotId} in game ${game.id} has no participant`);
            }

            if (participant.team == "Red") {
                game.teamRed.players.push(player);
            } else {
                game.teamBlue.players.push(player);
            }

            if (!participant.ranked) {
                // Unranked accounts have no stats; the player's existing stats stay frozen
                continue;
            }

            const stats = player.getStats(game.termId);
            const agentStats = stats.getAgentStats(segment.metadata.agentKey, {
                name: segment.metadata.agentName,
                color: segment.metadata.agentColor,
            });

            stats.agentId = agentStats.id;
            stats.acs = Math.round(segment.stats.scorePerRound.value);
            stats.kills += segment.stats.kills.value;
            stats.assists += segment.stats.assists.value;
            stats.deaths += segment.stats.deaths.value;
            stats.headshots += segment.stats.headshots.value;
            stats.totalAcs += stats.acs;
            stats.games += 1;

            agentStats.kills += segment.stats.kills.value;
            agentStats.assists += segment.stats.assists.value;
            agentStats.deaths += segment.stats.deaths.value;
            agentStats.headshots += segment.stats.headshots.value;
            agentStats.totalAcs += stats.acs;
            agentStats.games += 1;

            const headshots = segment.stats.headshots.value;
            const hsAccuracy = segment.stats.hsAccuracy.value;
            const totalShots = Math.round(100 * headshots / hsAccuracy);
            stats.totalshots += totalShots;
            agentStats.totalshots += totalShots;
        }
    }

    // Save game before doing win/loss/elo stats
    await game.save();
    const eloChange = new Map<string, number>();

    // Team averages use everyone's elo from before this game. Computing them inside the loop would let earlier
    // players' updates leak into later players' averages, making results depend on roster order.
    const teamRedElo = game.getTeamElo(game.teamRed);
    const teamBlueElo = game.getTeamElo(game.teamBlue);

    // Win/Loss stats + elo
    for (const player of game.players) {
        const participant = game.getParticipant(player.id);
        if (!participant?.ranked) {
            continue;
        }

        const isRed = participant.team == "Red";
        const team = isRed ? game.teamRed : game.teamBlue;
        const opponent = isRed ? game.teamBlue : game.teamRed;
        const teamElo = isRed ? teamRedElo : teamBlueElo;
        const opponentElo = isRed ? teamBlueElo : teamRedElo;
        const eloDelta = player.getEloChange(teamElo, opponentElo, opponent.score, team.hasWon, game.termId);

        const stats = player.getStats(game.termId);
        const agentStats = stats.getAgentStats(stats.agentId);

        stats.elo += eloDelta;
        eloChange.set(player.id, eloDelta);
        if (team.hasWon) {
            stats.wins += 1;
            agentStats.wins += 1;
        } else {
            stats.losses += 1;
            agentStats.losses += 1;
        }

        await player.saveStats();
        modifiedPlayers.set(player.id, player);
    }

    return eloChange;
}
