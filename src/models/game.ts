import Database from "../database/database.ts";
import Player from "./player.ts";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {createCustomId} from "../utils/utils.ts";


export default class Game {
    public readonly id: number;
    public teamRed: Team;
    public teamBlue: Team;
    public players: Player[];
    public cancelled: boolean;

    public constructor(id: number, players: Player[], teamRed?: Team, teamBlue?: Team, cancelled: boolean = false) {
        this.id = id;
        this.teamRed = teamRed ?? new Team("Red", 0, false, []);
        this.teamBlue = teamBlue ?? new Team("Blue", 0, false, []);
        this.players = players;
        this.cancelled = cancelled
    }

    public async save() {
        const query = { id: this.id };
        const update = { $set: this };
        const options = { upsert: true };
        const result = await Database.games.updateOne(query, update, options);
        if (!result.acknowledged) throw new Error(`Unable to save game: ${this.id}`);
        return this;
    }

    public createEmbed() {
        const builder = new EmbedBuilder();
        if (this.cancelled) {
            builder.setTitle(`Game ${this.id} - Cancelled`);
        } else {
            builder.setTitle(`Game ${this.id}`);
        }

        if (this.teamRed && this.teamBlue) {
            const teamRedText = this.teamRed.players
                .map(player => {
                    const acs = player.stats.acs;
                    const teamElo = this.teamRed.getAverageElo();
                    const opponentElo = this.teamBlue.getAverageElo();
                    const opponentScore = this.teamBlue.score;
                    const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, this.teamRed.hasWon);
                    const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
                    const emote = `<:test:${player.getEmote()}>`;
                    return `${emote}: **${player.username}** - ${player.stats.elo} ${eloDeltaString} elo - ${acs} acs`;
                })
                .join('\n');

            const teamBlueText = this.teamBlue.players
                .map(player => {
                    const acs = player.stats.acs;
                    const teamElo = this.teamBlue.getAverageElo();
                    const opponentElo = this.teamRed.getAverageElo();
                    const opponentScore = this.teamRed.score;
                    const eloDelta = player.getEloChange(teamElo, opponentElo, opponentScore, this.teamBlue.hasWon);
                    const eloDeltaString = `(${eloDelta > 0 ? "+" : ""}${eloDelta})`;
                    const emote = `<:test:${player.getEmote()}>`;
                    return `${emote}: **${player.username}** - ${player.stats.elo} ${eloDeltaString} elo - ${acs} acs`;
                })
                .join('\n');

            builder.setDescription(`Team Red: **${this.teamRed.score}**\n${teamRedText}\n\nTeam Blue: **${this.teamBlue.score}**\n${teamBlueText}`)

            if (this.teamRed.hasWon) {
                builder.setColor(Colors.Red)
            } else if (this.teamBlue.hasWon) {
                builder.setColor(Colors.Blue)
            }
        } else {
            const playerText = this.players
                .map(player => {
                    const emote = `<:test:${player.getEmote()}>`;
                    return `${emote}: **${player.username}** - ${player.stats.elo} elo`;
                })
                .join('\n');


            builder.setDescription(playerText);
        }

        return builder;
    }

    public createComponents() {
        return new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel("Set Match URL")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(createCustomId("game", this.id, "set-url")),
            new ButtonBuilder()
                .setLabel("Cancel Game")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(createCustomId("game", this.id, "cancel"))
                .setDisabled(this.cancelled)
        )
    }

    public createModal() {
        return new ModalBuilder().setTitle(`Game ${this.id}`).setCustomId(createCustomId("game", this.id, "set-url")).setComponents(
            new ActionRowBuilder<TextInputBuilder>().setComponents(
                new TextInputBuilder()
                    .setCustomId(createCustomId("url"))
                    .setLabel("Match URL")
                    .setStyle(TextInputStyle.Short)
            )
        )
    }

    public static async fetch(id: number) {
        const query = { id: id };
        const game = await Database.games.findOne(query);
        if (!game) throw new Error(`Player Not Found: ${id}`);
        const players = game.players.map(player => new Player(player.id, player.username, player.stats));
        const teamRed = new Team(game.teamRed.name, game.teamRed.score, game.teamRed.hasWon, game.teamRed.players);
        const teamBlue = new Team(game.teamBlue.name, game.teamBlue.score, game.teamBlue.hasWon, game.teamBlue.players);
        return new Game(game.id, players, teamRed, teamBlue, game.cancelled);
    }

    public static async fetchAll() {
        const games = await Database.games.find().toArray();
        return games.map(game => {
            const players = game.players.map(player => new Player(player.id, player.username, player.stats));
            const teamRed = new Team(game.teamRed.name, game.teamRed.score, game.teamRed.hasWon, game.teamRed.players);
            const teamBlue = new Team(game.teamBlue.name, game.teamBlue.score, game.teamBlue.hasWon, game.teamBlue.players);
            return new Game(game.id, players, teamRed, teamBlue, game.cancelled);
        });
    }

    public async fetchAllAfter() {
        const query = { id: { $gt: this.id } };
        const games = await Database.games.find(query).toArray();
        return games.map(game => {
            const players = game.players.map(player => new Player(player.id, player.username, player.stats));
            const teamRed = new Team(game.teamRed.name, game.teamRed.score, game.teamRed.hasWon, game.teamRed.players);
            const teamBlue = new Team(game.teamBlue.name, game.teamBlue.score, game.teamBlue.hasWon, game.teamBlue.players);
            return new Game(game.id, players, teamRed, teamBlue, game.cancelled);
        }).sort((a, b) => a.id - b.id);
    }
}

export class Team {
    public name: string;
    public score: number;
    public hasWon: boolean;
    public players: Player[];

    public constructor(name: string, score: number, hasWon: boolean, players: Player[]) {
        this.name = name;
        this.score = score;
        this.hasWon = hasWon;
        this.players = players;
    }

    public getAverageElo() {
        return this.players
            .map(player => player.stats.elo)
            .reduce((a, b) => a + b) / this.players.length;
    }
}