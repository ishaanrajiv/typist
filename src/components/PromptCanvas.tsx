import { type ChangeEvent, type RefObject } from "react";
import type { AppMode, SessionPhase } from "../types";

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
  const inputChars = Array.from(input);
  const overflow = inputChars.slice(promptChars.length).join("");

  return (
    <section className="prompt-shell" onClick={onFocusRequest} aria-label="Typing prompt">
      <div className="prompt-meta">
        <span>{mode}</span>
        <span>{phase === "active" ? "active" : phase === "finished" ? "completed" : "ready"}</span>
      </div>
      <div className="prompt-text" style={{ fontSize: `${fontScale}em` }}>
        {promptChars.map((char, index) => {
          let statusClass = "";
          if (index < inputChars.length) {
            statusClass = inputChars[index] === char ? "is-correct" : "is-incorrect";
          } else if (index === inputChars.length && phase !== "finished") {
            statusClass = "is-current";
          }
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
