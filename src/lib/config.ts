import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export type SsgEditorConfig = {
  images: {
    uploadDir: string;
    publicPath: string;
  };
};

type UserConfig = {
  images?: {
    uploadDir?: unknown;
    publicPath?: unknown;
  };
};

export const defaultConfig: SsgEditorConfig = {
  images: {
    uploadDir: "assets/images",
    publicPath: "/assets/images",
  },
};

export function findConfigPath(cwd: string = process.cwd()): string | null {
  const configPath = path.join(cwd, ".sserc.js");
  return fs.existsSync(configPath) ? configPath : null;
}

export async function loadConfig(
  configPath: string | null = process.env.SSG_EDITOR_CONFIG_PATH ??
    findConfigPath(),
): Promise<SsgEditorConfig> {
  if (!configPath) {
    return defaultConfig;
  }

  try {
    const configUrl = pathToFileURL(configPath);
    configUrl.searchParams.set(
      "mtime",
      String(fs.statSync(configPath).mtimeMs),
    );

    const module = await import(/* @vite-ignore */ configUrl.href);
    return normalizeConfig(module.default ?? module);
  } catch (error) {
    console.error(
      `Failed to load config "${configPath}", using defaults:`,
      error,
    );
    return defaultConfig;
  }
}

export function normalizeConfig(userConfig: UserConfig): SsgEditorConfig {
  const uploadDir = stringOrDefault(
    userConfig.images?.uploadDir,
    defaultConfig.images.uploadDir,
  );
  const publicPath = normalizePublicPath(
    stringOrDefault(
      userConfig.images?.publicPath,
      defaultConfig.images.publicPath,
    ),
  );

  return {
    images: {
      uploadDir,
      publicPath,
    },
  };
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function normalizePublicPath(publicPath: string): string {
  return `/${publicPath.replace(/^\/+|\/+$/g, "")}`;
}
