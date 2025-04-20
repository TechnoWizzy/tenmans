import {getEnv} from "./utils.ts";

export default class Tracker {
    public static async fetchMatch(matchId: string) {
        const process = Bun.spawn({
            cmd: [
                "curl",
                "-X", "GET",
                getEnv("TRN_URL_MATCH") + matchId,
                "-H", `Origin: ${getEnv("TRN_ORIGIN")}`,
                "-H", `Referer: ${getEnv("TRN_REFERER")}`,
                "-H", `User-Agent: ${getEnv("TRN_USER_AGENT")}`,
                "-H", "Accept: application/json",
            ],
            stdout: "pipe",
            stderr: "ignore",
        });

        const response = await new Response(process.stdout).text();

        try {
            return JSON.parse(response) as MatchResponse;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    public static async fetchUser(userId: string) {
        const process = Bun.spawn({
            cmd: [
                "curl",
                "-X", "GET",
                getEnv("TRN_URL_USER") + userId,
                "-H", `Origin: ${getEnv("TRN_ORIGIN")}`,
                "-H", `Referer: ${getEnv("TRN_REFERER")}`,
                "-H", `User-Agent: ${getEnv("TRN_USER_AGENT")}`,
                "-H", "Accept: application/json",
            ],
            stdout: "pipe",
            stderr: "ignore",
        });

        const response = await new Response(process.stdout).text();

        try {
            return JSON.parse(response) as UserResponse;
        } catch (_) {
            return null;
        }
    }
}

