#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'apps', 'backend', '.gocache');

mkdirSync(cacheDir, { recursive: true });

const env = {
  ...process.env,
  GOCACHE: process.env.GOCACHE || cacheDir,
  GOTOOLCHAIN: process.env.GOTOOLCHAIN || 'auto',
};

const args = process.argv.slice(2);
const result = spawnSync('go', args, {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 1);
