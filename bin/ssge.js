#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

// CLI flags take precedence over env vars, the config file, and defaults.
const cliPort = takeFlagValue("--port");
const cliHost = takeFlagValue("--host");

if (cliPort !== undefined && !/^\d+$/.test(cliPort)) {
  console.error(
    "Please provide a valid port number: ssge <path_to_folder> --port <port>",
  );
  process.exit(1);
}

if (cliHost !== undefined && (cliHost === "" || cliHost.startsWith("-"))) {
  console.error(
    "Please provide a host to listen on: ssge <path_to_folder> --host <address>",
  );
  process.exit(1);
}

const targetPath = args[0];

if (!targetPath) {
  console.error(
    "Please provide a path to the folder: ssge <path_to_folder> [--port <port>] [--host <address>]",
  );
  process.exit(1);
}

// Resolve the absolute path
const absoluteTargetPath = resolve(targetPath);
const configCandidates = [
  join(absoluteTargetPath, ".sserc.js"),
  join(process.cwd(), ".sserc.js"),
];
const resolvedConfigPath =
  configCandidates.find((candidate) => existsSync(candidate)) ?? "";

if (!existsSync(absoluteTargetPath)) {
  console.error(`The path "${absoluteTargetPath}" does not exist`);
  process.exit(1);
}

const config = await loadConfig(resolvedConfigPath);

// Precedence: CLI flag > env var > config file > default.
const port =
  cliPort ?? process.env.PORT ?? normalizePort(config.port) ?? "4321";
const host =
  cliHost ?? process.env.HOST ?? normalizeHost(config.host) ?? "localhost";

// Get the absolute path to the dist directory
const distPath = join(__dirname, "..", "dist");

console.log(`Starting SSG Editor for folder: ${absoluteTargetPath}`);
if (resolvedConfigPath) {
  console.log(`Using config: ${resolvedConfigPath}`);
}
console.log(`SSG Editor is running at http://${host}:${port}`);
console.log("Press Ctrl+C to stop the server");

// Spawn the server process
const server = spawn("node", [join(distPath, "server", "entry.mjs")], {
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    TARGET_PATH: absoluteTargetPath,
    SSG_EDITOR_CONFIG_PATH: resolvedConfigPath,
  },
  stdio: "inherit",
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nStopping SSG Editor...");
  server.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("\nStopping SSG Editor...");
  server.kill();
  process.exit();
});

// Reads and removes "--flag value" from args, returning the value (or
// undefined when the flag is absent).
function takeFlagValue(flag) {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1] ?? "";
  args.splice(index, 2);
  return value;
}

async function loadConfig(configPath) {
  if (!configPath) {
    return {};
  }

  try {
    const module = await import(pathToFileURL(configPath).href);
    return module.default ?? module ?? {};
  } catch (error) {
    console.error(`Failed to load config "${configPath}":`, error);
    return {};
  }
}

function normalizePort(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }

  return typeof value === "string" && /^\d+$/.test(value) ? value : undefined;
}

function normalizeHost(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
