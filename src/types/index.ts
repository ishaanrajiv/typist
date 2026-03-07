export type AppMode = "classic" | "coder" | "learn";
export type Language = "english" | "python" | "javascript" | "c";
export type CodeLanguage = Exclude<Language, "english">;
export type SessionPhase = "idle" | "active" | "finished";
export type InsightSeverity = "low" | "medium" | "high";

export type SessionConfig = {
  mode: AppMode;
  durationSeconds?: 15 | 30 | 60 | 90 | 120;
  language?: Language;
  promptId: string;
  punctuation: boolean;
  numbers: boolean;
};

export type KeystrokeEvent = {
  expected: string;
  actual: string;
  timestampMs: number;
  correct: boolean;
  corrected: boolean;
  index: number;
};

export type PaceSample = {
  second: number;
  tpm: number;
  wpm: number;
};

export type Insight = {
  code: string;
  title: string;
  description: string;
  severity: InsightSeverity;
};

export type SessionResult = {
  mode: AppMode;
  config: SessionConfig;
  startedAt: string;
  endedAt: string;
  grossWpm: number;
  netWpm: number;
  tpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  skippedChars: number;
  symbolAccuracy?: number;
  identifierAccuracy?: number;
  whitespaceAccuracy?: number;
  timeline: PaceSample[];
  insights?: Insight[];
};

export type CodeDrillCategory =
  | "punctuation"
  | "control_flow"
  | "functions"
  | "arrays"
  | "strings";

export type CodeDrill = {
  id: string;
  language: CodeLanguage;
  category: CodeDrillCategory;
  content: string;
  difficulty: 1 | 2 | 3;
};

export type AppSettings = {
  mode: AppMode;
  classicDuration: 15 | 30 | 60 | 120;
  coderDuration: 30 | 60 | 90;
  language: CodeLanguage;
  punctuation: boolean;
  numbers: boolean;
  fontScale: number;
  sound: boolean;
};

export type StreakMeta = {
  currentStreak: number;
  bestStreak: number;
  lastPracticeDate: string | null;
};

export type PersistedState = {
  version: 1;
  settings: AppSettings;
  history: SessionResult[];
  streak: StreakMeta;
};
