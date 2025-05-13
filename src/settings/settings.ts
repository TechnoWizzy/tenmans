import type {ActivityType} from "discord.js";

/**
 * The Settings class represents the configuration settings associated with a guild.
 * It includes the guild's unique identifier, role, status, and channel configurations.
 */
export class Settings {
    public guildId: string;
    public roles: RoleSettings;
    public status: StatusSettings;
    public channels: ChannelSettings;

    /**
     * Constructs a new instance of the class with the provided settings from an instance of the Settings type,
     * which is given when loading the settings in from a file.
     *
     * @param {Settings} settings - The configuration settings used to initialize the instance.
     * - `guildId`: The unique identifier for the guild. Must not be null.
     * - `roles`: The role configuration settings. Must not be null.
     * - `status`: The status configuration settings. Must not be null.
     * - `channels`: The channel configuration settings. Must not be null.
     *
     * @throws {Error} If any of the required settings (`guildId`, `roles`, `status`, `channels`) are null.
     */
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

    /**
     * Asynchronously fetches settings by reading the settings.json file and parses its content.
     * Returns an instance of the Settings object created from the file's JSON content.
     *
     * @return {Promise<Settings>} A promise that resolves to a Settings object containing the parsed JSON data from the
     * settings file.
     */
    public static async fetchSettings(): Promise<Settings> {
        const file = Bun.file("./settings.json");
        const json = await file.json()
        return new Settings(json);
    }
}

export class ChannelSettings {
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

export class StatusSettings {
    public name: string
    public url?: string
    public type: ActivityType

    public constructor(settings: StatusSettings) {
        if (settings.name == null) throw new Error("null name status");
        if (settings.type == null) throw new Error("null type status");

        this.name = settings.name;
        this.url = settings.url;
        this.type = settings.type;
    }
}

export class RoleSettings {
    public admins: string[]
    public tenmans: string

    constructor(settings: RoleSettings) {
        if (settings.admins == null) throw new Error("null admin roles");
        if (settings.tenmans == null) throw new Error("null tenmans roles");

        this.admins = settings.admins;
        this.tenmans = settings.tenmans;
    }
}