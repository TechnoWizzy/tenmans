import {type ButtonInteraction, type Client, Colors, type User} from "discord.js";
import Queue from "./queue.ts";
import Settings from "../settings/settings.ts";

export default class QueueHandler {
    private static queue: Queue;

    public static async loadQueue(client: Client) {
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
        const lastMessage = messages.find(message => {
            if (message.author.id != client.user?.id) {
                return false
            }
            return !message.embeds.at(0)?.title?.includes(QueueHandler.queue.name);
        });

        QueueHandler.queue = new Queue(channel, modChannel, lastMessage)
        await QueueHandler.queue.update("The bot has been updated - A new queue has started", Colors.White)
    }

    public static getChannel() {
        return this.queue.getChannel();
    }

    public static getModChannel() {
        return this.queue.getModChannel();
    }

    public static async join(user: User, interaction: ButtonInteraction) {
        await QueueHandler.queue.join(user, interaction);
    }

    public static async leave(user: User, interaction: ButtonInteraction) {
        await QueueHandler.queue.leave(user, interaction);
    }
}