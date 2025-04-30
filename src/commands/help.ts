import {
    ApplicationCommand,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    Collection,
    EmbedBuilder, type Guild,
    SlashCommandBuilder
} from "discord.js";
import {ephemeralReply} from "../utils/utils.ts";
import {Command} from "./command.ts";

const builder = new SlashCommandBuilder()
    .setName("help")
    .setDescription("display command info")

async function execute(interaction: ChatInputCommandInteraction, guild: Guild) {
    const client = interaction.client;
    const filter = interaction.options.getString("command")?.toLowerCase() ?? "";

    const guildCommands = await guild.commands.fetch();
    const globalCommands = await client.application?.commands.fetch();

    const description = parseCommands(globalCommands, filter).concat("\n").concat(parseCommands(guildCommands, filter));
    const embed = new EmbedBuilder().setDescription(description).setTitle("Help Menu").setColor("#5a69ea");
    await ephemeralReply(interaction, { embeds: [ embed ] });
}

function parseCommands(commands: Collection<string,  ApplicationCommand>, filter: string) {
    return Array.from(commands.values())
        .filter(command => command.name.includes(filter) && command.name != "help")
        .sort((a, b) => {
            if (a.name > b.name) return  1;
            if (a.name < b.name) return -1;
            return 0;
        })
        .map(command => {
            const options = command.options.filter(option => {
                return (option.type == ApplicationCommandOptionType.SubcommandGroup || option.type == ApplicationCommandOptionType.Subcommand);
            });

            if (options.length < 1) {
                return `</${(command.name)}:${command.id}> - ${command.description}\n`;
            }

            return `**/${toTitleCase(command.name)}** - ${command.description}\n`.concat(options
                .map(option => {
                    if (option.type == ApplicationCommandOptionType.Subcommand) {
                        return `⠀⠀</${command.name} ${option.name}:${command.id}> - ${option.description}\n`
                    }
                    if (option.type == ApplicationCommandOptionType.SubcommandGroup) {
                        return option.options
                            ?.map(subcommand => {
                                return `⠀⠀</${command.name} ${option.name} ${subcommand.name}:${command.id}> - ${subcommand.description}\n`;
                            })
                            .join("")
                    }
                })
                .join("")
            );
        })
        .join("\n");
}

function toTitleCase(title: string) {
    return title.replace(/\w\S*/g, function(text: string) {
        return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
    });
}

export class HelpCommand extends Command {
    constructor() {
        super(false, builder, execute);
    }
}