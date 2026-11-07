import type {Page} from "playwright-core";
import type {BrowserResponse} from "./browser.ts";

// Pause between history pages so paging looks like someone clicking "Load more"
const PAGE_DELAY_MS = 1500;
const MAX_PAGES = 30;

type HistoryBody = {
    data?: {
        matches?: { metadata?: { timestamp?: string } }[];
        metadata?: { next?: number | null };
    };
};

/**
 * Follows tracker's `next` cursor from inside the already-loaded profile page, so the requests reuse the page's
 * Cloudflare session, and merges every page's matches into the first response.
 * Stops at maxPages, when there are no more pages, or once the oldest match loaded is older than `until`.
 */
export async function fetchMoreMatches(page: Page, first: BrowserResponse, maxPages: number, until: number) {
    let body: HistoryBody;
    try {
        body = JSON.parse(first.body);
    } catch {
        return first;
    }
    if (!body.data?.matches) return first;

    const matches = [...body.data.matches];
    let next = body.data.metadata?.next;
    let pages = 1;
    const limit = Math.min(Math.max(maxPages, 1), MAX_PAGES);
    const reachedUntil = () => {
        const oldest = matches.at(-1)?.metadata?.timestamp;
        return !Number.isNaN(until) && oldest != null && Date.parse(oldest) < until;
    };

    while (next != null && pages < limit && !reachedUntil()) {
        await page.waitForTimeout(PAGE_DELAY_MS);
        const url = new URL(first.url);
        url.searchParams.set("next", String(next));

        const result = await page.evaluate(async (target) => {
            const response = await fetch(target, {credentials: "include"});
            return {status: response.status, body: await response.text()};
        }, url.toString());

        if (result.status >= 400) {
            console.log(`History page ${next} returned ${result.status}, returning ${pages} page(s)`);
            break;
        }

        const more = (JSON.parse(result.body) as HistoryBody).data;
        if (!more?.matches?.length) break;
        matches.push(...more.matches);
        next = more.metadata?.next;
        pages++;
    }

    const merged = {
        ...body,
        data: {...body.data, matches, metadata: {...body.data.metadata, next: next ?? null, pages}},
    };
    return {...first, body: JSON.stringify(merged)};
}
