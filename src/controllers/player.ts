import Express, {type Router, type Request, type Response} from "express";
import {Player} from "../models/player.ts";
import NodeCache from "node-cache";

export class PlayerController {
    private readonly _router: Router;
    private readonly cache = new NodeCache({ stdTTL: 30, checkperiod: 5 });

    public constructor() {
        this._router = Express.Router();
        this._router.use(Express.json());
        this._router.get("/", this.getAllPlayers.bind(this));
    }

    public get router() {
        return this._router;
    }

    private async getAllPlayers(_req: Request, res: Response) {
        const cacheKey = "getAllPlayers";

        const value = this.cache.get(cacheKey);
        if (value) {
            res.json(value);
            return;
        }

        const players = await Player.fetchAll();
        this.cache.set(cacheKey, players);
        res.json(players);
    }
}