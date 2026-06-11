#!/usr/bin/env node

import { spawn } from "child_process";
import { cpSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = resolve(__dirname, "..");
const fixturePath = join(rootPath, "test", "fixtures", "site");
const devTargetPath = join(tmpdir(), "ssg-editor-dev-site");
const args = process.argv.slice(2);
const forwardedArgs = args[0] === "--" ? args.slice(1) : args;
const hasTargetArg = forwardedArgs[0] && !forwardedArgs[0].startsWith("-");
const targetPath = resolve(
  hasTargetArg ? forwardedArgs[0] : prepareDevTargetPath(),
);
const astroArgs = hasTargetArg ? forwardedArgs.slice(1) : forwardedArgs;
const configPath = join(targetPath, ".sserc.js");

if (!existsSync(targetPath)) {
  console.error(`The path "${targetPath}" does not exist`);
  process.exit(1);
}

console.log(`Starting SSG Editor dev server for folder: ${targetPath}`);

if (existsSync(configPath)) {
  console.log(`Using config: ${configPath}`);
}

const server = spawn("pnpm", ["exec", "astro", "dev", ...astroArgs], {
  env: {
    ...process.env,
    TARGET_PATH: targetPath,
    SSG_EDITOR_CONFIG_PATH: existsSync(configPath) ? configPath : "",
  },
  stdio: "inherit",
});

process.on("SIGINT", () => {
  server.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  server.kill();
  process.exit();
});

function prepareDevTargetPath() {
  rmSync(devTargetPath, { recursive: true, force: true });
  cpSync(fixturePath, devTargetPath, { recursive: true });
  return devTargetPath;
}
