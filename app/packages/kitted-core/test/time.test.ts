// dayKey and the 4 am rollover, including the Nov 1 2026 and Mar 8 2026 DST changes.
import { describe, expect, it } from "vitest";
import { addDays, dayKey, daysBetween, localParts, nextRolloverMs, parseRollover, US_EASTERN, wallToUtc, weekdayOf } from "../src/index";

const z = (iso: string) => Date.parse(iso);

describe("US_EASTERN", () => {
  it("EDT in October, EST after 2 am EDT on Nov 1 2026", () => {
    expect(US_EASTERN(z("2026-10-22T12:00:00Z"))).toBe(-4 * 3_600_000);
    expect(US_EASTERN(z("2026-11-01T05:59:59Z"))).toBe(-4 * 3_600_000);
    expect(US_EASTERN(z("2026-11-01T06:00:00Z"))).toBe(-5 * 3_600_000);
  });
  it("switches to EDT at 2 am EST on Mar 8 2026", () => {
    expect(US_EASTERN(z("2026-03-08T06:59:59Z"))).toBe(-5 * 3_600_000);
    expect(US_EASTERN(z("2026-03-08T07:00:00Z"))).toBe(-4 * 3_600_000);
  });
});

describe("dayKey (4 am rollover)", () => {
  it("03:59 belongs to the previous day, 04:00 starts the new one", () => {
    expect(dayKey(z("2026-10-23T03:59:00-04:00"), US_EASTERN)).toBe("2026-10-22");
    expect(dayKey(z("2026-10-23T04:00:00-04:00"), US_EASTERN)).toBe("2026-10-23");
    expect(dayKey(z("2026-10-22T07:42:00-04:00"), US_EASTERN)).toBe("2026-10-22");
  });
  it("handles the Nov 1 fall-back (01:30 happens twice)", () => {
    expect(dayKey(z("2026-11-01T01:30:00-04:00"), US_EASTERN)).toBe("2026-10-31"); // first 01:30 (EDT)
    expect(dayKey(z("2026-11-01T01:30:00-05:00"), US_EASTERN)).toBe("2026-10-31"); // second 01:30 (EST)
    expect(dayKey(z("2026-11-01T03:59:00-05:00"), US_EASTERN)).toBe("2026-10-31");
    expect(dayKey(z("2026-11-01T04:00:00-05:00"), US_EASTERN)).toBe("2026-11-01");
  });
  it("handles the Mar 8 spring-forward", () => {
    expect(dayKey(z("2026-03-08T03:30:00-04:00"), US_EASTERN)).toBe("2026-03-07");
    expect(dayKey(z("2026-03-08T04:00:00-04:00"), US_EASTERN)).toBe("2026-03-08");
  });
  it("takes another rollover time", () => {
    expect(dayKey(z("2026-10-22T00:30:00-04:00"), US_EASTERN, "00:00")).toBe("2026-10-22");
    expect(parseRollover("04:00")).toBe(240);
    expect(() => parseRollover("4am")).toThrow();
  });
});

describe("nextRolloverMs", () => {
  it("from Oct 31 23:00 EDT is Nov 1 04:00 EST (09:00Z)", () => {
    expect(nextRolloverMs(z("2026-10-31T23:00:00-04:00"), US_EASTERN)).toBe(z("2026-11-01T09:00:00Z"));
  });
  it("from 07:42 on Oct 22 is 04:00 on Oct 23; from 03:00 Oct 23 it is 04:00 the same morning", () => {
    expect(nextRolloverMs(z("2026-10-22T07:42:00-04:00"), US_EASTERN)).toBe(z("2026-10-23T04:00:00-04:00"));
    expect(nextRolloverMs(z("2026-10-23T03:00:00-04:00"), US_EASTERN)).toBe(z("2026-10-23T04:00:00-04:00"));
  });
  it("is strictly after the instant", () => {
    const at = z("2026-10-23T04:00:00-04:00");
    expect(nextRolloverMs(at, US_EASTERN)).toBe(z("2026-10-24T04:00:00-04:00"));
  });
});

describe("calendar helpers", () => {
  it("weekdays and day arithmetic", () => {
    expect(weekdayOf("2026-10-22")).toBe(4); // Thursday
    expect(weekdayOf("2026-10-19")).toBe(1); // Monday
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(daysBetween("2026-10-20", "2026-10-22")).toBe(2);
  });
  it("localParts and wallToUtc round-trip", () => {
    const p = localParts(z("2026-10-22T07:42:00-04:00"), US_EASTERN);
    expect(p).toEqual({ y: 2026, m: 10, d: 22, hh: 7, mm: 42, dow: 4 });
    expect(wallToUtc(Date.UTC(2026, 9, 22, 7, 42), US_EASTERN)).toBe(z("2026-10-22T07:42:00-04:00"));
    expect(wallToUtc(Date.UTC(2026, 10, 1, 12, 0), US_EASTERN)).toBe(z("2026-11-01T12:00:00-05:00"));
  });
});
