import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptCanvas } from "./PromptCanvas";

describe("PromptCanvas", () => {
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
        onFocusRequest={() => undefined}
      />,
    );

    expect(screen.getByLabelText("extra typed characters")).toHaveTextContent("zz");
  });
});
