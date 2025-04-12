#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const targetPath = args[0];

if (!targetPath) {
  console.error('Please provide a path to the folder: ssge <path_to_folder>');
  process.exit(1);
}

// Resolve the absolute path
const absoluteTargetPath = resolve(targetPath);

if (!existsSync(absoluteTargetPath)) {
  console.error(`The path "${absoluteTargetPath}" does not exist`);
  process.exit(1);
}

// Get the absolute path to the dist directory
const distPath = join(__dirname, '..', 'dist');

console.log(`Starting SSG Editor for folder: ${absoluteTargetPath}`);
console.log('Press Ctrl+C to stop the server');

// Spawn the server process
const server = spawn('node', [join(distPath, 'server', 'entry.mjs')], {
  env: {
    ...process.env,
    TARGET_PATH: absoluteTargetPath
  },
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping SSG Editor...');
  server.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\nStopping SSG Editor...');
  server.kill();
  process.exit();
}); 