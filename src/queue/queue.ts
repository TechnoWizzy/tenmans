import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    type ChatInputCommandInteraction,
    type ColorResolvable,
    Colors,
    EmbedBuilder,
    type Message,
    MessageCollector,
    type SendableChannels,
    type User,
} from "discord.js";
import {createCustomId, ephemeralReply, getEnv, noReply, removeFormatChars} from "../utils/utils.ts";
import {Game} from "../models/game.ts";
import {Database} from "../database/database.ts";
import {Player} from "../models/player.ts";
import {TermManager} from "../utils/term.ts";

/**
 * The `Queue` class extends the JavaScript `Map` object and represents a custom queue system
 * for managing game participants. This class is the heart of the tenmans bot. Features include user timeout
 * handling, personalized interactions, maximum participant limits, and integration with game systems.
 *
 * Fields:
 * - `name`: Represents the name of the queue system (static value).
 * - `maxSize`: The maximum number of participants the queue can hold.
 * - `timeout`: The timeout duration (in milliseconds) after which a user will be automatically removed from the queue.
 */
export class Queue extends Map<string, [User, Timer]> {
    public static readonly name = "Val 10mans 2.0"
    public readonly maxSize = 10;
    public readonly timeout = (15 * 60 * 1000) - 10000;

    private readonly promptTimeouts = new Map<string, Timer>;
    private readonly channel: SendableChannels;
    private readonly modChannel: SendableChannels;
    private lastMessage?: Message;
    private collector?: MessageCollector;

    /**
     * Constructs a new instance of the Queue.
     *
     * @param {SendableChannels} channel - The main channel for sending messages.
     * @param {SendableChannels} modChannel - The moderation channel for administrative purposes.
     * @param {Message} [lastMessage] - The last message sent, if available.
     */
    public constructor(channel: SendableChannels, modChannel: SendableChannels, lastMessage?: Message) {
        super();
        this.channel = channel;
        this.modChannel = modChannel;
        this.lastMessage = lastMessage;
    }

    /**
     * Retrieves an array of Discord user objects from the stored tuple values.
     *
     * @return {Array<User>} An array containing the first element of each tuple, representing user objects.
     */
    public get users(): User[] {
        const tuples = Array.from(this.values())
        return (tuples.map(tuple => tuple[0]));
    }

    /**
     * Retrieves the queue channel.
     *
     * @return {SendableChannels} The text channel associated with the Queue.
     */
    public getChannel(): SendableChannels {
        return this.channel;
    }

    /**
     * Retrieves the moderator queue channel.
     *
     * @return {SendableChannels} The text channel associated with Queue moderation.
     */
    public getModChannel(): SendableChannels {
        return this.modChannel;
    }

    /**
     * Allows a user to join a queue through a specified interaction. Validates the user's eligibility
     * and handles various conditions such as registration, ongoing bans, and active games to determine
     * if the user can successfully join the queue.
     *
     * @param {User} user - The user attempting to join the queue.
     * @param {ButtonInteraction | ChatInputCommandInteraction} interaction - The interaction through which the user is
     * joining.
     * @return {Promise<void>} Resolves when the user has successfully joined the queue or if another condition prevents
     * them from joining.
     */
    public async join(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction): Promise<void> {
        if (interaction.isButton()) {
            if (interaction.message.id != this.lastMessage?.id) {
                await ephemeralReply(interaction, { content: "This message is no longer active." });
                try {
                    await interaction.message.delete();
                } catch {}
                return;
            }
        }

        const player = await Player.fetch(user.id);

        if (!player) {
            const commands = await interaction.client.application.commands.fetch();
            const command = commands.find(command => command.name == "register");
            await ephemeralReply(interaction, { content: `Please register using </register:${command?.id}> to join the queue.` });
            return;
        }

        const stats = player?.getStats(TermManager.currentTerm.Id);

        /*
        if (stats.timeout.getTime() > Date.now()) {
            const timeout = Math.floor(stats?.timeout.getTime() / 1000);
            const time = `<t:${timeout}:R>`
            const message = `A game you participated in has been recently cancelled. You may rejoin the queue ${time}`;
            await ephemeralReply(interaction, { content: message });
            return;
        }
        */

        const tuple = this.get(user.id);

        if (tuple) {
            const timeout = tuple[1];
            global.clearTimeout(timeout);

            const promptTimeout = this.promptTimeouts.get(user.id);
            if (promptTimeout) {
                global.clearTimeout(promptTimeout);
            }

            this.set(user.id, [ user, this.createTimeout(user, interaction) ]);

            await ephemeralReply(interaction, { content: "Your queue status has been renewed." });
            return;
        }

        /*
        if (player.stats.bannedUntil.getTime() > Date.now()) {
            const date = formatDate(player.stats.bannedUntil);
            await ephemeralReply(interaction, { content: `You will be unbanned from TenMans ${date}` });
            return
        }
         */

        const isInGame = await player.isInGame();
        if (isInGame) {
            await ephemeralReply(interaction, { content: "You cannot join the queue while in a game." });
            return;
        }

        if (this.size == this.maxSize) {
            await ephemeralReply(interaction, { content: "Sorry, the queue is full!" });
            return;
        }

        const timeout = this.createTimeout(user, interaction);
        this.set(user.id, [ user, timeout ]);

        if (this.size == this.maxSize) {
            const tuple = this.get(getEnv("SPECIAL"));
            if (tuple) {
                const user = tuple[0];
                const timer = tuple[1];
                clearTimeout(timer);
                this.delete(user.id);
            }
        }

        if (this.size == this.maxSize) {
            await this.update(`${removeFormatChars(user.username)} has joined - THE QUEUE HAS POPPED!`, Colors.Gold, true);
            for (const [_, timeout] of this.values()) {
                global.clearTimeout(timeout);
            }

            const players = await Promise.all(this.users.map(async (user) => {
                const player = await Player.fetch(user.id);
                if (!player) {
                    throw new Error(`Player Not Found: ${user.id}`);
                }
                player.getStats(TermManager.currentTerm.Id).acs = 0;
                return player;
            }));

            if (players.length != this.maxSize) {
                throw new Error("How?");
            }

            const gameId = await Database.games.countDocuments();
            const game = await new Game(gameId, TermManager.currentTerm.Id, players).save();
            const embed = game.createEmbed();
            const components = game.createComponents();
            await this.modChannel.send({ content: `Game ${gameId} has started.`, embeds: [ embed ], components: [ components ] });

            this.clear();
            await this.update(`A new queue has started`);
        } else {
            await this.update(`${removeFormatChars(user.username)} has joined`, Colors.DarkGreen);
        }

        if (interaction.isChatInputCommand()) return;
        await ephemeralReply(interaction, { content: "You have joined the queue" });
    }

    /**
     * Handles a user leaving the queue, optionally banning the user.
     *
     * @param {User} user - The user leaving the queue.
     * @param {ButtonInteraction | ChatInputCommandInteraction} interaction - The interaction that triggered this action.
     * @param {boolean} [ban=false] - Whether the user is leaving the queue because they were banned, defaults to false
     * @return {Promise<void>} Resolves when the leave operation is complete.
     */
    public async leave(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction, ban: boolean = false): Promise<void> {
        if (interaction.isButton()) {
            if (interaction.message.id != this.lastMessage?.id) {
                await ephemeralReply(interaction, { content: "This message is no longer active." });
                await interaction.message.delete();
                return;
            }
        }

        const tuple = this.get(user.id);

        if (!tuple) {
            await ephemeralReply(interaction, { content: "You are not in the queue." });
            return;
        }

        const timeout = tuple[1];
        global.clearTimeout(timeout);

        const promptTimeout = this.promptTimeouts.get(user.id);
        if (promptTimeout) {
            global.clearTimeout(promptTimeout);
        }

        this.delete(user.id);

        if (ban) {
            await this.update(`${removeFormatChars(user.username)} has been banned`, Colors.DarkButNotBlack);
        } else {
            await this.update(`${removeFormatChars(user.username)} has left`, Colors.DarkOrange);
            await ephemeralReply(interaction, { content: "You have left the queue" });
        }
    }

    public createTimeout(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction) {
        return global.setTimeout(async () => {
            const tuple = this.get(user.id)

            if (!tuple) {
                return;
            }

            await this.promptTimeout(user, interaction);
        }, this.timeout);
    }

    public async promptTimeout(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction): Promise<void> {
        try {
            const now = Date.now();
            const then = now + (5 * 60 * 1000) + 5000;
            const timestamp = `<t:${Math.floor(then / 1000)}:R>`
            await ephemeralReply(interaction, {
                content: `<@${user.id}> please rejoin the queue to confirm your activity status and avoid being timed out ${timestamp}`,
            });

            const timeout = setTimeout(async () => {
                this.delete(user.id);
                await this.update(`${removeFormatChars(user.username)} has been timed out.`);
                await ephemeralReply(interaction, { content: `<@${user.id}> You have been timed out of the queue for inactivity. `});
            }, then - now)
            this.promptTimeouts.set(user.id, timeout);

        } catch (e) {
            console.log(e);
            this.delete(user.id);
            await this.update(`${removeFormatChars(user.username)} has been timed out.`);
            await ephemeralReply(interaction, { content: `<@${user.id}> You have been timed out of the queue for inactivity. `});
        }
    }

    public async refresh(interaction: ButtonInteraction): Promise<void> {
        this.collector?.stop("refresh");
        await noReply(interaction);
    }

    /**
     * Updates the queue message or sends a new one based on the provided parameters.
     *
     * @param {string} title - The title to set on the embed.
     * @param {ColorResolvable} [color] - The color to set on the embed. It is optional.
     * @param {boolean} [reset=false] - If true, resets the interaction by sending a new message. Defaults to false.
     * @param {Date} [time] - Optional timestamp to include in the embed.
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    public async update(title: string, color?: ColorResolvable, reset: boolean = false, time?: Date): Promise<void> {
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
            delete this.collector;
            await this.createCollector();
            return
        }

        await this.lastMessage.edit({ embeds: [ embed ], components: [ component ] });
    }

    /**
     * Creates a MessageCollector instance to handle messages for a specific channel.
     * The collector fetches recent messages from the channel and listens for new ones up to a specified limit.
     * It performs specific cleanup and updates when the collection ends unless the reason for ending is "update". The
     * MessageCollector allows the queue to automatically resend its status message when a certain number of new
     * messages have been sent by other users.
     *
     * @return {Promise<void>} A promise that resolves when the collector setup and message collection handling are
     * complete.
     */
    public async createCollector(): Promise<void> {
        if (!this.lastMessage || this.collector) {
            return
        }

        const messages = await this.channel.messages.fetch({ after: this.lastMessage.id, limit: 10})
        this.collector = new MessageCollector(this.channel, { max: 10 })
            .on("end", async (_, reason) => {
                if (reason == "update") {
                    return;
                }

                const title = this.lastMessage?.embeds[0]?.title;
                const color = this.lastMessage?.embeds[0]?.color ?? Colors.Purple;
                const time = this.lastMessage?.embeds[0]?.timestamp ? new Date(this.lastMessage.embeds[0].timestamp) : new Date();
                const match = title?.match(/^.*?: (.*?) \[\d+\/\d+]$/);
                const message = match ? match[1] : "Unknown Previous Title";
                await this.deleteLastMessage();
                setTimeout(async () => {
                    await this.update(message, color, false, time);
                }, 1000);
            });

        for (const [_, message] of messages) {
            await this.collector.handleCollect(message)
        }
    }

    /**
     * Deletes the last status message if it exists.
     *
     * This method checks if a last message is present and attempts to delete it.
     * If the deletion is successful or no last message is found, it removes the reference to the last message.
     * In case of an error during deletion, it is silently caught and no action is taken.
     *
     * @return {Promise<void>} A promise that resolves when the last message is deleted or non-existent.
     */
    public async deleteLastMessage(): Promise<void> {
        if (!this.lastMessage) {
            return;
        }
        try {
            await this.lastMessage.delete();
        } catch (_) {

        }
        delete this.lastMessage;
    }

    /**
     * Creates and returns an EmbedBuilder with the specified title, color, and timestamp.
     * The embed will include a user list if there are any users in the queue.
     *
     * @param {string} title - The title to be displayed in the embed.
     * @param {ColorResolvable} [color="#424549"] - The color of the embed. Defaults to "#424549".
     * @param {Date} [time=new Date()] - The timestamp to be set for the embed. Defaults to the current date and time.
     * @return {EmbedBuilder} The constructed EmbedBuilder object containing the provided data.
     */
    private createEmbed(title: string, color: ColorResolvable = "#424549", time: Date = new Date()): EmbedBuilder {
        const builder = new EmbedBuilder();
        const users = this.users;
        if (users.length > 0) {
            builder.setDescription(users.map((user, index) => `**${index + 1}.** ${removeFormatChars(user.username)}`).join('\n'));
        }
        if (this.maxSize > 1) {
            builder.setTitle(`${Queue.name}: ${title}`.concat(` [${users.length}/${this.maxSize}]`));
        } else {
            builder.setTitle(`${Queue.name}: ${title}`);
        }

        const term = TermManager.currentTerm;
        builder.setAuthor({ name: term.Name });
        builder.setColor(color);
        builder.setTimestamp(time);
        return builder
    }

    /**
     * Creates and returns a set of components for user interaction, specifically buttons for "Join" and "Leave" actions.
     *
     * @return {ActionRowBuilder<ButtonBuilder>} An ActionRowBuilder instance containing button components for "Join"
     * and "Leave" actions.
     */
    private createComponents(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder().setLabel("Join").setCustomId(createCustomId("queue", "join")).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setLabel("Leave").setCustomId(createCustomId("queue", "leave")).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setEmoji("🔄").setCustomId(createCustomId("queue", "refresh")).setStyle(ButtonStyle.Secondary),
        )
    }
}