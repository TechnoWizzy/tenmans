import { launch } from "cloakbrowser";
import {
    type Browser as PlaywrightBrowser,
    type BrowserContext,
    type Frame,
    type Page,
    type Response as PlaywrightResponse,
} from "playwright-core";
import {DEBUG, getEnv} from "./utils.ts";

export type BrowserResponse = {
    status: number;
    contentType: string;
    body: string;
    url: string;
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

const DEBUG_DIR = "/tmp/fetcher-debug";

// Screenshot the page when FETCHER_DEBUG is enabled
async function debugSnapshot(page: Page, label: string) {
    if (!DEBUG) return;
    try {
        const path = `${DEBUG_DIR}/${Date.now()}-${label}.png`;
        await page.screenshot({ path, fullPage: true });
        console.log(`[debug] ${label}: saved ${path}`);
    } catch (e) {
        console.log(`[debug] ${label}: snapshot failed`, e);
    }
}

// How long to wait for the Cloudflare widget to appear on the page
const CHALLENGE_APPEAR_MS = 15 * 1000;
// How long to give the widget to pass, including any clicks
const CHALLENGE_SOLVE_MS = 45 * 1000;
// How long to let the widget verify on its own before clicking its checkbox
const CHALLENGE_CLICK_AFTER_MS = 10 * 1000;
const CHALLENGE_POLL_MS = 500;

type ChallengeResult =
    | { kind: "response"; response: PlaywrightResponse }
    | { kind: "solved" }
    | { kind: "failed"; reason: string };

function findChallengeFrame(page: Page) {
    return page.frames().find((f) => f.url().includes("challenges.cloudflare.com"));
}

async function hasTurnstileToken(page: Page) {
    // Turnstile writes its token into this input once the check passes
    const inputs = page.locator('input[name="cf-turnstile-response"]');
    for (const input of await inputs.all()) {
        if (await input.inputValue().catch(() => "")) return true;
    }
    return false;
}

// Turnstile's checkbox sits inside a closed shadow root, so click its position within the iframe
async function clickChallengeCheckbox(frame: Frame, page: Page) {
    const box = await (await frame.frameElement()).boundingBox();
    if (!box) return false;
    await page.mouse.click(box.x + 30, box.y + box.height / 2);
    return true;
}

// Wait for the Cloudflare Turnstile captcha to pass, clicking its checkbox if it stalls
async function solveChallenge(page: Page, target: string): Promise<ChallengeResult> {
    // The page may call the API again on its own once the captcha passes
    let retried: PlaywrightResponse | undefined;
    const onResponse = (r: PlaywrightResponse) => {
        if (normalizeUrl(r.url()) == target) retried = r;
    };
    page.on("response", onResponse);

    try {
        const appearDeadline = Date.now() + CHALLENGE_APPEAR_MS;
        let frame = findChallengeFrame(page);
        while (!frame && Date.now() < appearDeadline) {
            await page.waitForTimeout(CHALLENGE_POLL_MS);
            frame = findChallengeFrame(page);
        }
        if (!frame) {
            await debugSnapshot(page, "challenge-missing");
            return { kind: "failed", reason: "Cloudflare widget never appeared" };
        }

        console.log("Cloudflare widget found, waiting for it to verify");
        await debugSnapshot(page, "challenge-found");

        const start = Date.now();
        let nextClick = start + CHALLENGE_CLICK_AFTER_MS;
        while (Date.now() - start < CHALLENGE_SOLVE_MS) {
            if (retried && retried.status() < 400) {
                console.log(`Page retried the API itself: ${retried.status()}`);
                return { kind: "response", response: retried };
            }
            if (await hasTurnstileToken(page)) {
                await debugSnapshot(page, "challenge-solved");
                return { kind: "solved" };
            }

            if (Date.now() >= nextClick) {
                // The widget may have re-rendered, so look it up again
                frame = findChallengeFrame(page) ?? frame;
                if (await clickChallengeCheckbox(frame, page).catch(() => false)) {
                    console.log("Widget still verifying, clicked its checkbox");
                    await debugSnapshot(page, "challenge-clicked");
                }
                nextClick = Date.now() + CHALLENGE_CLICK_AFTER_MS;
            }

            await page.waitForTimeout(CHALLENGE_POLL_MS);
        }

        await debugSnapshot(page, "challenge-timeout");
        return { kind: "failed", reason: `not passed within ${CHALLENGE_SOLVE_MS / 1000}s` };
    } finally {
        page.off("response", onResponse);
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

    /**
     * Opens pageUrl and returns the response to the apiUrl request it makes. `after` runs with the page still open
     * when that response succeeded, e.g. to request more pages with the same session.
     */
    public static async fetch(
        pageUrl: string,
        apiUrl: string,
        after?: (page: Page, first: BrowserResponse) => Promise<BrowserResponse>,
    ): Promise<BrowserResponse> {
        const target = normalizeUrl(apiUrl);
        let page: Page | undefined;
        try {
            const context = await Browser.getContext();
            page = await context.newPage();

            const waitForApi = (p: Page) => {
                const pending = p.waitForResponse((r) =>
                    normalizeUrl(r.url()) == target,
                    { timeout: API_TIMEOUT_MS }
                );
                pending.catch(() => {}); // Observed below; avoids an unhandled rejection if navigation fails first
                return pending;
            };

            const apiResponse = waitForApi(page);

            await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

            if ((await page.title()).includes("Just a moment")) {
                console.log(`Cloudflare verification required for ${pageUrl}`);
                return {
                    status: 503,
                    contentType: "application/json",
                    body: JSON.stringify({ error: `Cloudflare verification required for ${pageUrl}` }),
                    url: apiUrl,
                };
            }

            let response = await apiResponse.catch((e) => {
                throw new Error(`${pageUrl} did not request ${apiUrl}`, { cause: e });
            });

            if (response.status() == 429 || response.status() == 403) {
                console.log(`${response.status()} from ${response.url()}, waiting for the captcha`);
                const result = await solveChallenge(page, target);

                if (result.kind == "response") {
                    // The page retried the API itself after the captcha passed
                    response = result.response;
                } else if (result.kind == "solved") {
                    console.log("Captcha passed, reloading");
                    const retryResponse = waitForApi(page);
                    await page.reload({ waitUntil: "domcontentloaded" });
                    response = await retryResponse.catch((e) => {
                        throw new Error(`${pageUrl} did not request ${apiUrl} after reload`, { cause: e });
                    });
                } else {
                    console.log(`Captcha not passed: ${result.reason}`);
                }
            }

            const status = response.status();
            const body = await response.text();

            if (status >= 400) {
                console.log(`${status} from ${response.url()} (${body.length} bytes)`);
                if (DEBUG) console.log(`[debug] body: ${body.slice(0, 300)}`);
            }

            const result = {
                status,
                contentType: response.headers()["content-type"] ?? "application/json",
                body,
                url: response.url(),
            };
            return after && status < 400 ? await after(page, result) : result;
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
