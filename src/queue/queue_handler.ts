import {
    type ButtonInteraction,
    type ChatInputCommandInteraction,
    type Client,
    Colors,
    type SendableChannels,
    type User
} from "discord.js";
import {Queue} from "./queue.ts";
import {Settings} from "../settings/settings.ts";

/**
 * A handler for managing a Queue instance within a Discord environment. This class is responsible for
 * handling the queue's lifecycle, updates, and user interactions like joining or leaving the queue.
 */
export class QueueHandler {
    private static queue: Queue;

    /**
     * Loads the queue by fetching the necessary settings, channels, and initializing the queue instance. This function
     * should only be called once when the application first loads.
     *
     * @param {Client} client - The Discord client instance used to fetch channels and other data - the Discord Bot Client
     * @param {String} message - The message to load the queue with
     * @return {Promise<void>} Resolves after the queue is successfully initialized and updated.
     * @throws {Error} If the general or mod channel is not text-based or cannot be fetched.
     */
    public static async loadQueue(client: Client, message: string): Promise<void> {
        const settings = await Settings.fetchSettings();
        const channel = await client.channels.fetch(settings.channels.general);
        const modChannel = await client.channels.fetch(settings.channels.admin);

        if (!channel?.isSendable()) {
            throw new Error("General channel is not text based");
        }
        if (!modChannel?.isSendable()) {
            throw new Error("Mod channel is not text based");
        }

        const messages = await channel.messages.fetch({ limit: 10 });
        let lastMessage = messages.find(message => {
            if (message.author.id != client.user?.id) {
                return false
            }
            return message.embeds.at(0)?.title?.includes(Queue.name);
        });

        QueueHandler.queue = new Queue(channel, modChannel, lastMessage)
        await QueueHandler.queue.update(message, Colors.White, false, new Date());
        await QueueHandler.queue.createCollector();

    }

    /**
     * Retrieves the current queue channel.
     *
     * @return {Object} The channel associated with the queue.
     */
    public static getChannel(): SendableChannels {
        return this.queue.getChannel();
    }

    /**
     * Retrieves the current queue mod channel.
     *
     * @return {Object} The mod channel associated with the queue.
     */
    public static getModChannel(): SendableChannels {
        return this.queue.getModChannel();
    }

    /**
     * Handles the process of a user joining a queue through an interaction.
     *
     * @param {User} user - The user who is attempting to join the queue.
     * @param {ButtonInteraction | ChatInputCommandInteraction} interaction - The interaction instance triggering the
     * join action.
     * @return {Promise<void>} A promise indicating the completion of the join operation.
     */
    public static async join(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction): Promise<void> {
        await QueueHandler.queue.join(user, interaction);
    }

    /**
     * Allows a user to leave the queue.
     *
     * @param {User} user - The user who wants to leave the queue.
     * @param {ButtonInteraction | ChatInputCommandInteraction} interaction - The interaction that triggered the leave
     * action.
     * @param {boolean} [ban=false] - Whether the user is leaving because they were banned from the queue.
     * @return {Promise<void>} A promise that resolves when the action is completed.
     */
    public static async leave(user: User, interaction: ButtonInteraction | ChatInputCommandInteraction, ban: boolean = false): Promise<void> {
        await QueueHandler.queue.leave(user, interaction, ban);
    }

    public static async refresh(interaction: ButtonInteraction): Promise<void> {
        await this.queue.refresh(interaction);
    }
}