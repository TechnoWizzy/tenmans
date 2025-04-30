import { Collection, MongoClient } from "mongodb";
import {getEnv} from "../utils/utils.ts";
import type {Game} from "../models/game.ts";
import type {Player} from "../models/player.ts";

/**
 * The `Database` class is responsible for managing connections and collections to a MongoDB database.
 * It provides access to specific collections (`games`, `players`, `oldPlayers`) used within the application.
 */
export class Database {
    public static games: Collection<Game>;
    public static players: Collection<Player>;
    public static oldPlayers: Collection<Player>;

    /**
     * Establishes a connection to the database using the MongoDB client.
     * Configures collections for games, players, and old players for further operations.
     *
     * @return {Promise<void>} A promise that resolves once the connection and configuration are complete.
     */
    public static async connect(): Promise<void> {
        const connectionString = buildConnectionString();
        const client = await new MongoClient(connectionString).connect();
        const db = client.db("pugg");
        Database.games = db.collection<Game>("games-2025");
        Database.players = db.collection<Player>("players-2025");
        Database.oldPlayers = db.collection<Player>("old-players");
    }
}

/**
 * Constructs a MongoDB connection string using environment variables for the username, password, host, and port.
 *
 * @return {string} The constructed MongoDB connection string.
 */
function buildConnectionString(): string {
    const username = getEnv("MONGO_USERNAME");
    const password = getEnv("MONGO_PASSWORD");
    const host = getEnv("MONGO_HOST");
    const port = getEnv("MONGO_PORT");
    return `mongodb://${username}:${password}@${host}:${port}`;
}