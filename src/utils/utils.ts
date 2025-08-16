import {
    Partials,
    GatewayIntentBits,
    type MessageMentionTypes,
    type Interaction,
    type InteractionEditReplyOptions,
    type MessageCreateOptions,
    type EmbedBuilder,
    type ActionRowBuilder,
    type ComponentBuilder,
    type AnyComponentBuilder,
    type MessageMentionOptions
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

export type ReplyOptions = { content?: string, embeds?: EmbedBuilder[], components?: ActionRowBuilder<any>[], allowedMentions?: MessageMentionOptions }

export async function ephemeralReply(interaction: Interaction, options: ReplyOptions) {
    if (interaction.isRepliable()) {
        if (interaction.deferred) {
            try {
                await interaction.followUp({
                    ...options,
                    allowedMentions: {
                        repliedUser: true,
                        parse: [ 'roles', 'users', 'everyone' ],
                    },
                    flags: 'Ephemeral' }
                );
            } catch (e) {
                console.log(e);
                await interaction.editReply(options);
            }

        } else {
            await interaction.reply({
                ...options,
                allowedMentions: {
                    repliedUser: true,
                    parse: [ 'roles', 'users', 'everyone' ],
                },
                flags: 'Ephemeral' }
            );
        }

    } else {
        throw new Error("Interaction is not repliable");
    }
}

export async function reply(interaction: Interaction, options: ReplyOptions, lifetime: number = 0) {
    if (!interaction.isRepliable()) {
        throw new Error("Interaction is not repliable");
    } else {
        await interaction.deleteReply();
        const channel = interaction.channel;

        if (!channel?.isSendable()) {
            throw new Error("Interaction channel is not sendable1")
        } else {
            let message;
            if (interaction.isChatInputCommand()) {
                const content = `<@${interaction.user.id}> </${interaction.commandName}:${interaction.commandId}>\n` + (options.content ?? "");
                message = await channel?.send({ ...options, content: content });
            } else {
                message = await channel?.send(options);
            }
            if (lifetime > 0) {
                setTimeout(async () => {
                    try {
                        await message.delete();
                    } catch {}
                }, lifetime)
            }
        }
    }
}

export async function noReply(interaction: Interaction) {
    if (interaction.isRepliable()) {
        try {
            await interaction.deleteReply();
        } catch {
            if (interaction.isButton()) {
                try {
                    await interaction.deferUpdate()
                } catch {}
            }
        }
    } else {
        throw new Error("Interaction is not repliable");
    }
}

export function createCustomId(...args: any[]) {
    return args.join(",");
}

export function calculateDate(duration: string) {
    const now = new Date();
    switch (duration) {
        case "hour": {
            now.setHours(now.getHours() + 1);
            break;
        }
        case "day": {
            now.setDate(now.getDate() + 1);
            break;
        }
        case "month": {
            now.setMonth(now.getMonth() + 1);
            break;
        }
        case "year": {
            now.setFullYear(now.getFullYear() + 1);
            break;
        }
        case "forever": {
            now.setFullYear(9999);
            break;
        }
        default: {

        }
    }
    return now;
}

export function formatDate(date: Date) {
    const seconds = Math.floor(date.getTime() / 1000)
    return `<t:${seconds}:R>`;
}

export function removeFormatChars(value: string) {
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

