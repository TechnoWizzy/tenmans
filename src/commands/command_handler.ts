import type {Client} from "discord.js";
import {RegisterCommand} from "./register.ts";
import {LeaderboardCommand} from "./leaderboard.ts";
import {AdminCommand} from "./admin.ts";
import {TestCommand} from "./test.ts";
import {HelpCommand} from "./help.ts";
import {PingCommand} from "./ping.ts";
import {WhoisCommand} from "./whois.ts";
import {TermManager} from "../utils/term.ts";
import {StatsCommand} from "./stats.ts";

export class CommandHandler {
    private static readonly commands = [
        new PingCommand(),
        new AdminCommand(),
        new RegisterCommand(),
        new LeaderboardCommand(),
        new TestCommand(),
        new HelpCommand(),
        new WhoisCommand(),
        new StatsCommand(),
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
            } else if (command.name == "leaderboard") {
                command.builder.addStringOption((string) => string
                    .setName("term")
                    .setDescription("Which term to use")
                    .setChoices(TermManager.getAllTerms()
                        .slice(-25)
                        .map(term => {
                            return { name: term.Name, value: term.Id }
                        }))
                    .setRequired(false)
                )
            }
            return command.builder.toJSON();
        }));
        console.log(`Registered ${CommandHandler.commands.length} commands`);
    }

    public static fetch(name: string) {
        return CommandHandler.commands.find(command => command.name == name);
    }
}