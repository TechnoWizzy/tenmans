import { launch } from "cloakbrowser";
import {HttpStatusCode} from "axios";
import {type Browser, devices} from "playwright-core";

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
    private static browser: Browser | null = null;

    private static async getBrowser() {
        if (!this.browser) {
            this.browser = await launch({
                args: ["--fingerprint=481516"],
                headless: false,
                humanize: true
            });
        }
        return this.browser;
    }

    /**
     * Fetches and parses a JSON payload from the given URL.
     *
     * @throws {FetchError} If the request could not be completed or the response was an error.
     */
    public static async fetch<T>(apiUrl: string): Promise<T> {
        const browser = await Playwright.getBrowser();
        const context = await browser.newContext(devices['Desktop Chrome']);
        try {
            const page = await context.newPage();
            const response = await page.goto(apiUrl, { waitUntil: "networkidle" });

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
            await context.close();
        }
    }

    public static async close() {
        if (this.browser != null) {
            await this.browser.close();
        }
    }
}

export function wait(milliseconds: number) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}