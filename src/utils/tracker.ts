import {getEnv} from "./utils.ts";
import {Mutex} from "./mutex.ts";
import {Playwright} from "./playwright.ts";
import NodeCache from "node-cache";
import {RateLimiter} from "./rateLimiter.ts";

export class Tracker {
    private static lock = new Mutex();
    private static profileRateLimiter = new RateLimiter(1000);
    private static matchCache = new NodeCache({ stdTTL: 60 * 60 });
    private static profileCache = new NodeCache();
    private static pendingProfiles = new Map<string, Promise<ProfileResponse | null>>();

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

    public static async fetchProfile(
        riotId: string
    ): Promise<ProfileResponse | null> {
        const cached = this.profileCache.get<ProfileResponse>(riotId);

        if (cached) {
            return cached;
        }

        const pending = this.pendingProfiles.get(riotId);

        if (pending) {
            return pending;
        }

        const request = this.fetchProfileFromApi(riotId);

        this.pendingProfiles.set(riotId, request);

        try {
            return await request;
        } finally {
            this.pendingProfiles.delete(riotId);
        }
    }

    private static async fetchProfileFromApi(
        riotId: string
    ): Promise<ProfileResponse | null> {
        await this.profileRateLimiter.wait();

        const apiUrl =
            getEnv("API_URL_PROFILE") + encodeURIComponent(riotId);

        try {
            const data =
                await Playwright.fetch<ProfileResponse>(apiUrl);

            if (data != null) {
                this.profileCache.set(riotId, data);
            }

            return data;
        } catch {
            return null;
        }
    }
}