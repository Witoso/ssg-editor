import { afterEach, expect, test } from "vitest";
import { render } from "vitest-browser-react";

import { SavingStatus } from "./SavingStatus";
import { saveStatus } from "./savingStore";

afterEach(() => {
  saveStatus.set("idle");
});

test("shows the saved state by default and announces changes politely", async () => {
  const screen = await render(<SavingStatus />);

  await expect.element(screen.getByText("Saved")).toBeInTheDocument();

  const liveRegion = document.querySelector('[aria-live="polite"]');
  expect(liveRegion).not.toBeNull();
});

test("shows the saving state while a save is pending", async () => {
  const screen = await render(<SavingStatus />);

  saveStatus.set("saving");

  await expect.element(screen.getByText("Saving…")).toBeInTheDocument();
});

test("shows a distinct error state when saving fails", async () => {
  const screen = await render(<SavingStatus />);

  saveStatus.set("error");

  await expect
    .element(screen.getByText("Save failed — retrying"))
    .toBeInTheDocument();
});
