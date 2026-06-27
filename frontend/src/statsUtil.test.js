import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { avgScore, computeStats, dayStreak } from "./statsUtil";

describe("avgScore", () => {
  it("averages the score values", () => {
    expect(
      avgScore({ clarity: 8, pacing: 6, structure: 7, confidence: 9 })
    ).toBe(7.5);
  });

  it("returns 0 for empty or missing scores", () => {
    expect(avgScore({})).toBe(0);
    expect(avgScore(undefined)).toBe(0);
  });
});

describe("computeStats", () => {
  it("returns zeros for empty history", () => {
    const s = computeStats([]);
    expect(s.total).toBe(0);
    expect(s.series).toEqual([]);
  });

  it("computes totals, best, delta, avg WPM, and series", () => {
    const attempts = [
      {
        date: "2026-06-20T10:00:00Z",
        scores: { clarity: 4, pacing: 4, structure: 4, confidence: 4 },
        wpm: 100,
      },
      {
        date: "2026-06-21T10:00:00Z",
        scores: { clarity: 8, pacing: 8, structure: 8, confidence: 8 },
        wpm: 140,
      },
    ];
    const s = computeStats(attempts);
    expect(s.total).toBe(2);
    expect(s.bestAvg).toBe(8);
    expect(s.latestAvg).toBe(8);
    expect(s.delta).toBe(4); // 8 - 4
    expect(s.avgWpm).toBe(120);
    expect(s.series).toHaveLength(2);
  });
});

describe("dayStreak", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts consecutive days ending today", () => {
    vi.setSystemTime(new Date(2026, 5, 26, 12)); // local 2026-06-26
    const attempts = [
      { date: new Date(2026, 5, 24, 9).toISOString() },
      { date: new Date(2026, 5, 25, 9).toISOString() },
      { date: new Date(2026, 5, 26, 9).toISOString() },
    ];
    expect(dayStreak(attempts)).toBe(3);
  });

  it("breaks the streak on a gap", () => {
    vi.setSystemTime(new Date(2026, 5, 26, 12));
    const attempts = [
      { date: new Date(2026, 5, 22, 9).toISOString() }, // gap
      { date: new Date(2026, 5, 25, 9).toISOString() },
      { date: new Date(2026, 5, 26, 9).toISOString() },
    ];
    expect(dayStreak(attempts)).toBe(2);
  });

  it("is 0 with no attempts", () => {
    vi.setSystemTime(new Date(2026, 5, 26));
    expect(dayStreak([])).toBe(0);
  });
});
