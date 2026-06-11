import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { errorResponse, imageResponse, jsonResponse } from "./responses";

describe("jsonResponse", () => {
  test("serializes data with a JSON content type", async () => {
    const response = jsonResponse({ ok: true }, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

describe("errorResponse", () => {
  test("wraps the message in the error envelope", async () => {
    const response = errorResponse("Nope.", 400);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Nope." });
  });
});

describe("imageResponse", () => {
  let tempPath: string;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-responses-"));
  });

  afterEach(async () => {
    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("serves the image with content type, length, and caching headers", async () => {
    const imagePath = path.join(tempPath, "image.png");
    await fs.writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const response = await imageResponse(imagePath);

    expect(response).not.toBeNull();
    expect(response!.headers.get("Content-Type")).toBe("image/png");
    expect(response!.headers.get("Content-Length")).toBe("4");
    expect(response!.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  test("returns null for unreadable files", async () => {
    await expect(
      imageResponse(path.join(tempPath, "missing.png")),
    ).resolves.toBeNull();
  });
});
