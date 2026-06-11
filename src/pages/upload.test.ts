import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { POST } from "./upload";

describe("/upload", () => {
  let tempPath: string;
  let targetPath: string;
  let previousTargetPath: string | undefined;
  let previousConfigPath: string | undefined;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-upload-"));
    targetPath = path.join(tempPath, "target");
    previousTargetPath = process.env.TARGET_PATH;
    previousConfigPath = process.env.SSG_EDITOR_CONFIG_PATH;
    process.env.TARGET_PATH = targetPath;
    vi.spyOn(Date, "now").mockReturnValue(123);
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    if (previousTargetPath === undefined) {
      delete process.env.TARGET_PATH;
    } else {
      process.env.TARGET_PATH = previousTargetPath;
    }

    if (previousConfigPath === undefined) {
      delete process.env.SSG_EDITOR_CONFIG_PATH;
    } else {
      process.env.SSG_EDITOR_CONFIG_PATH = previousConfigPath;
    }

    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("writes uploaded images to the configured directory", async () => {
    const configPath = path.join(tempPath, ".sserc.js");
    await fs.writeFile(
      configPath,
      "export default { images: { uploadDir: 'public/uploads', publicPath: '/uploads' } };",
    );
    process.env.SSG_EDITOR_CONFIG_PATH = configPath;

    const response = await upload(
      new File(["image"], "My Image.PNG", { type: "image/png" }),
    );

    expect(response.status).toBe(201);
    await expect(
      fs.readFile(
        path.join(targetPath, "public", "uploads", "123-my-image.png"),
        "utf-8",
      ),
    ).resolves.toBe("image");
    await expect(response.json()).resolves.toEqual({
      url: "/uploads/123-my-image.png",
    });
  });

  test("rejects non-image uploads", async () => {
    const response = await upload(
      new File(["text"], "notes.txt", { type: "text/plain" }),
    );

    expect(response.status).toBe(400);
  });
});

function upload(file: File) {
  const data = new FormData();
  data.append("upload", file);

  return POST({
    request: new Request("http://localhost/upload", {
      method: "POST",
      body: data,
    }),
  } as Parameters<typeof POST>[0]);
}
