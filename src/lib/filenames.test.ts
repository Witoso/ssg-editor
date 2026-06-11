import { describe, expect, test } from "vitest";

import { getFolderSegments, isValidFilename } from "./filenames";

describe("isValidFilename", () => {
  test("accepts letters, numbers, underscores, and dashes", () => {
    expect(isValidFilename("my-post_01")).toBe(true);
  });

  test("rejects empty names and separators", () => {
    expect(isValidFilename("")).toBe(false);
    expect(isValidFilename("my post")).toBe(false);
    expect(isValidFilename("../escape")).toBe(false);
    expect(isValidFilename("a/b")).toBe(false);
  });
});

describe("getFolderSegments", () => {
  test("splits folder paths into segments", () => {
    expect(getFolderSegments("/posts/drafts")).toEqual(["posts", "drafts"]);
    expect(getFolderSegments("")).toEqual([]);
  });

  test("rejects traversal segments", () => {
    expect(getFolderSegments("../outside")).toBeNull();
    expect(getFolderSegments("posts/./drafts")).toBeNull();
  });
});
