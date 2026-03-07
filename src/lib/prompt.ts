import { getClassicPrompt } from "../features/classic/getClassicPrompt";
import { getCoderPrompt } from "../features/coder/getCoderPrompt";
import { getLearnPrompt } from "../features/learn/getLearnPrompt";
import type { AppSettings } from "../types";

export type PromptSettings = Pick<
  AppSettings,
  "mode" | "classicDuration" | "coderDuration" | "language" | "punctuation" | "numbers"
>;

export type PromptBundle = {
  id: string;
  text: string;
};

export const createPromptFromSettings = (settings: PromptSettings): PromptBundle => {
  if (settings.mode === "classic") {
    return getClassicPrompt({
      durationSeconds: settings.classicDuration,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
    });
  }

  if (settings.mode === "coder") {
    return getCoderPrompt({
      durationSeconds: settings.coderDuration,
      language: settings.language,
    });
  }

  return getLearnPrompt();
};

export const getDurationForMode = (settings: PromptSettings): number | undefined => {
  if (settings.mode === "classic") {
    return settings.classicDuration;
  }

  if (settings.mode === "coder") {
    return settings.coderDuration;
  }

  return undefined;
};
