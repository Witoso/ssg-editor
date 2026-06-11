import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { normalizeConfig } from "@/lib/config";

import { POST } from "../upload";

describe("/upload", () => {
  let tempPath: string;
  let targetPath: string;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-upload-"));
    targetPath = path.join(tempPath, "target");
    vi.spyOn(Date, "now").mockReturnValue(123);
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("writes uploaded images to the configured directory", async () => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const response = await upload(
      targetPath,
      new File([pngBytes], "My Image.PNG", { type: "image/png" }),
    );

    expect(response.status).toBe(201);
    await expect(
      fs.readFile(
        path.join(targetPath, "public", "uploads", "123-my-image.png"),
      ),
    ).resolves.toEqual(Buffer.from(pngBytes));
    await expect(response.json()).resolves.toEqual({
      url: "/uploads/123-my-image.png",
    });
  });

  test("rejects non-image uploads", async () => {
    const response = await upload(
      targetPath,
      new File(["text"], "notes.txt", { type: "text/plain" }),
    );

    expect(response.status).toBe(400);
  });

  test("rejects non-image bytes disguised with an image name and type", async () => {
    const response = await upload(
      targetPath,
      new File(["just text"], "fake.png", { type: "image/png" }),
    );

    expect(response.status).toBe(400);
  });
});

function upload(targetPath: string, file: File) {
  const data = new FormData();
  data.append("upload", file);

  return POST({
    request: new Request("http://localhost/api/upload", {
      method: "POST",
      body: data,
    }),
    locals: {
      targetPath,
      config: normalizeConfig({
        images: { uploadDir: "public/uploads", publicPath: "/uploads" },
      }),
    },
  } as unknown as Parameters<typeof POST>[0]);
}
