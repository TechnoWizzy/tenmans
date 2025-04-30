import {getEnv} from "./utils.ts";
import {Mutex} from "./mutex.ts";

export class Tracker {
    private static lock = new Mutex();
    private static cache = new Map<string, MatchResponse>();

    public static setMatchData(matchId: string, data: MatchResponse) {
        this.cache.set(matchId, data);
    }

    public static async fetchMatch(matchId: string) {
        const data = this.cache.get(matchId);
        if (data) {
            return data;
        }

        const unlock = await this.lock.lock();
        try {
            const command = [
                "wget",
                "-qO-", "--no-check-certificate", "--quiet",
                "--method", "GET", "--timeout=0",
                "--header", `Host: ${getEnv("API_HOST")}`,
                "--header", `Origin: ${getEnv("API_ORIGIN")}`,
                "--header", `Referer: ${getEnv("API_REFERER")}`,
                "--header", `User-Agent: ${getEnv("API_USER_AGENT")}`,
                getEnv("API_URL_MATCH") + matchId,
            ]

            const process = Bun.spawn({
                cmd: command,
                stdout: "pipe",
                stderr: "ignore",
                shell: true,
            });

            const response = await new Response(process.stdout).text();

            try {
                const data =JSON.parse(response) as MatchResponse;
                this.cache.set(matchId, data);
                return data;
            } catch (e) {
                return null;
            }
        } finally {
            setTimeout(unlock, 60 * 1000);
        }
    }
}

