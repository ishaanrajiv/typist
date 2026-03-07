import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
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
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocusRequest: () => void;
};

type PromptToken =
  | {
      type: "word" | "space";
      text: string;
      start: number;
    }
  | {
      type: "newline";
      start: number;
    };

const toVisibleCharacter = (char: string): string => {
  if (char === "\t") {
    return "    ";
  }
  return char;
};

const buildPromptTokens = (promptChars: string[]): PromptToken[] => {
  const tokens: PromptToken[] = [];
  let index = 0;

  while (index < promptChars.length) {
    const current = promptChars[index];
    if (current === "\n") {
      tokens.push({
        type: "newline",
        start: index,
      });
      index += 1;
      continue;
    }

    const isWhitespace = /\s/.test(current);
    const start = index;
    const chars: string[] = [];
    while (index < promptChars.length) {
      const candidate = promptChars[index];
      if (candidate === "\n") {
        break;
      }
      if (/\s/.test(candidate) !== isWhitespace) {
        break;
      }
      chars.push(candidate);
      index += 1;
    }

    tokens.push({
      type: isWhitespace ? "space" : "word",
      text: chars.join(""),
      start,
    });
  }

  return tokens;
};

export const PromptCanvas = ({
  mode,
  prompt,
  input,
  phase,
  fontScale,
  textareaRef,
  onInputChange,
  onInputKeyDown,
  onFocusRequest,
}: PromptCanvasProps) => {
  const stageRef = useRef<HTMLLabelElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const promptChars = Array.from(prompt);
  const promptTokens = buildPromptTokens(promptChars);
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

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    const stage = stageRef.current;
    if (!textarea || !stage) {
      return;
    }

    const minHeight = Number.parseFloat(window.getComputedStyle(textarea).minHeight) || 0;
    textarea.style.height = "0px";
    const typedHeight = textarea.scrollHeight;
    const promptHeight = overlayRef.current?.scrollHeight ?? 0;
    const nextHeight = Math.max(minHeight, typedHeight, promptHeight);
    textarea.style.height = `${nextHeight}px`;
    stage.style.height = `${nextHeight}px`;
  }, [textareaRef]);

  useEffect(() => {
    syncHeight();
  }, [fontScale, input, prompt, syncHeight]);

  useEffect(() => {
    const onResize = () => {
      syncHeight();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [syncHeight]);

  return (
    <section className="prompt-shell" onClick={onFocusRequest} aria-label="Typing prompt">
      <div className="prompt-meta">
        <span>{mode}</span>
        <span>{phase === "active" ? "active" : phase === "finished" ? "completed" : "ready"}</span>
      </div>
      <label ref={stageRef} className="typing-stage" style={{ fontSize: `${(fontScale * 1.2).toFixed(2)}rem` }}>
        <span className="visually-hidden">Type the prompt text</span>
        <div ref={overlayRef} className="prompt-text prompt-overlay" aria-hidden="true">
          {promptTokens.map((token) => {
            if (token.type === "newline") {
              return <br key={`line-${token.start}`} />;
            }

            const rendered = Array.from(token.text).map((char, offset) => {
              const promptIndex = token.start + offset;
              const statusClass = promptStatuses[promptIndex] ?? "";
              return (
                <span className={`prompt-char ${statusClass}`} key={`${token.start}-${offset}`}>
                  {toVisibleCharacter(char)}
                </span>
              );
            });

            if (token.type === "word") {
              return (
                <span className="prompt-word" key={`word-${token.start}`}>
                  {rendered}
                </span>
              );
            }

            return (
              <span className="prompt-space" key={`space-${token.start}`}>
                {rendered}
              </span>
            );
          })}
          {overflow.length > 0 && (
            <span className="prompt-overflow" aria-label="extra typed characters">
              {overflow}
            </span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className={`typing-input typing-input-overlay ${phase === "finished" ? "is-finished" : ""}`}
          value={input}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          placeholder={phase === "finished" ? "Start a new round to continue." : "Start typing..."}
          spellCheck={false}
        />
      </label>
    </section>
  );
};
