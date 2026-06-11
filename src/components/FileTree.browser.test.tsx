import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { navigate } from "astro:transitions/client";
import { FileTree, type FileItem } from "./FileTree";

const items: FileItem[] = [
  {
    name: "notes",
    path: "/notes",
    type: "folder",
    children: [
      {
        name: "first.md",
        path: "/notes/first.md",
        type: "file",
      },
      {
        name: "draft.md",
        path: "/notes/draft.md",
        type: "file",
        disabled: true,
      },
    ],
  },
  {
    name: "index.md",
    path: "/index.md",
    type: "file",
  },
];

test("renders enabled files, folders, and create entries", async () => {
  const screen = await render(
    <FileTree items={items} activePath="/index.md" />,
  );

  await expect.element(screen.getByText("notes")).toBeVisible();
  await expect.element(screen.getByText("first.md")).toBeVisible();
  await expect.element(screen.getByText("index.md")).toBeVisible();
  expect(document.body.textContent).not.toContain("draft.md");

  expect(document.querySelectorAll("sl-tree-item[selected]").length).toBe(1);
  expect(
    document.querySelector("sl-tree-item[selected]")?.textContent,
  ).toContain("index.md");
  expect(screen.getByText("Create a file").elements()).toHaveLength(2);
});

test("navigates to a file when an enabled file item is clicked", async () => {
  vi.mocked(navigate).mockClear();
  const screen = await render(<FileTree items={items} activePath="" />);

  await screen.getByText("first.md").click();

  expect(navigate).toHaveBeenCalledWith("/notes/first.md");
});

test("opens a file with the keyboard", async () => {
  vi.mocked(navigate).mockClear();
  await render(<FileTree items={items} activePath="" />);

  // Focusing the tree focuses its first item (the "notes" folder);
  // arrow down to its first file, then select it.
  const tree = document.querySelector("sl-tree") as HTMLElement;
  tree.focus();

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{Enter}");

  expect(navigate).toHaveBeenCalledWith("/notes/first.md");
});

test("opens the create dialog for the selected folder", async () => {
  const screen = await render(<FileTree items={items} activePath="" />);

  const createEntries = screen.getByText("Create a file").elements();
  (createEntries[0] as HTMLElement).click();

  await expect.element(screen.getByText("Create a new file")).toBeVisible();
  await expect.element(screen.getByText("/notes/")).toBeVisible();

  const form = document.querySelector(
    'form[action="/create"][method="POST"]',
  ) as HTMLFormElement | null;
  const formData = new FormData(form!);
  expect(formData.get("folder-path")).toBe("/notes");
});
