import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

import { CreateDialog } from "./CreateDialog";

test("renders create dialog fields for the selected folder", async () => {
  const screen = await render(
    <CreateDialog
      isDialogOpen={true}
      setIsDialogOpen={() => {}}
      currentFolderPath="/notes"
    />,
  );

  await expect.element(screen.getByText("Create a new file")).toBeVisible();
  await expect.element(screen.getByText("/notes/")).toBeVisible();

  const form = document.querySelector(
    'form[action="/create"][method="POST"]',
  ) as HTMLFormElement | null;
  const filenameInput = screen.getByLabelText("File name");
  const submitButton = screen.getByText("Create", { exact: true });

  expect(form).not.toBeNull();
  await expect.element(filenameInput).toBeVisible();
  await expect.element(submitButton).toBeVisible();

  const formData = new FormData(form!);
  expect(formData.get("folder-path")).toBe("/notes");
});

test("normalizes spaces in the filename input", async () => {
  const screen = await render(
    <CreateDialog
      isDialogOpen={true}
      setIsDialogOpen={() => {}}
      currentFolderPath=""
    />,
  );

  const filenameInput = screen.getByLabelText("File name");

  await filenameInput.fill("my new file");
  await expect.element(filenameInput).toHaveValue("my-new-file");
});
