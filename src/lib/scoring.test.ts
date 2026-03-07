import { describe, expect, it } from "vitest";
import type { KeystrokeEvent } from "../types";
import {
  buildPaceTimeline,
  buildSessionResult,
  calculateConsistency,
  calculateLiveMetrics,
  diffInputEvents,
} from "./scoring";

describe("scoring", () => {
  it("computes live metrics with penalties", () => {
    const metrics = calculateLiveMetrics("hello", "hezlo!", 60_000);

    expect(metrics.correctChars).toBe(4);
    expect(metrics.incorrectChars).toBe(1);
    expect(metrics.extraChars).toBe(1);
    expect(metrics.skippedChars).toBe(0);
    expect(metrics.accuracy).toBeCloseTo(66.67, 2);
    expect(metrics.netWpm).toBeLessThan(metrics.grossWpm);
  });

  it("builds input events for additions and deletions", () => {
    const events = diffInputEvents("hello", "hel", "hello world", 500);

    expect(events).toHaveLength(2);
    expect(events[0].corrected).toBe(true);
    expect(events[1].corrected).toBe(true);
  });

  it("creates a timeline and session result", () => {
    const events: KeystrokeEvent[] = [
      { expected: "a", actual: "a", timestampMs: 200, correct: true, corrected: false, index: 0 },
      { expected: "b", actual: "b", timestampMs: 700, correct: true, corrected: false, index: 1 },
      { expected: "c", actual: "x", timestampMs: 1200, correct: false, corrected: false, index: 2 },
    ];

    const timeline = buildPaceTimeline(events, 6000, 3000, 1000);
    expect(timeline.length).toBeGreaterThan(0);
    expect(calculateConsistency(timeline)).toBeGreaterThanOrEqual(0);

    const result = buildSessionResult({
      mode: "classic",
      config: {
        mode: "classic",
        durationSeconds: 30,
        language: "english",
        promptId: "classic-1",
        punctuation: false,
        numbers: false,
      },
      prompt: "abc",
      input: "abx",
      events,
      elapsedMs: 3000,
      startedAt: new Date("2026-03-07T10:00:00.000Z").toISOString(),
      endedAt: new Date("2026-03-07T10:00:03.000Z").toISOString(),
    });

    expect(result.correctChars).toBe(2);
    expect(result.incorrectChars).toBe(1);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("does not cascade errors after a single inserted character", () => {
    const prompt =
      "was result with context and daily was it calm daily in time speed practice with p";
    const input =
      "was result with context and daily was it calm daily in time speed paractice with";

    const metrics = calculateLiveMetrics(prompt, input, 60_000);

    expect(metrics.incorrectChars).toBe(0);
    expect(metrics.extraChars).toBe(1);
    expect(metrics.skippedChars).toBe(2);
    expect(metrics.correctChars).toBe(prompt.length - metrics.skippedChars);
  });
});
