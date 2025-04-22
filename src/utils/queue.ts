import type {ButtonInteraction} from "discord.js";
import QueueHandler from "../queue/queue_handler.ts";
import {ephemeralReply} from "./utils.ts";

export async function handleQueueAction(action: QueueAction, interaction: ButtonInteraction) {
    switch (action) {
        case "join": {
            await ephemeralReply(interaction, { content: "The beta queue is currently disabled!"});
            return;
            await QueueHandler.join(interaction.user, interaction);
        } break;

        case "leave": {
            await QueueHandler.leave(interaction.user, interaction);
        } break;
    }
}