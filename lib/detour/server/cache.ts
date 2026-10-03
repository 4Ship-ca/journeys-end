export type CacheHit<T> = { value: T; storedAt: number; fresh: boolean };

/**
 * Best-effort in-memory cache. Each Worker isolate has its own copy, so it is a
 * cost and politeness measure, not a shared or durable store.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; storedAt: number }>();

  constructor(
    private readonly freshMs: number,
    private readonly staleMs: number,
    private readonly maxEntries: number,
  ) {}

  /** Returns a fresh entry, or a stale one still inside the stale window. */
  get(key: string, now: number): CacheHit<T> | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    const age = now - entry.storedAt;
    if (age > this.staleMs) {
      this.entries.delete(key);
      return undefined;
    }
    return { value: entry.value, storedAt: entry.storedAt, fresh: age <= this.freshMs };
  }

  set(key: string, value: T, now: number): void {
    this.entries.delete(key);
    this.entries.set(key, { value, storedAt: now });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
