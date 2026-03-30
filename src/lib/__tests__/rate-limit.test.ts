import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}`;
    const result = checkRateLimit(key, { limit: 5, window: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    const opts = { limit: 2, window: 60_000 };

    checkRateLimit(key, opts); // 1st
    checkRateLimit(key, opts); // 2nd

    const result = checkRateLimit(key, opts); // 3rd - should be blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("decrements remaining correctly", () => {
    const key = `test-dec-${Date.now()}`;
    const opts = { limit: 3, window: 60_000 };

    const r1 = checkRateLimit(key, opts);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, opts);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, opts);
    expect(r3.remaining).toBe(0);
  });
});
