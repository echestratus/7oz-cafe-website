#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = join(root, 'apps', 'backend');
const migrationsPath = 'database/migrations';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const index = trimmed.indexOf('=');
    if (index <= 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(root, '.env'));

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5433';
const user = process.env.DB_USER || 'sevenoz';
const password = process.env.DB_PASSWORD || 'sevenoz_dev_password';
const name = process.env.DB_NAME || 'sevenoz';
const sslmode = process.env.DB_SSLMODE || 'disable';

const databaseURL = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?sslmode=${sslmode}`;
const action = process.argv[2] || 'up';
const args = process.argv.slice(3);

const migrateArgs = [
  'run',
  '-tags',
  'postgres',
  'github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3',
  '-path',
  migrationsPath,
  '-database',
  databaseURL,
  action,
  ...args,
];

const result = spawnSync('go', migrateArgs, {
  cwd: backendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    GOTOOLCHAIN: process.env.GOTOOLCHAIN || 'auto',
  },
  shell: true,
});

process.exit(result.status ?? 1);
