import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getFiles } from "./files";

describe("getFiles", () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-files-"));
  });

  afterEach(async () => {
    await fs.rm(rootPath, { recursive: true, force: true });
  });

  test("throws when the root path does not exist", async () => {
    await expect(getFiles(path.join(rootPath, "missing"))).rejects.toThrow(
      `Path does not exist: ${path.join(rootPath, "missing")}`,
    );
  });

  test("includes markdown files at the root", async () => {
    await fs.writeFile(path.join(rootPath, "index.md"), "# Home");

    await expect(getFiles(rootPath)).resolves.toEqual([
      {
        name: "index.md",
        path: "/index.md",
        type: "file",
      },
    ]);
  });

  test("excludes non-markdown files", async () => {
    await fs.writeFile(path.join(rootPath, "index.md"), "# Home");
    await fs.writeFile(path.join(rootPath, "notes.txt"), "Notes");

    await expect(getFiles(rootPath)).resolves.toEqual([
      {
        name: "index.md",
        path: "/index.md",
        type: "file",
      },
    ]);
  });

  test("includes folders that contain markdown descendants", async () => {
    await fs.mkdir(path.join(rootPath, "posts", "drafts"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(rootPath, "posts", "drafts", "one.md"),
      "# One",
    );

    await expect(getFiles(rootPath)).resolves.toEqual([
      {
        name: "posts",
        path: "/posts",
        type: "folder",
        children: [
          {
            name: "drafts",
            path: "/posts/drafts",
            type: "folder",
            children: [
              {
                name: "one.md",
                path: "/posts/drafts/one.md",
                type: "file",
              },
            ],
          },
        ],
      },
    ]);
  });

  test("excludes empty folders", async () => {
    await fs.mkdir(path.join(rootPath, "empty"));

    await expect(getFiles(rootPath)).resolves.toEqual([]);
  });

  test("sorts folders before files, each alphabetically", async () => {
    await fs.writeFile(path.join(rootPath, "zebra.md"), "# Z");
    await fs.writeFile(path.join(rootPath, "alpha.md"), "# A");
    await fs.mkdir(path.join(rootPath, "second"));
    await fs.writeFile(path.join(rootPath, "second", "post.md"), "# Post");
    await fs.mkdir(path.join(rootPath, "first"));
    await fs.writeFile(path.join(rootPath, "first", "post.md"), "# Post");

    const files = await getFiles(rootPath);

    expect(files.map((item) => item.name)).toEqual([
      "first",
      "second",
      "alpha.md",
      "zebra.md",
    ]);
  });

  test("does not follow symlinks", async () => {
    const outsidePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "ssge-outside-"),
    );

    try {
      await fs.writeFile(path.join(outsidePath, "secret.md"), "# Secret");
      await fs.symlink(outsidePath, path.join(rootPath, "linked-folder"));
      await fs.symlink(
        path.join(outsidePath, "secret.md"),
        path.join(rootPath, "linked.md"),
      );

      await expect(getFiles(rootPath)).resolves.toEqual([]);
    } finally {
      await fs.rm(outsidePath, { recursive: true, force: true });
    }
  });
});
