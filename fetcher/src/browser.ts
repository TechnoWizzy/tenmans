import { launch } from "cloakbrowser";
import {type Browser as PlaywrightBrowser, type BrowserContext, type Page} from "playwright-core";
import {getEnv} from "./utils.ts";

export type BrowserResponse = {
    status: number;
    contentType: string;
    body: string;
};

const LAUNCH_TIMEOUT_MS = 60 * 1000;

const API_TIMEOUT_MS = 30 * 1000;

// Compare host + path only, ignoring query, encoding and case
function normalizeUrl(url: string) {
    try {
        const parsed = new URL(url);
        return (parsed.host + decodeURIComponent(parsed.pathname)).toLowerCase().replace(/\/$/, "");
    } catch {
        return url;
    }
}

export class Browser {
    private static browser: Promise<PlaywrightBrowser> | null = null;
    private static closing = false;

    private static getBrowser() {
        if (this.closing) {
            return Promise.reject(new Error("Browser is shutting down"));
        }

        if (!this.browser) {
            this.browser = this.launchBrowser().catch((e) => {
                this.browser = null;
                throw e;
            });
        }
        return this.browser;
    }

    private static async launchBrowser() {
        if (process.platform == "linux" && !process.env.DISPLAY) {
            throw new Error("DISPLAY is not set. A headed browser requires an X server (e.g. Xvfb)");
        }

        const browser = await launch({
            licenseKey: getEnv("CLOAKBROWSER_KEY"),
            geoip: false,
            args: ["--fingerprint-noise=true", "--fingerprint-windows-font-metrics"],
            headless: false,
            humanize: true,
            launchOptions: {
                timeout: LAUNCH_TIMEOUT_MS,
                // Shutdown is handled in index.ts
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false,
            },
        });

        browser.on("disconnected", () => {
            this.browser = null;
            if (!this.closing) {
                console.log("Browser disconnected, will relaunch on next request");
            }
        });

        return browser;
    }

    private static context: Promise<BrowserContext> | null = null;

    private static async getContext() {
        const browser = await Browser.getBrowser();
        if (!this.context) {
            this.context = browser.newContext().catch((e) => {
                this.context = null;
                throw e;
            });
            browser.once("disconnected", () => this.context = null);
        }
        return this.context;
    }

    public static async version() {
        const browser = await Browser.getBrowser();
        return browser.version();
    }

    public static async fetch(pageUrl: string, apiUrl: string): Promise<BrowserResponse> {
        const target = normalizeUrl(apiUrl);
        let page: Page | undefined;
        try {
            const context = await Browser.getContext();
            page = await context.newPage();

            const apiResponse = page.waitForResponse((r) => normalizeUrl(r.url()) == target, { timeout: API_TIMEOUT_MS });
            apiResponse.catch(() => {}); // Observed below; avoids an unhandled rejection if navigation fails first

            await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

            if ((await page.title()).includes("Just a moment")) {
                console.log(`Cloudflare verification required for ${pageUrl}`);
                return {
                    status: 503,
                    contentType: "application/json",
                    body: JSON.stringify({ error: `Cloudflare verification required for ${pageUrl}` }),
                };
            }

            const response = await apiResponse.catch((e) => {
                throw new Error(`${pageUrl} did not request ${apiUrl}`, { cause: e });
            });

            const status = response.status();
            const body = await response.text();

            if (status >= 400) {
                console.log(`${status} from ${response.url()}`, body.slice(0, 300));
            }

            return {
                status,
                contentType: response.headers()["content-type"] ?? "application/json",
                body,
            };
        } finally {
            await page?.close().catch(() => {});
        }
    }

    public static async close() {
        this.closing = true;
        if (this.browser != null) {
            const browser = await this.browser.catch(() => null);
            this.browser = null;
            await browser?.close();
        }
    }
}
