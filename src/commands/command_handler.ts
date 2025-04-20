import type {Client} from "discord.js";
import RegisterCommand from "./register.ts";
import LeaderboardCommand from "./leaderboard.ts";
import TenmansCommand from "./tenmans.ts";
import TestCommand from "./test.ts";

export default class CommandHandler {
    private static commands = [
        new RegisterCommand(),
        new LeaderboardCommand(),
        new TenmansCommand(),
        new TestCommand()
    ]

    public static async registerCommands(client: Client) {
        await client.application?.commands.set(CommandHandler.commands.map(command => command.builder.toJSON()));
    }

    public static get(name: string) {
        return CommandHandler.commands.find(command => command.name == name);
    }
}