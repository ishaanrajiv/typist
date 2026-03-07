import { describe, expect, it } from "vitest";
import type { KeystrokeEvent } from "../types";
import { generateLearnInsights } from "./insights";

describe("learn insights", () => {
  it("returns warmup guidance for short samples", () => {
    const insights = generateLearnInsights({
      prompt: "hello world",
      input: "hello",
      events: [{ expected: "h", actual: "h", timestampMs: 100, correct: true, corrected: false, index: 0 }],
      accuracy: 100,
      netWpm: 42,
    });

    expect(insights).toHaveLength(3);
    expect(insights[0].code).toContain("warmup");
  });

  it("produces at least three heuristic insights for richer input", () => {
    const events: KeystrokeEvent[] = [
      { expected: "a", actual: "a", timestampMs: 100, correct: true, corrected: false, index: 0 },
      { expected: "b", actual: "x", timestampMs: 250, correct: false, corrected: false, index: 1 },
      { expected: "c", actual: "c", timestampMs: 400, correct: true, corrected: false, index: 2 },
      { expected: "d", actual: "", timestampMs: 900, correct: false, corrected: true, index: 3 },
      { expected: "d", actual: "d", timestampMs: 1400, correct: true, corrected: false, index: 3 },
      { expected: "(", actual: "[", timestampMs: 2000, correct: false, corrected: false, index: 4 },
      { expected: ")", actual: ")", timestampMs: 2400, correct: true, corrected: false, index: 5 },
      { expected: " ", actual: " ", timestampMs: 2650, correct: true, corrected: false, index: 6 },
      { expected: "x", actual: "x", timestampMs: 2920, correct: true, corrected: false, index: 7 },
      { expected: "y", actual: "y", timestampMs: 3200, correct: true, corrected: false, index: 8 },
      { expected: "z", actual: "q", timestampMs: 3500, correct: false, corrected: false, index: 9 },
      { expected: ";", actual: ",", timestampMs: 5100, correct: false, corrected: false, index: 10 },
      { expected: "1", actual: "1", timestampMs: 5300, correct: true, corrected: false, index: 11 },
      { expected: "2", actual: "2", timestampMs: 5520, correct: true, corrected: false, index: 12 },
    ];

    const insights = generateLearnInsights({
      prompt: "abcd() xyz;12",
      input: "axcd[] xyz,12",
      events,
      accuracy: 82,
      netWpm: 28,
    });

    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.some((insight) => insight.code.includes("error-cluster"))).toBe(true);
  });
});
