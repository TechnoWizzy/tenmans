import {
    Partials,
    GatewayIntentBits,
    type MessageMentionTypes,
    type Interaction,
    type InteractionEditReplyOptions,
    type MessageCreateOptions, type EmbedBuilder, type ActionRowBuilder, type ComponentBuilder, type AnyComponentBuilder
} from "discord.js";

export const BOT_OPTIONS = {
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message
    ],
    allowedMentions: {
        parse: [ "users" ] as MessageMentionTypes[]
    }
};

export function getEnv(key: string) {
    const value = process.env[key];
    if (!value) throw new Error(`env ${key} not found`);
    return value;
}

type ReplyOptions = { content?: string, embeds?: EmbedBuilder[], components?: ActionRowBuilder<any>[] }

export async function ephemeralReply(interaction: Interaction, options: ReplyOptions) {
    if (interaction.isRepliable()) {
        if (interaction.deferred) {
            await interaction.editReply(options);
        } else {
            await interaction.reply({ ...options, flags: 'Ephemeral' });
        }

    } else {
        throw new Error("Interaction is not repliable");
    }
}

export async function reply(interaction: Interaction, options: MessageCreateOptions) {
    if (!interaction.isRepliable()) {
        throw new Error("Interaction is not repliable");
    } else {
        await interaction.deleteReply();
        const channel = interaction.channel;

        if (!channel?.isSendable()) {
            throw new Error("Interaction channel is not sendable1")
        } else {
            if (interaction.isChatInputCommand()) {
                const content = `<@${interaction.user.id}> </${interaction.commandName}:${interaction.commandId}>\n` + (options.content ?? "");
                await channel?.send({ ...options, content: content + (options.content ?? "") });
            } else {
                await channel?.send(options);
            }
        }
    }
}

export async function noReply(interaction: Interaction) {
    if (interaction.isRepliable()) {
        if (interaction.replied) {
            await interaction.deleteReply();
        }
    } else {
        throw new Error("Interaction is not repliable");
    }
}

export function createCustomId(...args: any[]) {
    return args.join(",");
}