import { afterEach, expect, test, vi } from "vitest";

import { saveFile } from "./editorSave";
import { saveStatus } from "./savingStore";

afterEach(() => {
  vi.unstubAllGlobals();
  saveStatus.set("idle");
});

test("posts the file and reports idle when the server accepts the save", async () => {
  const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  await saveFile("posts/hello.md", "# Hello");

  expect(saveStatus.get()).toBe("idle");
  expect(fetchMock).toHaveBeenCalledWith("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filePath: "posts/hello.md",
      fileContent: "# Hello",
    }),
  });
});

test("rejects and reports error when the server returns a failure status", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 500 })),
  );

  await expect(saveFile("posts/hello.md", "# Hello")).rejects.toThrow();
  expect(saveStatus.get()).toBe("error");
});

test("rejects and reports error when the request itself fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );

  await expect(saveFile("posts/hello.md", "# Hello")).rejects.toThrow();
  expect(saveStatus.get()).toBe("error");
});
