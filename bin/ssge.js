#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const portFlagIndex = args.indexOf("--port");
let port = process.env.PORT ?? "4321";

if (portFlagIndex !== -1) {
  const portValue = args[portFlagIndex + 1];

  if (!portValue || !/^\d+$/.test(portValue)) {
    console.error(
      "Please provide a valid port number: ssge <path_to_folder> --port <port>",
    );
    process.exit(1);
  }

  port = portValue;
  args.splice(portFlagIndex, 2);
}

// Only listen beyond the loopback interface when explicitly requested.
const hostFlagIndex = args.indexOf("--host");
let host = process.env.HOST ?? "localhost";

if (hostFlagIndex !== -1) {
  const hostValue = args[hostFlagIndex + 1];

  if (!hostValue || hostValue.startsWith("-")) {
    console.error(
      "Please provide a host to listen on: ssge <path_to_folder> --host <address>",
    );
    process.exit(1);
  }

  host = hostValue;
  args.splice(hostFlagIndex, 2);
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
