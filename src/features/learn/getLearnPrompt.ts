import { LEARN_PASSAGES } from "../../content/learnPassages";

export const getLearnPrompt = (): { id: string; text: string } => {
  const text = LEARN_PASSAGES[Math.floor(Math.random() * LEARN_PASSAGES.length)];
  return {
    id: `learn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text,
  };
};
