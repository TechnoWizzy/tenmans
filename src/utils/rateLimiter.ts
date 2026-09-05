// rateLimiter.ts
export class RateLimiter {
    private queue: Promise<void> = Promise.resolve();
    private lastRequestAt = 0;

    constructor(private readonly intervalMs: number) {}

    async wait(): Promise<void> {
        let release!: () => void;

        const previous = this.queue;

        this.queue = new Promise<void>(resolve => {
            release = resolve;
        });

        await previous;

        const now = Date.now();
        const waitMs = Math.max(
            0,
            this.intervalMs - (now - this.lastRequestAt)
        );

        if (waitMs > 0) {
            await new Promise(resolve => setTimeout(resolve, waitMs));
        }

        this.lastRequestAt = Date.now();
        release();
    }
}