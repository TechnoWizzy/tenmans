import Express, {type Response} from "express";
import process from "process";
import {Browser, type BrowserResponse} from "./browser.ts";
import {describeError, getEnv} from "./utils.ts";
import {fetchMoreMatches} from "./history.ts";
import type {Page} from "playwright-core";

async function relay(res: Response, pageUrl: string, apiUrl: string,
                     after?: (page: Page, first: BrowserResponse) => Promise<BrowserResponse>) {
    try {
        const response = await Browser.fetch(pageUrl, apiUrl, after);
        res.status(response.status).type(response.contentType).send(response.body);
    } catch (e) {
        console.log(`Failed to fetch ${pageUrl}: ${describeError(e)}`);
        res.status(502).json({ error: (e as Error).message });
    }
}

// Below compose stop_grace_period
const SHUTDOWN_TIMEOUT_MS = 25 * 1000;

const server = Express()
    .get("/health", async (_, res) => {
        try {
            res.json({ ok: true, version: await Browser.version() });
        } catch (e) {
            console.log("Health check failed", e);
            res.status(503).json({ ok: false, error: (e as Error).message });
        }
    })
    .get("/profile/:riotId", async (req, res) => {
        const id = encodeURIComponent(req.params.riotId);
        await relay(res, getEnv("TRACKER_URL_PROFILE") + id, getEnv("API_URL_PROFILE") + id);
    })
    .get("/match/:matchId", async (req, res) => {
        const id = encodeURIComponent(req.params.matchId);
        await relay(res, getEnv("TRACKER_URL_MATCH") + id, getEnv("API_URL_MATCH") + id);
    })
    // A player's custom games, newest first. Used by scripts/backfill-games.ts
    //   ?season=<seasonId>   act to list (tracker's default is the current act)
    //   ?pages=<n>           follow the `next` cursor for up to n pages of 20 (default 1, max 30)
    //   ?until=<ISO date>    stop paging once matches older than this are loaded
    .get("/matches/:riotId", async (req, res) => {
        const id = encodeURIComponent(req.params.riotId);
        const season = typeof req.query.season == "string" ? `&season=${encodeURIComponent(req.query.season)}` : "";
        const pages = Number(req.query.pages) || 1;
        const until = typeof req.query.until == "string" ? Date.parse(req.query.until) : NaN;
        const pageUrl = `${getEnv("TRACKER_URL_PROFILE")}${id}/customs?platform=pc${season}`;
        await relay(res, pageUrl, `${getEnv("API_URL_MATCH")}riot/${id}`,
            (page, first) => fetchMoreMatches(page, first, pages, until));
    })
    .listen(3000, () => console.log(`Fetcher: ${process.pid}`));

Browser.version()
    .then((version) => console.log(`Browser ready: ${version}`))
    .catch((e) => console.log("Browser startup failed", e));

let shuttingDown = false;

async function shutdown(reason: string, exitCode = 0) {
    if (shuttingDown) {
        console.log(`Received ${reason}, already shutting down`);
        return;
    }
    shuttingDown = true;
    console.log(`Shutting down (${reason})`);

    setTimeout(() => {
        console.log("Shutdown timed out, forcing exit");
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close();

    try {
        await Browser.close();
        console.log("Browser closed");
    } catch (e) {
        console.log("Failed to close browser", e);
        exitCode = 1;
    }

    process.exit(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(signal, () => void shutdown(signal));
}

process.on("uncaughtException", (e) => {
    console.log("Uncaught exception", e);
    void shutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (e) => {
    console.log("Unhandled rejection", e);
    void shutdown("unhandledRejection", 1);
});
