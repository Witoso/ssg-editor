import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  defaultConfig,
  findConfigPath,
  loadConfig,
  normalizeConfig,
} from "./config";

describe("config", () => {
  let tempPath: string;

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), "ssge-config-"));
  });

  afterEach(async () => {
    await fs.rm(tempPath, { recursive: true, force: true });
  });

  test("returns defaults when no config path is provided", async () => {
    await expect(loadConfig(null)).resolves.toEqual(defaultConfig);
  });

  test("finds .sserc.js in the current working directory", async () => {
    const configPath = path.join(tempPath, ".sserc.js");
    await fs.writeFile(configPath, "export default {};");

    expect(findConfigPath(tempPath)).toBe(configPath);
  });

  test("normalizes image config", () => {
    expect(
      normalizeConfig({
        images: {
          uploadDir: "public/media",
          publicPath: "media/",
        },
      }),
    ).toEqual({
      images: {
        uploadDir: "public/media",
        publicPath: "/media",
      },
    });
  });

  test("falls back to defaults when the config file is missing", async () => {
    const configPath = path.join(tempPath, ".sserc.js");

    await expect(loadConfig(configPath)).resolves.toEqual(defaultConfig);
  });

  test("falls back to defaults when the config file fails to load", async () => {
    const configPath = path.join(tempPath, ".sserc.js");
    await fs.writeFile(configPath, "export default {;");

    await expect(loadConfig(configPath)).resolves.toEqual(defaultConfig);
  });

  test("loads ESM config files", async () => {
    const configPath = path.join(tempPath, ".sserc.js");
    await fs.writeFile(
      configPath,
      [
        "export default {",
        "  images: {",
        "    uploadDir: 'static/uploads',",
        "    publicPath: '/uploads'",
        "  }",
        "};",
      ].join("\n"),
    );

    await expect(loadConfig(configPath)).resolves.toEqual({
      images: {
        uploadDir: "static/uploads",
        publicPath: "/uploads",
      },
    });
  });
});
