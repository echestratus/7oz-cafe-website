#!/usr/bin/env node

/**
 * Sync selected media from ./assets into application public directories.
 * Idempotent. Safe to re-run. Does not invent missing files.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceRoot = join(root, 'assets');

const targets = [
  join(root, 'apps', 'website', 'public', 'assets'),
  join(root, 'apps', 'admin', 'public', 'assets'),
];

const includeCategories = ['logo', 'home', 'menu', 'gallery', 'favicon', 'social', 'about'];

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function copyCategory(category, destinationRoot) {
  const sourceDir = join(sourceRoot, category);
  if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    return 0;
  }

  const destinationDir = join(destinationRoot, category);
  ensureDir(destinationDir);

  let copied = 0;
  for (const entry of readdirSync(sourceDir)) {
    const from = join(sourceDir, entry);
    const to = join(destinationDir, entry);

    if (statSync(from).isDirectory()) {
      cpSync(from, to, { recursive: true });
      const count = readdirSync(from).length;
      copied += count;
      console.log(`synced ${relative(root, from)}\\ -> ${relative(root, to)}\\ (${count} files)`);
      continue;
    }

    cpSync(from, to);
    copied += 1;
    console.log(`synced ${relative(root, from)} -> ${relative(root, to)}`);
  }

  return copied;
}

function main() {
  if (!existsSync(sourceRoot)) {
    console.error('assets directory not found at repository root');
    process.exit(1);
  }

  let total = 0;
  for (const target of targets) {
    ensureDir(target);
    for (const category of includeCategories) {
      total += copyCategory(category, target);
    }
  }

  console.log(`asset sync complete (${total} files)`);
}

main();
