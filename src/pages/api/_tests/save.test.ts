import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { defaultConfig } from "@/lib/config";

import { POST } from "../save";

describe("/save", () => {
  let tempPath: string;
  let targetPath: string;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-save-"));
    targetPath = path.join(tempPath, "target");
  });

  afterEach(async () => {
    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("writes markdown content inside the target path", async () => {
    const response = await save(targetPath, {
      filePath: "posts/hello.md",
      fileContent: "# Hello",
    });

    await expect(
      fs.readFile(path.join(targetPath, "posts", "hello.md"), "utf-8"),
    ).resolves.toBe("# Hello");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("rejects absolute file paths", async () => {
    const filePath = path.join(targetPath, "posts", "hello.md");
    const response = await save(targetPath, {
      filePath,
      fileContent: "# Hello",
    });

    await expect(fs.stat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Invalid file path.",
    });
  });

  test("rejects writes outside the target path", async () => {
    const filePath = path.join(tempPath, "outside.md");
    const response = await save(targetPath, {
      filePath,
      fileContent: "# Outside",
    });

    await expect(fs.stat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
    expect(response.status).toBe(400);
  });
});

function save(targetPath: string, body: Record<string, unknown>) {
  return POST({
    request: new Request("http://localhost/api/save", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    locals: { targetPath, config: defaultConfig },
  } as unknown as Parameters<typeof POST>[0]);
}
