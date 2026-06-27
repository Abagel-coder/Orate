import { describe, it, expect } from "vitest";
import { computeMetrics } from "./metrics";

describe("computeMetrics", () => {
  it("computes WPM from word count and duration", () => {
    const { wpm, wordCount } = computeMetrics("one two three four five six", 60);
    expect(wordCount).toBe(6);
    expect(wpm).toBe(6); // 6 words over 1 minute
  });

  it("scales WPM by duration", () => {
    // 10 words in 30s -> 20 wpm
    const { wpm } = computeMetrics("a b c d e f g h i j", 30);
    expect(wpm).toBe(20);
  });

  it("counts multi-word fillers without double-counting components", () => {
    const { fillerWords } = computeMetrics(
      "you know I was like so um basically done",
      60
    );
    expect(fillerWords["you know"]).toBe(1);
    expect(fillerWords["like"]).toBe(1);
    expect(fillerWords["so"]).toBe(1);
    expect(fillerWords["um"]).toBe(1);
    expect(fillerWords["basically"]).toBe(1);
  });

  it("handles an empty transcript", () => {
    expect(computeMetrics("", 0)).toEqual({
      wpm: 0,
      wordCount: 0,
      fillerWords: {},
    });
  });

  it("never divides by zero", () => {
    expect(computeMetrics("hello world", 0).wpm).toBe(0);
  });
});
