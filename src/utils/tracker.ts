import {getEnv} from "./utils.ts";
import {Mutex} from "./mutex.ts";
import {Playwright} from "./playwright.ts";
import NodeCache from "node-cache";

export class Tracker {
    private static lock = new Mutex();
    private static matchCache = new NodeCache({ stdTTL: 60 * 60 });
    private static profileCache = new NodeCache();

    public static setMatchData(matchId: string, data: MatchResponse) {
        this.matchCache.set(matchId, data);
    }

    public static async fetchMatch(matchId: string) {
        const data = this.matchCache.get<MatchResponse>(matchId);
        if (data) {
            return data;
        }

        const unlock = await this.lock.lock();
        try {
            const apiUrl = getEnv("API_URL_MATCH") + matchId;

            try {
                const data = await Playwright.fetch<MatchResponse>(apiUrl);
                if (data != null) {
                    this.matchCache.set<MatchResponse>(matchId, data);
                }

                return data;
            } catch (e) {
                return null;
            }
        } finally {
            setTimeout(unlock, 1000);
        }
    }

    public static async fetchProfile(riotId: string) {
        const data = this.profileCache.get<ProfileResponse>(riotId);
        if (data) {
            return data;
        }

        const unlock = await this.lock.lock();
        try {
            const apiUrl = getEnv("API_URL_PROFILE") + encodeURIComponent(riotId);

            try {
                const data = await Playwright.fetch<ProfileResponse>(apiUrl);
                if (data != null) {
                    this.profileCache.set<ProfileResponse>(riotId, data);
                }

                return data;
            } catch (e) {
                return null;
            }
        } finally {
            setTimeout(unlock, 1000);
        }
    }
}