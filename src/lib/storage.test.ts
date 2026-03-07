import { beforeEach, describe, expect, it } from "vitest";
import { appendResult, loadPersistedState, saveSettings } from "./storage";
import type { SessionResult } from "../types";

const buildResult = (index: number): SessionResult => ({
  mode: "classic",
  config: {
    mode: "classic",
    durationSeconds: 30,
    language: "english",
    promptId: `prompt-${index}`,
    punctuation: false,
    numbers: false,
  },
  startedAt: new Date(`2026-03-07T10:00:${`${index}`.padStart(2, "0")}.000Z`).toISOString(),
  endedAt: new Date(`2026-03-07T10:01:${`${index}`.padStart(2, "0")}.000Z`).toISOString(),
  grossWpm: 40 + index,
  netWpm: 35 + index,
  tpm: 200 + index,
  accuracy: 95,
  consistency: 90,
  correctChars: 100,
  incorrectChars: 5,
  extraChars: 0,
  skippedChars: 10,
  timeline: [],
});

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads defaults when storage is empty", () => {
    const state = loadPersistedState();
    expect(state.settings.mode).toBe("classic");
    expect(state.history).toHaveLength(0);
  });

  it("saves and reloads settings", () => {
    const base = loadPersistedState();
    saveSettings({
      ...base.settings,
      mode: "coder",
      language: "python",
    });

    const next = loadPersistedState();
    expect(next.settings.mode).toBe("coder");
    expect(next.settings.language).toBe("python");
  });

  it("retains at most 50 history items", () => {
    for (let index = 0; index < 55; index += 1) {
      appendResult(buildResult(index));
    }

    const state = loadPersistedState();
    expect(state.history).toHaveLength(50);
    expect(state.history[0]?.config.promptId).toBe("prompt-54");
  });
});
