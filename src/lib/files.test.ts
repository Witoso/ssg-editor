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

  test("throws when the root path does not exist", () => {
    expect(() => getFiles(path.join(rootPath, "missing"))).toThrow(
      `Path does not exist: ${path.join(rootPath, "missing")}`,
    );
  });

  test("includes markdown files at the root", async () => {
    await fs.writeFile(path.join(rootPath, "index.md"), "# Home");

    expect(getFiles(rootPath)).toEqual([
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

    expect(getFiles(rootPath)).toEqual([
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
    await fs.writeFile(path.join(rootPath, "posts", "drafts", "one.md"), "# One");

    expect(getFiles(rootPath)).toEqual([
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

    expect(getFiles(rootPath)).toEqual([]);
  });
});
