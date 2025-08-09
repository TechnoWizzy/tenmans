import {getEnv} from "./utils.ts";
import {Mutex} from "./mutex.ts";
import {Playwright} from "./playwright.ts";

export class Tracker {
    private static lock = new Mutex();
    private static matchCache = new Map<string, MatchResponse>();
    private static profileCache = new Map<string, ProfileResponse>();

    public static setMatchData(matchId: string, data: MatchResponse) {
        this.matchCache.set(matchId, data);
    }

    public static async fetchMatch(matchId: string) {
        const data = this.matchCache.get(matchId);
        if (data != null) {
            return data;
        }

        const unlock = await this.lock.lock();
        try {
            const apiUrl = getEnv("API_URL_MATCH") + matchId;

            try {
                const data = await Playwright.fetch<MatchResponse>(apiUrl);
                if (data != null) {
                    this.matchCache.set(matchId, data);
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
        console.log("Fetch profile");

        const data = this.profileCache.get(riotId);
        if (data != null) {
            return data;
        }

        const unlock = await this.lock.lock();
        try {
            const apiUrl = getEnv("API_URL_PROFILE") + encodeURIComponent(riotId);

            try {
                const data = await Playwright.fetch<ProfileResponse>(apiUrl);
                if (data != null) {
                    this.profileCache.set(riotId, data);
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