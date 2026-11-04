// Enables page screenshots and response body logging
export const DEBUG = process.env.FETCHER_DEBUG == "true";

export function getEnv(key: string) {
    const value = process.env[key];
    if (!value) throw new Error(`env ${key} not found`);
    return value;
}

// One-line summary of an error and its causes, without stacks or Playwright call logs
export function describeError(e: unknown): string {
    if (DEBUG) return Bun.inspect(e);
    const parts: string[] = [];
    let current: unknown = e;
    while (current != null && parts.length < 5) {
        if (current instanceof Error) {
            parts.push(current.message.split("\n")[0]);
            current = current.cause;
        } else {
            parts.push(String(current));
            break;
        }
    }
    return parts.join(" <- ");
}
