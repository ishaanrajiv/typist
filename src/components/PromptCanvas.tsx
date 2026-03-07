import { type ChangeEvent, type RefObject } from "react";
import type { AppMode, SessionPhase } from "../types";
import { alignPromptInput } from "../lib/alignment";

type PromptCanvasProps = {
  mode: AppMode;
  prompt: string;
  input: string;
  phase: SessionPhase;
  fontScale: number;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onFocusRequest: () => void;
};

const toVisibleCharacter = (char: string): string => {
  if (char === " ") {
    return "\u00a0";
  }
  return char;
};

export const PromptCanvas = ({
  mode,
  prompt,
  input,
  phase,
  fontScale,
  textareaRef,
  onInputChange,
  onFocusRequest,
}: PromptCanvasProps) => {
  const promptChars = Array.from(prompt);
  const alignment = alignPromptInput(prompt, input, "input");
  const promptStatuses = Array.from({ length: promptChars.length }, () => "");
  const trailingOverflowChars: string[] = [];
  const hasFutureInputOp = Array.from({ length: alignment.length }, () => false);
  let seenInputAhead = false;

  for (let index = alignment.length - 1; index >= 0; index -= 1) {
    hasFutureInputOp[index] = seenInputAhead;
    if (alignment[index].inputIndex !== null) {
      seenInputAhead = true;
    }
  }

  for (let index = 0; index < alignment.length; index += 1) {
    const operation = alignment[index];
    if (operation.type === "insert") {
      const nextPromptOp = alignment
        .slice(index + 1)
        .find((candidate) => candidate.promptIndex !== null);
      if (nextPromptOp && promptStatuses[nextPromptOp.promptIndex] === "") {
        promptStatuses[nextPromptOp.promptIndex] = "is-incorrect";
      }
      continue;
    }

    if (operation.type === "match") {
      promptStatuses[operation.promptIndex] = "is-correct";
      continue;
    }

    if (operation.type === "substitute") {
      promptStatuses[operation.promptIndex] = "is-incorrect";
      continue;
    }

    if (hasFutureInputOp[index]) {
      promptStatuses[operation.promptIndex] = "is-incorrect";
    }
  }

  for (let index = alignment.length - 1; index >= 0; index -= 1) {
    const operation = alignment[index];
    if (operation.type !== "insert") {
      break;
    }
    trailingOverflowChars.push(operation.actual);
  }
  trailingOverflowChars.reverse();

  const currentIndex = promptStatuses.findIndex((status) => status === "");
  if (currentIndex >= 0 && phase !== "finished") {
    promptStatuses[currentIndex] = "is-current";
  }

  const overflow = trailingOverflowChars.join("");

  return (
    <section className="prompt-shell" onClick={onFocusRequest} aria-label="Typing prompt">
      <div className="prompt-meta">
        <span>{mode}</span>
        <span>{phase === "active" ? "active" : phase === "finished" ? "completed" : "ready"}</span>
      </div>
      <div className="prompt-text" style={{ fontSize: `${fontScale}em` }}>
        {promptChars.map((char, index) => {
          const statusClass = promptStatuses[index] ?? "";
          return (
            <span className={`prompt-char ${statusClass}`} key={`${char}-${index}`}>
              {toVisibleCharacter(char)}
            </span>
          );
        })}
        {overflow.length > 0 && (
          <span className="prompt-overflow" aria-label="extra typed characters">
            {overflow}
          </span>
        )}
      </div>

      <label className="input-wrap">
        <span className="visually-hidden">Type the prompt text</span>
        <textarea
          ref={textareaRef}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="typing-input"
          value={input}
          onChange={onInputChange}
          placeholder={phase === "finished" ? "Start a new round to continue." : "Start typing..."}
          spellCheck={false}
        />
      </label>
    </section>
  );
};
