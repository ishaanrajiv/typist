import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptCanvas } from "./PromptCanvas";

describe("PromptCanvas", () => {
  it("renders one textbox with overlaid prompt", () => {
    const { container } = render(
      <PromptCanvas
        mode="classic"
        prompt="steady focus"
        input=""
        phase="idle"
        fontScale={1}
        textareaRef={createRef<HTMLTextAreaElement>()}
        onInputChange={() => undefined}
        onInputKeyDown={() => undefined}
        onFocusRequest={() => undefined}
      />,
    );

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(container.querySelector(".prompt-overlay")).not.toBeNull();
  });

  it("does not append mid-text inserted characters as overflow", () => {
    const { container } = render(
      <PromptCanvas
        mode="classic"
        prompt="to process was iterate domain progress index learn for for"
        input="to process was iterate domain progress index index"
        phase="active"
        fontScale={1}
        textareaRef={createRef<HTMLTextAreaElement>()}
        onInputChange={() => undefined}
        onInputKeyDown={() => undefined}
        onFocusRequest={() => undefined}
      />,
    );

    expect(screen.queryByLabelText("extra typed characters")).toBeNull();
    expect(container.querySelectorAll(".prompt-char.is-incorrect").length).toBeGreaterThan(0);
  });

  it("shows trailing inserted characters as overflow", () => {
    render(
      <PromptCanvas
        mode="classic"
        prompt="hello"
        input="hellozz"
        phase="active"
        fontScale={1}
        textareaRef={createRef<HTMLTextAreaElement>()}
        onInputChange={() => undefined}
        onInputKeyDown={() => undefined}
        onFocusRequest={() => undefined}
      />,
    );

    expect(screen.getByLabelText("extra typed characters")).toHaveTextContent("zz");
  });

  it("renders each word in a non-splitting prompt token", () => {
    const { container } = render(
      <PromptCanvas
        mode="classic"
        prompt="never split words"
        input=""
        phase="idle"
        fontScale={1}
        textareaRef={createRef<HTMLTextAreaElement>()}
        onInputChange={() => undefined}
        onInputKeyDown={() => undefined}
        onFocusRequest={() => undefined}
      />,
    );

    const words = Array.from(container.querySelectorAll(".prompt-word")).map((element) =>
      element.textContent?.trim(),
    );
    expect(words).toEqual(["never", "split", "words"]);
  });

  it("preserves explicit newlines in coder prompts", () => {
    const { container } = render(
      <PromptCanvas
        mode="coder"
        prompt={"const a = 1;\nconst b = 2;"}
        input=""
        phase="idle"
        fontScale={1}
        textareaRef={createRef<HTMLTextAreaElement>()}
        onInputChange={() => undefined}
        onInputKeyDown={() => undefined}
        onFocusRequest={() => undefined}
      />,
    );

    expect(container.querySelectorAll("br").length).toBe(1);
  });
});
