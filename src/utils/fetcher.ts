import {HttpStatusCode} from "axios";
import {getEnv} from "./utils.ts";

const REQUEST_TIMEOUT_MS = 90 * 1000;

export class FetchError extends Error {
    public readonly status?: number;

    public constructor(message: string, status?: number, options?: { cause?: unknown }) {
        super(message, options);
        this.name = "FetchError";
        this.status = status;
    }
}

export class Fetcher {
    public static fetchProfile(riotId: string) {
        return Fetcher.get<ProfileResponse>(`/profile/${encodeURIComponent(riotId)}`);
    }

    public static fetchMatch(matchId: string) {
        return Fetcher.get<MatchResponse>(`/match/${encodeURIComponent(matchId)}`);
    }

    /** Custom-game history, following pages back to `until` (at most `pages` pages of 20) */
    public static fetchCustomMatches(riotId: string, options: { seasonId?: string, until?: Date, pages?: number } = {}) {
        const query = new URLSearchParams();
        if (options.seasonId) query.set("season", options.seasonId);
        if (options.until) query.set("until", options.until.toISOString());
        if (options.pages) query.set("pages", String(options.pages));
        return Fetcher.get<MatchHistoryResponse>(`/matches/${encodeURIComponent(riotId)}?${query}`);
    }

    public static async healthCheck() {
        const health = await Fetcher.get<{ version: string }>("/health");
        console.log(`Fetcher ready: ${health.version}`);
    }

    private static async get<T>(path: string): Promise<T> {
        const url = getEnv("FETCHER_URL") + path;
        let response: Response;
        try {
            response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        } catch (e) {
            throw new FetchError(`Request to ${url} failed`, undefined, { cause: e });
        }

        const status = response.status;

        if (status == HttpStatusCode.UnavailableForLegalReasons) {
            // Private profile
            return {} as T;
        }

        if (status >= 400) {
            const body = (await response.text()).replace(/\s+/g, " ").slice(0, 150);
            throw new FetchError(`Request to ${url} failed with status ${status}: ${body}`, status);
        }

        try {
            return (await response.json()) as T;
        } catch (e) {
            throw new FetchError(`Request to ${url} returned invalid JSON`, status, { cause: e });
        }
    }
}
