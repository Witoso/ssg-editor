import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { POST } from "./save";

describe("/save", () => {
  let tempPath: string;
  let targetPath: string;
  let previousTargetPath: string | undefined;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-save-"));
    targetPath = path.join(tempPath, "target");
    previousTargetPath = process.env.TARGET_PATH;
    process.env.TARGET_PATH = targetPath;
  });

  afterEach(async () => {
    if (previousTargetPath === undefined) {
      delete process.env.TARGET_PATH;
    } else {
      process.env.TARGET_PATH = previousTargetPath;
    }

    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("writes markdown content inside the target path", async () => {
    const filePath = path.join(targetPath, "posts", "hello.md");
    const response = await save({
      filePath,
      fileContent: "# Hello",
    });

    await expect(fs.readFile(filePath, "utf-8")).resolves.toBe("# Hello");
    expect(response.status).toBe(200);
  });

  test("rejects writes outside the target path", async () => {
    const filePath = path.join(tempPath, "outside.md");
    const response = await save({
      filePath,
      fileContent: "# Outside",
    });

    await expect(fs.stat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
    expect(response.status).toBe(400);
  });
});

function save(body: Record<string, unknown>) {
  return POST({
    request: new Request("http://localhost/save", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  } as Parameters<typeof POST>[0]);
}
