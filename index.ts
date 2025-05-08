import {Client, EmbedBuilder, Events, type Interaction, TextChannel} from "discord.js";
import {BOT_OPTIONS, ephemeralReply, getEnv} from "./src/utils/utils.ts";
import {confirmRegistration, confirmReregistration} from "./src/utils/register.ts";
import {handleLeaderboardAction} from "./src/utils/leaderboard.ts";
import {handleGameAction} from "./src/utils/game.ts";
import {handleQueueAction} from "./src/utils/queue.ts";
import util from "node:util";
import process from "process";
import Express from "express";
import {Database} from "./src/database/database.ts";
import {CommandHandler} from "./src/commands/command_handler.ts";
import {QueueHandler} from "./src/queue/queue_handler.ts";
import {Settings} from "./src/settings/settings.ts";
import {Game} from "./src/models/game.ts";
import {TermManager} from "./src/utils/term.ts";

Express()
    .use('/', Express.static('docs'))
    .listen(3000)

Database.connect().then(() => {
    const client = new Client(BOT_OPTIONS)
    client.on(Events.ClientReady, ready);
    client.on(Events.InteractionCreate, interactionCreate);
    client.login(getEnv("DISCORD_TOKEN")).catch(console.log);
});

async function ready(client: Client) {
    const settings = await Settings.fetchSettings();
    try {
        await TermManager.loadTerms();
        await CommandHandler.registerCommands(client);
        await QueueHandler.loadQueue(client);
        client.user?.setActivity(settings.status)
        console.log("TenMans is ready at " + client.readyAt?.toISOString());
        console.log(`Current Term: ${TermManager.currentTerm.Name}`);
    } catch (e: unknown) {
        const channel = await client.channels.fetch(settings.channels.log) as TextChannel;
        const embed = new ErrorEmbed(e as Error, "Ready Error");
        await channel.send({ embeds: [ embed ] });
    }
}

async function interactionCreate(interaction: Interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const settings = await Settings.fetchSettings();

    if (!interaction.member) throw new Error("Missing Interaction Member");
    if (!channel) throw new Error("Missing Interaction Channel");
    if (!guild) throw new Error("Missing Interaction Guild");

    try {
        const member = await guild.members.fetch(interaction.member.user.id);
        const adminRoleIds = settings.roles.admins;
        const isAdmin = member.roles.cache.some(role => adminRoleIds.some(roleId => role.id == roleId));

        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ flags: 'Ephemeral' });
            const args = interaction.customId.split(',');

            switch (args[0]) {
                case "game": {
                    const gameId = args[1];
                    const game = await Game.fetch(Number(gameId));
                    const action = args[2] as GameAction;
                    await handleGameAction(interaction, game, action);
                    break
                }
                default: {
                    await ephemeralReply(interaction, {content: `Unknown modal submit: ${args[0]}`});
                }
            }
            return;
        }

        if (interaction.isChatInputCommand()) {
            await interaction.deferReply({ flags: 'Ephemeral' });
            const guild = interaction.guild;
            const command = CommandHandler.fetch(interaction.commandName);
            if (!command) {
                await ephemeralReply(interaction, { content: `Command does not exist: ${interaction.commandName}` });
                return;
            }

            if (command.restricted && !isAdmin) {
                await ephemeralReply(interaction, { content: "You don't have permission to use this command." });
                return;
            }

            await command.execute(interaction, guild);
        }

        if (interaction.isButton()) {
            const args = interaction.customId.split(',');

            switch (args[0]) {
                case "game": {
                    const gameId = args[1];
                    const game = await Game.fetch(Number(gameId));
                    const action = args[2] as GameAction;
                    await handleGameAction(interaction, game, action)
                    break;
                }

                case "queue": {
                    await interaction.deferReply({ flags: 'Ephemeral' });
                    const action = args[1] as QueueAction;
                    await handleQueueAction(action, interaction);
                    break;
                }

                case "register": {
                    await interaction.deferReply({ flags: 'Ephemeral' });
                    const userId = args[1];
                    const username = args[2];
                    const date = args[3];
                    const then = new Date(Number(date));
                    if (Date.now() - then.getTime() > (30 * 1000)) {
                        await ephemeralReply(interaction, { content: "This button has expired. Please try registering again.." });
                        return;
                    }
                    await confirmRegistration(interaction, userId, username);
                    break;
                }

                case "re-register": {
                    await interaction.deferReply({ flags: 'Ephemeral' });
                    const userId = args[1];
                    const username = args[2];
                    const date = args[3];
                    const then = new Date(Number(date));
                    if (Date.now() - then.getTime() > (30 * 1000)) {
                        await ephemeralReply(interaction, { content: "This button has expired. Please try registering again.." });
                        return;
                    }
                    await confirmReregistration(interaction, userId, username);
                    break;
                }

                case "leaderboard": {
                    const action = args[1] as LeaderboardAction;
                    const page = Number.parseInt(args[2]);
                    await handleLeaderboardAction(interaction, action, page);
                    break;
                }
            }
        }

    } catch (e: unknown) {
        const channel = await interaction.client.channels.fetch(settings.channels.log) as TextChannel;
        const embed = new ErrorEmbed(e as Error, "Interaction Error");
        await channel.send({ embeds: [ embed ] });
        try {
            const error = e as Error;
            await ephemeralReply(interaction, { content: "Sorry, there was an error performing this operation. " + error.name });
        } catch {
            console.error(e);
        }
    }
}

class ErrorEmbed extends EmbedBuilder {
    constructor(err: Error, title: string) {
        super()
        this.setColor("#424549")
        this.setTitle(title);
        this.setDescription(util.inspect(err));
        this.setFooter({ text: "Error Log" });
    }
}

console.log(`Tenmans: ${process.pid}`);