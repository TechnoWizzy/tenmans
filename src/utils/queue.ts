import type {ButtonInteraction} from "discord.js";
import {QueueHandler} from "../queue/queue_handler.ts";

export async function handleQueueAction(action: QueueAction, interaction: ButtonInteraction) {
    switch (action) {
        case "join": {
            await QueueHandler.join(interaction.user, interaction);
        } break;

        case "leave": {
            await QueueHandler.leave(interaction.user, interaction);
        } break;

        case "refresh": {
            await QueueHandler.refresh(interaction);
        }
    }
}