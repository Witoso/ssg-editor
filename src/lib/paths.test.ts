import path from "path";
import { describe, expect, test } from "vitest";

import { resolveMarkdownFilePath, resolveTargetFilePath } from "./paths";

describe("resolveTargetFilePath", () => {
  const targetPath = path.join(path.sep, "tmp", "site");

  test("allows files inside the target path", () => {
    expect(resolveTargetFilePath(targetPath, "posts/hello.md")).toBe(
      path.join(targetPath, "posts", "hello.md"),
    );
  });

  test("allows the target directory itself", () => {
    expect(resolveTargetFilePath(targetPath, "")).toBe(targetPath);
  });

  test("rejects parent directory traversal", () => {
    expect(resolveTargetFilePath(targetPath, "../outside.md")).toBeNull();
  });

  test("rejects absolute paths outside the target path", () => {
    expect(
      resolveTargetFilePath(
        targetPath,
        path.join(path.sep, "tmp", "outside.md"),
      ),
    ).toBeNull();
  });

  test("does not confuse sibling directories with the target path", () => {
    expect(
      resolveTargetFilePath(
        targetPath,
        path.join(path.sep, "tmp", "site-copy", "post.md"),
      ),
    ).toBeNull();
  });
});

describe("resolveMarkdownFilePath", () => {
  const targetPath = path.join(path.sep, "tmp", "site");

  test("allows markdown files inside the target path", () => {
    expect(resolveMarkdownFilePath(targetPath, "posts/hello.md")).toBe(
      path.join(targetPath, "posts", "hello.md"),
    );
  });

  test("rejects non-markdown files", () => {
    expect(resolveMarkdownFilePath(targetPath, "posts/hello.txt")).toBeNull();
  });

  test("rejects markdown files outside the target path", () => {
    expect(resolveMarkdownFilePath(targetPath, "../outside.md")).toBeNull();
  });
});
