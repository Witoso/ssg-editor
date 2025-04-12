#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, 'dist');
const targetPath = process.argv[2] || process.cwd();

console.log(`Starting server for path: ${targetPath}`);

const server = spawn('node', [join(distPath, 'server', 'entry.mjs')], {
  env: {
    ...process.env,
    TARGET_PATH: targetPath
  },
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  server.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit();
}); 