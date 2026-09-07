import {getEnv} from "./utils.ts";
import {Mutex} from "./mutex.ts";
import {FetchError, Playwright, wait} from "./playwright.ts";
import NodeCache from "node-cache";
import {RateLimiter} from "./rateLimiter.ts";
import {HttpStatusCode} from "axios";

const MATCH_FETCH_ATTEMPTS = 3;
const MATCH_FETCH_BACKOFF_MS = 5000;

export class Tracker {
    private static lock = new Mutex();
    private static profileRateLimiter = new RateLimiter(1000);
    private static matchCache = new NodeCache({ stdTTL: 60 * 60 });
    private static profileCache = new NodeCache();
    private static pendingProfiles = new Map<string, Promise<ProfileResponse | null>>();

    public static setMatchData(matchId: string, data: MatchResponse) {
        this.matchCache.set(matchId, data);
    }

    /**
     * Fetches match data, serving it from the cache when available.
     *
     * @throws {FetchError} If the match data could not be retrieved.
     */
    public static async fetchMatch(matchId: string): Promise<MatchResponse> {
        const cached = this.matchCache.get<MatchResponse>(matchId);
        if (cached) {
            return cached;
        }

        const unlock = await this.lock.lock();
        try {
            const data = await this.fetchMatchFromApi(matchId);
            this.matchCache.set<MatchResponse>(matchId, data);
            return data;
        } finally {
            setTimeout(unlock, 1000);
        }
    }

    /**
     * Fetches match data from the API, retrying with an exponential backoff.
     */
    private static async fetchMatchFromApi(matchId: string): Promise<MatchResponse> {
        const apiUrl = getEnv("API_URL_MATCH") + matchId;
        let lastError: unknown;

        for (let attempt = 1; attempt <= MATCH_FETCH_ATTEMPTS; attempt++) {
            if (attempt > 1) {
                const backoff = MATCH_FETCH_BACKOFF_MS * Math.pow(2, attempt - 2);
                console.log(`Retrying match ${matchId} in ${backoff}ms (attempt ${attempt}/${MATCH_FETCH_ATTEMPTS})`);
                await wait(backoff);
            }

            try {
                const data = await Playwright.fetch<MatchResponse>(apiUrl);

                if (!data?.data?.segments) {
                    throw new FetchError(`Match ${matchId} returned no segment data`);
                }

                return data;
            } catch (e) {
                console.log(e);
                lastError = e;
                const status = e instanceof FetchError ? e.status : undefined;
                if (status != undefined && status >= 400 && status < 500 && status != HttpStatusCode.TooManyRequests) {
                    break;
                }
            }
        }

        throw new FetchError(`Failed to fetch match ${matchId} after ${MATCH_FETCH_ATTEMPTS} attempts`, undefined,
            { cause: lastError });
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