import type {
  AppMode,
  Insight,
  KeystrokeEvent,
  PaceSample,
  SessionConfig,
  SessionResult,
} from "../types";
import { alignPromptInput } from "./alignment";

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

const toFixed = (value: number): number => Number(value.toFixed(2));

export type LiveMetrics = {
  grossWpm: number;
  netWpm: number;
  tpm: number;
  accuracy: number;
  backspaceCount: number;
  wrongKeystrokes: number;
  correctKeystrokes: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  skippedChars: number;
};

type CharacterStats = Pick<
  LiveMetrics,
  "correctChars" | "incorrectChars" | "extraChars" | "skippedChars"
>;

export const getCommonPrefixLength = (a: string, b: string): number => {
  const maxLength = Math.min(a.length, b.length);
  let index = 0;
  while (index < maxLength && a[index] === b[index]) {
    index += 1;
  }
  return index;
};

export const diffInputEvents = (
  previous: string,
  next: string,
  prompt: string,
  timestampMs: number,
): KeystrokeEvent[] => {
  const events: KeystrokeEvent[] = [];
  const commonPrefixLength = getCommonPrefixLength(previous, next);
  const removedCount = previous.length - commonPrefixLength;
  const added = next.slice(commonPrefixLength);

  for (let offset = 0; offset < removedCount; offset += 1) {
    const index = previous.length - 1 - offset;
    events.push({
      expected: prompt[index] ?? "",
      actual: "",
      timestampMs: timestampMs + offset,
      correct: false,
      corrected: true,
      index,
    });
  }

  for (let offset = 0; offset < added.length; offset += 1) {
    const index = commonPrefixLength + offset;
    const actual = added[offset];
    const expected = prompt[index] ?? "";
    events.push({
      expected,
      actual,
      timestampMs: timestampMs + removedCount + offset,
      correct: expected === actual,
      corrected: false,
      index,
    });
  }

  return events;
};

const evaluateCharacters = (prompt: string, input: string): CharacterStats => {
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let skippedChars = 0;
  const operations = alignPromptInput(prompt, input);

  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (operation.type === "match") {
      correctChars += 1;
      continue;
    }
    if (operation.type === "substitute") {
      incorrectChars += 1;
      continue;
    }
    if (operation.type === "insert") {
      extraChars += 1;
      continue;
    }
    skippedChars += 1;
  }

  return {
    correctChars,
    incorrectChars,
    extraChars,
    skippedChars,
  };
};

const BACKSPACE_PENALTY_WEIGHT = 0.5;

const evaluateKeystrokes = (events: KeystrokeEvent[]): {
  backspaceCount: number;
  wrongKeystrokes: number;
  correctKeystrokes: number;
  accuracy: number;
} => {
  let backspaceCount = 0;
  let wrongKeystrokes = 0;
  let correctKeystrokes = 0;

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.corrected) {
      backspaceCount += 1;
      continue;
    }
    if (event.correct) {
      correctKeystrokes += 1;
      continue;
    }
    wrongKeystrokes += 1;
  }

  const weightedErrors = wrongKeystrokes + backspaceCount * BACKSPACE_PENALTY_WEIGHT;
  const denominator = correctKeystrokes + weightedErrors;
  const accuracy = denominator === 0 ? 100 : (correctKeystrokes / denominator) * 100;

  return {
    backspaceCount,
    wrongKeystrokes,
    correctKeystrokes,
    accuracy,
  };
};

export const calculateLiveMetrics = (
  prompt: string,
  input: string,
  elapsedMs: number,
  events: KeystrokeEvent[] = [],
): LiveMetrics => {
  const characterStats = evaluateCharacters(prompt, input);
  const keystrokeStats = evaluateKeystrokes(events);
  const typedChars = characterStats.correctChars + characterStats.incorrectChars + characterStats.extraChars;
  const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
  const grossWpm = (typedChars / 5) / minutes;
  const errorPenalty = ((characterStats.incorrectChars + characterStats.extraChars) / 5) / minutes;
  const netWpm = Math.max(0, grossWpm - errorPenalty);
  const accuracy = keystrokeStats.accuracy;
  const tpm = typedChars / minutes;

  return {
    ...keystrokeStats,
    ...characterStats,
    grossWpm: toFixed(grossWpm),
    netWpm: toFixed(netWpm),
    tpm: toFixed(tpm),
    accuracy: toFixed(accuracy),
  };
};

export const buildPaceTimeline = (
  events: KeystrokeEvent[],
  totalElapsedMs: number,
  windowMs = 5000,
  stepMs = 1000,
): PaceSample[] => {
  const addedEvents = events.filter((event) => !event.corrected && event.actual.length > 0);
  const safeElapsed = Math.max(totalElapsedMs, stepMs);
  const timeline: PaceSample[] = [];

  for (let sampleTime = stepMs; sampleTime <= safeElapsed; sampleTime += stepMs) {
    const minTime = Math.max(0, sampleTime - windowMs);
    const chars = addedEvents.reduce((count, event) => {
      if (event.timestampMs >= minTime && event.timestampMs <= sampleTime) {
        return count + event.actual.length;
      }
      return count;
    }, 0);

    const minutes = windowMs / 60000;
    const tpm = chars / minutes;

    timeline.push({
      second: Math.round(sampleTime / 1000),
      tpm: toFixed(tpm),
      wpm: toFixed(tpm / 5),
    });
  }

  return timeline;
};

export const calculateConsistency = (timeline: PaceSample[]): number => {
  if (timeline.length <= 1) {
    return 100;
  }

  const wpmValues = timeline.map((sample) => sample.wpm);
  const mean = wpmValues.reduce((sum, value) => sum + value, 0) / wpmValues.length;

  if (mean <= 0) {
    return 0;
  }

  const variance =
    wpmValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / wpmValues.length;
  const stdev = Math.sqrt(variance);
  const coefficient = stdev / mean;

  return toFixed(clamp(100 - coefficient * 100, 0, 100));
};

type ClassBucket = {
  total: number;
  correct: number;
};

const createBucket = (): ClassBucket => ({
  total: 0,
  correct: 0,
});

export const classifyCharacterClass = (
  char: string,
): "symbol" | "identifier" | "whitespace" | "other" => {
  if (!char) {
    return "other";
  }
  if (/\s/.test(char)) {
    return "whitespace";
  }
  if (/[A-Za-z0-9_]/.test(char)) {
    return "identifier";
  }
  if (/[^A-Za-z0-9_\s]/.test(char)) {
    return "symbol";
  }
  return "other";
};

const computeCoderAccuracy = (prompt: string, input: string): {
  symbolAccuracy: number;
  identifierAccuracy: number;
  whitespaceAccuracy: number;
} => {
  const symbol = createBucket();
  const identifier = createBucket();
  const whitespace = createBucket();
  const operations = alignPromptInput(prompt, input);
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (operation.promptIndex === null) {
      continue;
    }
    const className = classifyCharacterClass(operation.expected);
    const isCorrect = operation.type === "match";

    if (className === "symbol") {
      symbol.total += 1;
      if (isCorrect) {
        symbol.correct += 1;
      }
    }

    if (className === "identifier") {
      identifier.total += 1;
      if (isCorrect) {
        identifier.correct += 1;
      }
    }

    if (className === "whitespace") {
      whitespace.total += 1;
      if (isCorrect) {
        whitespace.correct += 1;
      }
    }
  }

  const toPercent = (bucket: ClassBucket): number =>
    bucket.total === 0 ? 100 : toFixed((bucket.correct / bucket.total) * 100);

  return {
    symbolAccuracy: toPercent(symbol),
    identifierAccuracy: toPercent(identifier),
    whitespaceAccuracy: toPercent(whitespace),
  };
};

export const buildSessionResult = (payload: {
  mode: AppMode;
  config: SessionConfig;
  prompt: string;
  input: string;
  events: KeystrokeEvent[];
  elapsedMs: number;
  startedAt: string;
  endedAt: string;
  insights?: Insight[];
}): SessionResult => {
  const live = calculateLiveMetrics(payload.prompt, payload.input, payload.elapsedMs, payload.events);
  const timeline = buildPaceTimeline(payload.events, payload.elapsedMs);
  const consistency = calculateConsistency(timeline);

  const result: SessionResult = {
    mode: payload.mode,
    config: payload.config,
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    grossWpm: live.grossWpm,
    netWpm: live.netWpm,
    tpm: live.tpm,
    accuracy: live.accuracy,
    consistency,
    correctChars: live.correctChars,
    incorrectChars: live.incorrectChars,
    extraChars: live.extraChars,
    skippedChars: live.skippedChars,
    timeline,
    insights: payload.insights,
  };

  if (payload.mode === "coder") {
    const accuracy = computeCoderAccuracy(payload.prompt, payload.input);
    result.symbolAccuracy = accuracy.symbolAccuracy;
    result.identifierAccuracy = accuracy.identifierAccuracy;
    result.whitespaceAccuracy = accuracy.whitespaceAccuracy;
  }

  return result;
};
