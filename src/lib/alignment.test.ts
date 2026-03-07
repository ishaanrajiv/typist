import { describe, expect, it } from "vitest";
import { alignPromptInput } from "./alignment";

describe("alignPromptInput", () => {
  it("keeps short in-progress input anchored to the prompt start", () => {
    const prompt = "process habit for careful build module from this buffer";
    const input = "proces";
    const ops = alignPromptInput(prompt, input, "input");

    const consumed = ops.filter(
      (op): op is Extract<typeof op, { inputIndex: number; promptIndex: number }> =>
        op.inputIndex !== null && op.promptIndex !== null,
    );

    expect(consumed).toHaveLength(input.length);
    expect(consumed.every((op, index) => op.inputIndex === index)).toBe(true);
    expect(Math.max(...consumed.map((op) => op.promptIndex - op.inputIndex))).toBeLessThanOrEqual(1);
  });

  it("does not align extra typed suffix deep into future prompt text in input mode", () => {
    const prompt =
      "to process was iterate domain progress index learn for for in system you of simple cursor";
    const input = "to process was iterate domain progress index index";
    const ops = alignPromptInput(prompt, input, "input");
    const mismatches = ops.filter((op) => op.type === "substitute");

    expect(mismatches.length).toBeLessThanOrEqual(6);
  });
});
