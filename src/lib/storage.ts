import type { AppSettings, PersistedState, SessionResult, StreakMeta } from "../types";

const STORAGE_KEY = "typist:v1";

export const DEFAULT_SETTINGS: AppSettings = {
  mode: "classic",
  classicDuration: 30,
  coderDuration: 60,
  language: "javascript",
  punctuation: false,
  numbers: false,
  fontScale: 1,
  sound: false,
};

export const DEFAULT_STREAK: StreakMeta = {
  currentStreak: 0,
  bestStreak: 0,
  lastPracticeDate: null,
};

const emptyState = (): PersistedState => ({
  version: 1,
  settings: DEFAULT_SETTINGS,
  history: [],
  streak: DEFAULT_STREAK,
});

const canUseStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const localDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayDistance = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
};

export const loadPersistedState = (): PersistedState => {
  if (!canUseStorage()) {
    return emptyState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      version: 1,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 50) : [],
      streak: {
        ...DEFAULT_STREAK,
        ...(parsed.streak ?? {}),
      },
    };
  } catch {
    return emptyState();
  }
};

const savePersistedState = (nextState: PersistedState): void => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
};

export const saveSettings = (settings: AppSettings): void => {
  const current = loadPersistedState();
  savePersistedState({
    ...current,
    settings,
  });
};

const updateStreak = (streak: StreakMeta): StreakMeta => {
  const today = localDateString();
  if (!streak.lastPracticeDate) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(streak.bestStreak, 1),
      lastPracticeDate: today,
    };
  }

  const distance = dayDistance(streak.lastPracticeDate, today);
  if (distance <= 0) {
    return {
      ...streak,
      lastPracticeDate: today,
    };
  }

  if (distance === 1) {
    const currentStreak = streak.currentStreak + 1;
    return {
      currentStreak,
      bestStreak: Math.max(streak.bestStreak, currentStreak),
      lastPracticeDate: today,
    };
  }

  return {
    currentStreak: 1,
    bestStreak: Math.max(streak.bestStreak, 1),
    lastPracticeDate: today,
  };
};

export const appendResult = (result: SessionResult): PersistedState => {
  const current = loadPersistedState();
  const nextState: PersistedState = {
    ...current,
    history: [result, ...current.history].slice(0, 50),
    streak: updateStreak(current.streak),
  };
  savePersistedState(nextState);
  return nextState;
};
