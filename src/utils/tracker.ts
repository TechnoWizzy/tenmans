import {getEnv} from "./utils.ts";

export default class Tracker {
    public static async fetchMatch(matchId: string) {
        const command = [
            "wget",
            "-qO-", "--no-check-certificate", "--quiet",
            "--method", "GET", "--timeout=0",
            "--header", `Host: ${getEnv("TRN_HOST")}`,
            "--header", `Origin: ${getEnv("TRN_ORIGIN")}`,
            "--header", `Referer: ${getEnv("TRN_REFERER")}`,
            "--header", `User-Agent: ${getEnv("TRN_USER_AGENT")}`,
            getEnv("TRN_URL_MATCH") + matchId,
        ]

        const process = Bun.spawn({
            cmd: command,
            stdout: "pipe",
            stderr: "ignore",
            shell: true,
        });

        const response = await new Response(process.stdout).text();

        try {
            return JSON.parse(response) as MatchResponse;
        } catch (e) {
            return null;
        }
    }

    public static async fetchUser(userId: string) {
        const command = [
            "wget", "-qO-", "--server-response",
            "--no-check-certificate", "--quiet",
            "--method", "GET", "--timeout=0",
            "--header", `Host: ${getEnv("TRN_HOST")}`,
            "--header", `Origin: ${getEnv("TRN_ORIGIN")}`,
            "--header", `Referer: ${getEnv("TRN_REFERER")}`,
            "--header", `User-Agent: ${getEnv("TRN_USER_AGENT")}`,
            getEnv("TRN_URL_USER") + encodeURIComponent(userId),
        ]

        const process = Bun.spawn({
            cmd: command,
            stdout: "pipe",
            stderr: "pipe",
            shell: true,
        });

        const response = await new Response(process.stdout).text();
        const error = await new Response(process.stderr).text();

        console.log(error);

        if (error.includes("451 Unavailable For Legal Reasons")) {
            return {} as UserResponse;
        }

        try {
            return JSON.parse(response) as UserResponse;
        } catch (_) {
            return null;
        }
    }
}

