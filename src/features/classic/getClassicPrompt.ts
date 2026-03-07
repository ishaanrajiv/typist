import { CLASSIC_WORDS } from "../../content/classicWords";

const PUNCTUATION = [",", ".", ";", ":", "!", "?"];

const TARGET_LENGTH_BY_DURATION: Record<15 | 30 | 60 | 120, number> = {
  15: 180,
  30: 340,
  60: 680,
  120: 1320,
};

const weightedWords = CLASSIC_WORDS.flatMap((entry) =>
  Array.from({ length: entry.weight }, () => entry.word),
);

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickWord = (): string =>
  weightedWords[Math.floor(Math.random() * weightedWords.length)] ?? "type";

export const getClassicPrompt = (options: {
  durationSeconds: 15 | 30 | 60 | 120;
  punctuation: boolean;
  numbers: boolean;
}): { id: string; text: string } => {
  const targetLength = TARGET_LENGTH_BY_DURATION[options.durationSeconds];
  const words: string[] = [];
  let currentLength = 0;

  while (currentLength < targetLength) {
    let token = pickWord();

    if (options.numbers && Math.random() < 0.07) {
      token = `${randomInt(2, 9999)}`;
    }

    if (options.punctuation && Math.random() < 0.2) {
      token = `${token}${PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)]}`;
    }

    words.push(token);
    currentLength += token.length + 1;
  }

  return {
    id: `classic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text: words.join(" "),
  };
};
