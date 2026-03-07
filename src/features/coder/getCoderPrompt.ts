import { CODE_DRILLS } from "../../content/codeDrills";
import type { CodeLanguage } from "../../types";

const TARGET_LENGTH_BY_DURATION: Record<30 | 60 | 90, number> = {
  30: 240,
  60: 420,
  90: 600,
};

const shuffled = <T,>(items: T[]): T[] => {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
};

export const getCoderPrompt = (options: {
  durationSeconds: 30 | 60 | 90;
  language: CodeLanguage;
}): { id: string; text: string } => {
  const targetLength = TARGET_LENGTH_BY_DURATION[options.durationSeconds];
  const candidates = shuffled(
    CODE_DRILLS.filter((drill) => drill.language === options.language),
  );

  let index = 0;
  let currentLength = 0;
  const parts: string[] = [];

  while (currentLength < targetLength) {
    const next = candidates[index % candidates.length];
    parts.push(next.content);
    currentLength += next.content.length + 1;
    index += 1;
  }

  return {
    id: `coder-${options.language}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text: parts.join("\n"),
  };
};
