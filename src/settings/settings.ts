import type {ActivityType} from "discord.js";

export default class Settings {
    public guildId: string;
    public roles: RoleSettings;
    public status: StatusSettings;
    public channels: ChannelSettings;

    public constructor (settings: Settings) {
        if (settings.guildId == null) throw new Error("null guildId");
        if (settings.roles == null) throw new Error("null rolesSettings");
        if (settings.status == null) throw new Error("null statusSettings");
        if (settings.channels == null) throw new Error("null channelSettings");

        this.guildId = settings.guildId;
        this.roles = new RoleSettings(settings.roles);
        this.status = new StatusSettings(settings.status);
        this.channels = new ChannelSettings(settings.channels);
    }

    public static async fetchSettings() {
        const file = Bun.file("./settings.json");
        const json = await file.json()
        return new Settings(json);
    }
}

class ChannelSettings {
    public log: string
    public admin: string
    public general: string

    constructor(settings: ChannelSettings) {
        if (settings.log == null) throw new Error("null log channel");
        if (settings.admin == null) throw new Error("null log channel");
        if (settings.general == null) throw new Error("null log channel");

        this.log = settings.log;
        this.admin = settings.admin;
        this.general = settings.general;
    }
}

class StatusSettings {
    public name: string
    public type: ActivityType

    public constructor(settings: StatusSettings) {
        if (settings.name == null) throw new Error("null name status");
        if (settings.type == null) throw new Error("null type status");

        this.name = settings.name;
        this.type = settings.type;
    }
}

class RoleSettings {
    public admins: string[]

    constructor(settings: RoleSettings) {
        if (settings.admins == null) throw new Error("null admin roles");

        this.admins = settings.admins
    }
}