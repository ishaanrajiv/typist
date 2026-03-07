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
  it("computes live metrics with strict keystroke accuracy", () => {
    const events = diffInputEvents("", "hezlo!", "hello", 0);
    const metrics = calculateLiveMetrics("hello", "hezlo!", 60_000, events);

    expect(metrics.correctChars).toBe(4);
    expect(metrics.incorrectChars).toBe(1);
    expect(metrics.extraChars).toBe(1);
    expect(metrics.skippedChars).toBe(0);
    expect(metrics.correctKeystrokes).toBe(4);
    expect(metrics.wrongKeystrokes).toBe(2);
    expect(metrics.backspaceCount).toBe(0);
    expect(metrics.accuracy).toBeCloseTo(66.67, 2);
    expect(metrics.netWpm).toBeLessThan(metrics.grossWpm);
  });

  it("builds input events for additions and deletions", () => {
    const events = diffInputEvents("hello", "hel", "hello world", 500);

    expect(events).toHaveLength(2);
    expect(events[0].corrected).toBe(true);
    expect(events[1].corrected).toBe(true);
  });

  it("penalizes backspaces even when final text is correct", () => {
    const events: KeystrokeEvent[] = [
      { expected: "a", actual: "a", timestampMs: 100, correct: true, corrected: false, index: 0 },
      { expected: "b", actual: "x", timestampMs: 200, correct: false, corrected: false, index: 1 },
      { expected: "b", actual: "", timestampMs: 300, correct: false, corrected: true, index: 1 },
      { expected: "b", actual: "b", timestampMs: 400, correct: true, corrected: false, index: 1 },
    ];

    const metrics = calculateLiveMetrics("ab", "ab", 60_000, events);

    expect(metrics.correctChars).toBe(2);
    expect(metrics.correctKeystrokes).toBe(2);
    expect(metrics.wrongKeystrokes).toBe(1);
    expect(metrics.backspaceCount).toBe(1);
    expect(metrics.accuracy).toBeCloseTo(57.14, 2);
  });

  it("applies half-penalty for repeated backspaces", () => {
    const events: KeystrokeEvent[] = [
      { expected: "a", actual: "a", timestampMs: 100, correct: true, corrected: false, index: 0 },
      { expected: "a", actual: "", timestampMs: 200, correct: false, corrected: true, index: 0 },
      { expected: "a", actual: "a", timestampMs: 300, correct: true, corrected: false, index: 0 },
      { expected: "a", actual: "", timestampMs: 400, correct: false, corrected: true, index: 0 },
      { expected: "a", actual: "a", timestampMs: 500, correct: true, corrected: false, index: 0 },
    ];

    const metrics = calculateLiveMetrics("a", "a", 60_000, events);

    expect(metrics.correctKeystrokes).toBe(3);
    expect(metrics.wrongKeystrokes).toBe(0);
    expect(metrics.backspaceCount).toBe(2);
    expect(metrics.accuracy).toBeCloseTo(75, 2);
  });

  it("keeps clean runs at 100% accuracy", () => {
    const events = diffInputEvents("", "hello", "hello", 0);
    const metrics = calculateLiveMetrics("hello", "hello", 60_000, events);

    expect(metrics.correctKeystrokes).toBe(5);
    expect(metrics.wrongKeystrokes).toBe(0);
    expect(metrics.backspaceCount).toBe(0);
    expect(metrics.accuracy).toBe(100);
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
    expect(result.accuracy).toBeCloseTo(66.67, 2);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("uses event-driven accuracy as the source of truth", () => {
    const events: KeystrokeEvent[] = [
      { expected: "a", actual: "x", timestampMs: 100, correct: false, corrected: false, index: 0 },
      { expected: "a", actual: "", timestampMs: 120, correct: false, corrected: true, index: 0 },
      { expected: "a", actual: "a", timestampMs: 140, correct: true, corrected: false, index: 0 },
    ];

    const metrics = calculateLiveMetrics("a", "a", 60_000, events);
    expect(metrics.correctChars).toBe(1);
    expect(metrics.accuracy).toBeLessThan(100);
    expect(metrics.accuracy).toBeCloseTo(40, 2);
  });

  it("does not cascade errors after a single inserted character", () => {
    const prompt =
      "was result with context and daily was it calm daily in time speed practice with p";
    const input =
      "was result with context and daily was it calm daily in time speed paractice with";

    const metrics = calculateLiveMetrics(prompt, input, 60_000, []);

    expect(metrics.incorrectChars).toBe(0);
    expect(metrics.extraChars).toBe(1);
    expect(metrics.skippedChars).toBe(2);
    expect(metrics.correctChars).toBe(prompt.length - metrics.skippedChars);
  });
});
