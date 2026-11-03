import { launch } from "cloakbrowser";
import {HttpStatusCode} from "axios";
import {type Browser, type Page} from "playwright-core";
import {getEnv} from "./utils.ts";

/**
 * Thrown when a request could not be completed. Carries the HTTP status when one was received, so callers can tell a
 * transient failure (rate limit, 5xx, navigation error) apart from a permanent one.
 */
export class FetchError extends Error {
    public readonly status?: number;

    public constructor(message: string, status?: number, options?: { cause?: unknown }) {
        super(message, options);
        this.name = "FetchError";
        this.status = status;
    }
}

export class Playwright {
    private static browser: Promise<Browser> | null = null;

    private static getBrowser() {
        // Cache the launch promise so concurrent callers share a single browser
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
            args: ["--fingerprint-noise=false", "--fingerprint-windows-font-metrics"],
            headless: false,
            humanize: true
        });

        // Drop the dead instance so the next fetch relaunches
        browser.on("disconnected", () => {
            console.log("Browser disconnected, will relaunch on next request");
            this.browser = null;
        });

        return browser;
    }

    /**
     * Launches the browser so configuration problems surface at startup rather than on the first fetch.
     *
     * @throws {Error} If the browser could not be launched.
     */
    public static async healthCheck() {
        const browser = await Playwright.getBrowser();
        console.log(`Browser ready: ${browser.version()}`);
    }

    /**
     * Fetches and parses a JSON payload from the given URL.
     *
     * @throws {FetchError} If the request could not be completed or the response was an error.
     */
    public static async fetch<T>(apiUrl: string): Promise<T> {
        let page: Page | undefined;
        try {
            const browser = await Playwright.getBrowser();
            page = await browser.newPage();
            const response = await page.goto(apiUrl, { waitUntil: "networkidle" });

            const stealthCheck = await page.evaluate(() => ({
                webdriver: navigator.webdriver,
                platform: navigator.platform,
                userAgent: navigator.userAgent,
            }));

            console.log(stealthCheck);

            if (!response) {
                throw new FetchError(`No response from ${apiUrl}`);
            }

            const status = response.status();

            if (status == HttpStatusCode.UnavailableForLegalReasons) {
                // Private profile
                return {} as T;
            }

            if (status >= 400) {
                console.log("400+ Error Playwright", await response.text());
                throw new FetchError(`Request to ${apiUrl} failed with status ${status}`, status);
            }

            return (await response.json()) as T;
        } catch (e) {
            if (e instanceof FetchError) {
                throw e;
            }
            throw new FetchError(`Request to ${apiUrl} failed`, undefined, { cause: e });
        } finally {
            await page?.close().catch(() => {});
        }
    }

    public static async close() {
        if (this.browser != null) {
            const browser = await this.browser.catch(() => null);
            this.browser = null;
            await browser?.close();
        }
    }
}

export function wait(milliseconds: number) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}