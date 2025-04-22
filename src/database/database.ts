import { Collection, MongoClient } from "mongodb";
import {getEnv} from "../utils/utils.ts";
import type Game from "../models/game.ts";
import type Player from "../models/player.ts";

export default class Database {
    public static games: Collection<Game>;
    public static players: Collection<Player>;
    public static oldPlayers: Collection<Player>;

    public static async connect() {
        const connectionString = buildConnectionString();
        const client = await new MongoClient(connectionString).connect();
        const db = client.db("pugg");
        Database.games = db.collection<Game>("games-2025");
        Database.players = db.collection<Player>("players-2025");
        Database.oldPlayers = db.collection<Player>("old-players");
    }
}

function buildConnectionString() {
    const username = getEnv("MONGO_USERNAME");
    const password = getEnv("MONGO_PASSWORD");
    const host = getEnv("MONGO_HOST");
    const port = getEnv("MONGO_PORT");
    return `mongodb://${username}:${password}@${host}:${port}`;
}