import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("supports mode switching across classic, coder, and learn", async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByRole("textbox", { name: "Type the prompt text" });
    await user.type(textarea, "steady pace");
    expect(textarea).toHaveValue("steady pace");

    await user.click(screen.getByRole("tab", { name: "Coder" }));
    expect(screen.getByText("Language")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Learn" }));
    const submitButton = screen.getByRole("button", { name: "submit report" });
    expect(submitButton).toBeDisabled();

    const learnTextarea = screen.getByRole("textbox", { name: "Type the prompt text" });
    await user.type(learnTextarea, "observed pause pattern");
    expect(submitButton).toBeEnabled();
  });

  it("auto-finishes learn when input fully matches prompt", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("tab", { name: "Learn" }));

    const promptText = container.querySelector(".prompt-overlay")?.textContent ?? "";
    const textarea = screen.getByRole("textbox", { name: "Type the prompt text" });

    fireEvent.change(textarea, {
      target: {
        value: promptText,
      },
    });

    expect(await screen.findByRole("heading", { name: "Session Report" })).toBeInTheDocument();
  });
});
