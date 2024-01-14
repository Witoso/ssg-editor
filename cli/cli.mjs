#!/usr/bin/env node

import { spawn } from "child_process";
import minimist from "minimist";
import { dirname, join, resolve } from "path";
import process from "process";
import { fileURLToPath } from "url";

const args = minimist(process.argv.slice(2));

const __dirname = dirname(fileURLToPath(import.meta.url));

const isDemo = args.demo || false;

if (process.env.NODE_ENV === "dev") {
  // SSG_E_ROOT_FOLDER defined in .env
  spawn("node", ["./dist/backend/src/index.js"], { stdio: "inherit" });
} else {
  if (isDemo) {
    process.env.SSG_E_ROOT_FOLDER = join(__dirname, "./demo");
  } else {
    process.env.SSG_E_ROOT_FOLDER = args._[0]
      ? resolve(args._[0])
      : process.cwd();
  }

  const serverScriptPath = join(__dirname, "./backend/src/index.js");
  spawn("node", [serverScriptPath], { stdio: "inherit" });
}
