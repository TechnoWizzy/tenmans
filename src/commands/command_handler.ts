import type {Client} from "discord.js";
import {RegisterCommand} from "./register.ts";
import {LeaderboardCommand} from "./leaderboard.ts";
import {AdminCommand} from "./admin.ts";
import {TestCommand} from "./test.ts";
import {HelpCommand} from "./help.ts";

export class CommandHandler {
    private static readonly commands = [
        new AdminCommand(),
        new RegisterCommand(),
        new LeaderboardCommand(),
        new TestCommand(),
        new HelpCommand()
    ]

    public static async registerCommands(client: Client) {
        await client.application?.commands.set(CommandHandler.commands.map((command) => {
            if (command.name == "help") {
                command.builder.addStringOption((string) => string
                    .setName("command")
                    .setDescription("view specific command info")
                    .setChoices(CommandHandler.commands
                        .filter(cmd => cmd.name != "help")
                        .map(cmd => ({ name: cmd.name, value: cmd.name })))
                    .setRequired(false)
                );
            }
            return command.builder.toJSON();
        }));
        console.log(`Registered ${CommandHandler.commands.length} commands`);
    }

    public static fetch(name: string) {
        return CommandHandler.commands.find(command => command.name == name);
    }
}