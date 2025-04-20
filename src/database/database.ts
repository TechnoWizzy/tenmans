import { Collection, MongoClient } from "mongodb";
import {getEnv} from "../utils/utils.ts";
import type Game from "../models/game.ts";
import type Player from "../models/player.ts";

export default class Database {
    public static games: Collection<Game>;
    public static players: Collection<Player>;

    public static async connect() {
        const connectionString = getEnv("MONGO_CONNECTION_STRING");
        const client = await new MongoClient(connectionString).connect();
        const db = client.db("pugg");
        Database.games = db.collection<Game>("games-2025");
        Database.players = db.collection<Player>("players-2025");
    }
}