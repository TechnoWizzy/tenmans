import {type ChatInputCommandInteraction, Guild, type SlashCommandBuilder} from "discord.js";

export type CommandExecutor = (interaction: ChatInputCommandInteraction, guild: Guild) => Promise<void>;

export class Command {
    public name:        string;
    public restricted:  boolean;
    public builder:     SlashCommandBuilder;
    public execute:     CommandExecutor;

    constructor(restricted: boolean, builder: any, execute: CommandExecutor) {
        this.name = builder.name;
        this.restricted = restricted;
        this.builder = builder;
        this.execute = execute;
    }
}