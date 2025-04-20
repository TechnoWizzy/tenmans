import {
    MessageCollector,
    ButtonStyle,
    ButtonInteraction,
    Colors,
    EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    type Message,
    type SendableChannels,
    type User,
    type ColorResolvable, type ChatInputCommandInteraction,
} from "discord.js";
import {createCustomId, ephemeralReply} from "../utils/utils.ts";
import Game from "../models/game.ts";
import Database from "../database/database.ts";
import Player from "../models/player.ts";

export default class Queue extends Map<string, [User, Timer]> {
    public static readonly name = "Val 10mans BETA"
    public readonly maxSize = 10;
    public readonly timeout = 1000 * 60 * 30;

    private readonly channel: SendableChannels;
    private readonly modChannel: SendableChannels;
    private lastMessage?: Message;
    private collector?: MessageCollector;

    public constructor(channel: SendableChannels, modChannel: SendableChannels, lastMessage?: Message) {
        super();
        this.channel = channel;
        this.modChannel = modChannel;
        this.lastMessage = lastMessage;
    }

    public get users() {
        const tuples = Array.from(this.values())
        return (tuples.map(tuple => tuple[0]));
    }

    public getChannel() {
        return this.channel;
    }

    public getModChannel() {
        return this.modChannel;
    }

    public async join(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction) {
        const player = await Player.fetch(user.id)

        if (!player) {
            const commands = await interaction.client.application.commands.fetch();
            const command = commands.find(command => command.name == "register");
            await ephemeralReply(interaction, { content: `Please register using </register:${command?.id}> to join the queue.` });
            return;
        }

        if (this.has(user.id)) {
            await ephemeralReply(interaction, { content: "You are already in the queue!" });
            return;
        }

        const games = await Game.fetchAll();
        for (const game of games) {
            if (game.cancelled) {
                continue;
            }
            if (game.teamRed.hasWon || game.teamBlue.hasWon) {
                continue;
            }
            if (game.players.some(player => player.id == user.id)) {
                await ephemeralReply(interaction, { content: "You cannot join the queue while in a game." });
                return;
            }
        }

        if (this.size == this.maxSize) {
            await ephemeralReply(interaction, { content: "Sorry, the queue is full!" });
            return;
        }

        const timeout = global.setTimeout(async () => {
            const tuple = this.get(user.id)

            if (!tuple) {
                return;
            }

            this.delete(user.id);
            await this.update(`${user.username} has been timed out.`);
            await this.channel.send({ content: `<@${user.id}> You have been timed out of the queue` }).then(message => {
                setTimeout(() => {
                    message.delete().catch(console.error);
                }, 15 * 60 * 1000);
            });
        }, this.timeout);

        this.set(user.id, [ user, timeout ]);

        if (this.size == this.maxSize) {
            await this.update(`${user.username} has joined - THE QUEUE HAS POPPED!`, Colors.Gold, true);
            for (const [_, timeout] of this.values()) {
                global.clearTimeout(timeout);
            }

            const players = await Promise.all(this.users.map(async (user) => {
                const player = await Player.fetch(user.id);
                if (!player) {
                    throw new Error(`Player Not Found: ${user.id}`);
                }
                player.stats.acs = 0;
                return player;
            }));

            const gameId = await Database.games.countDocuments();
            const game = await new Game(gameId, players).save();
            const embed = game.createEmbed();
            const components = game.createComponents();
            await this.modChannel.send({ content: `Game ${gameId} has started.`, embeds: [ embed ], components: [ components ] });

            this.clear();
            await this.update(`A new queue has started`);
        }
    }

    public async leave(user: User, interaction: ButtonInteraction) {
        const tuple = this.get(user.id);

        if (!tuple) {
            await ephemeralReply(interaction, { content: "You are not in the queue." });
            return;
        }

        const timeout = tuple[1];
        global.clearTimeout(timeout);

        this.delete(user.id);
        await this.update(`${user.username} has left`, Colors.DarkOrange);
        await ephemeralReply(interaction, { content: "You have left the queue" });
    }

    public async update(title: string, color?: ColorResolvable, reset: boolean = false, time?: Date) {
        const embed = this.createEmbed(title, color, time);
        const component = this.createComponents();

        if (reset) {
            if (this.collector && !this.collector.ended) {
                this.collector.stop("update");
            }
            const content = this.users.map(user => `<@${user.id}>`).join('');
            await this.channel.send({ content: content, embeds: [ embed ] });
            await this.deleteLastMessage();
            return;
        }

        if (!this.lastMessage) {
            this.lastMessage = await this.channel.send({ embeds: [ embed ], components: [ component ]});
            await this.createCollector();
            return
        }

        await this.lastMessage.edit({ embeds: [ embed ], components: [ component ] });
    }

    public async createCollector() {
        if (!this.lastMessage) {
            return
        }

        this.collector = new MessageCollector(this.channel, { max: 10 })
            .on("end", async (_, reason) => {
                if (reason == "update") {
                    return
                }

                const title = this.lastMessage?.embeds[0]?.title;
                const color = this.lastMessage?.embeds[0]?.color ?? Colors.Purple;
                const match = title?.match(/^.*?: (.*?) \[\d+\/\d+]$/);
                const message = match ? match[1] : "Unknown Previous Title";
                setTimeout(async () => {
                    await this.update(message, color);
                }, 1000);
            });
    }

    public async deleteLastMessage() {
        if (!this.lastMessage) {
            return;
        }
        try {
            await this.lastMessage.delete();
        } catch (_) {

        }
        delete this.lastMessage;
    }

    private createEmbed(title: string, color: ColorResolvable = "#424549", time: Date = new Date()) {
        const builder = new EmbedBuilder();
        const users = this.users;
        if (users.length > 0) {
            builder.setDescription(users.map((user, index) => `**${index + 1}.** ${user.username}`).join('\n'));
        }
        if (this.maxSize > 1) {
            builder.setTitle(`${Queue.name}: ${title}`.concat(` [${users.length}/${this.maxSize}]`));
        } else {
            builder.setTitle(`${Queue.name}: ${title}`);
        }

        builder.setColor(color);
        builder.setTimestamp(time);
        return builder
    }

    private createComponents() {
        return new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder().setLabel("Join").setCustomId(createCustomId("queue", "join")).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setLabel("Leave").setCustomId(createCustomId("queue", "leave")).setStyle(ButtonStyle.Danger),
        )
    }
}