import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("supports mode switching and learn submission flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByPlaceholderText("Start typing...");
    await user.type(textarea, "steady pace");
    expect(textarea).toHaveValue("steady pace");

    await user.click(screen.getByRole("tab", { name: "Coder" }));
    expect(screen.getByText("Language")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Learn" }));
    const learnTextarea = screen.getByPlaceholderText("Start typing...");
    await user.type(learnTextarea, "observed pause pattern");
    expect(screen.getByRole("button", { name: "submit report" })).toBeEnabled();
  });
});
