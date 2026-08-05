#!/usr/bin/env node

/**
 * Sync selected media from ./assets into application public directories.
 * Mirrors each category (destination is replaced to drop orphaned files).
 * Idempotent. Safe to re-run. Does not invent missing files.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceRoot = join(root, 'assets');

const targets = [
  join(root, 'apps', 'website', 'public', 'assets'),
  join(root, 'apps', 'admin', 'public', 'assets'),
];

const includeCategories = [
  'logo',
  'home',
  'menu',
  'gallery',
  'locations',
  'favicon',
  'social',
  'about',
  'news',
  'reviews',
];

/** Gallery pages only render images — skip shipping unused MP4 weight. */
const galleryImageExtensions = new Set(['.webp', '.avif', '.jpg', '.jpeg', '.png', '.gif']);

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      total += countFiles(path);
      continue;
    }
    total += 1;
  }
  return total;
}

function copyGalleryFiltered(sourceDir, destinationDir) {
  ensureDir(destinationDir);
  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry);
    const destinationPath = join(destinationDir, entry);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) {
      copyGalleryFiltered(sourcePath, destinationPath);
      continue;
    }
    if (!galleryImageExtensions.has(extname(entry).toLowerCase())) {
      continue;
    }
    cpSync(sourcePath, destinationPath);
  }
}

function syncCategory(category, destinationRoot) {
  const sourceDir = join(sourceRoot, category);
  if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    return 0;
  }

  const destinationDir = join(destinationRoot, category);

  // Replace the category folder so deleted source files do not linger in public/.
  if (existsSync(destinationDir)) {
    rmSync(destinationDir, { recursive: true, force: true });
  }

  if (category === 'gallery') {
    copyGalleryFiltered(sourceDir, destinationDir);
  } else {
    cpSync(sourceDir, destinationDir, { recursive: true });
  }

  const count = countFiles(destinationDir);
  console.log(
    `synced ${relative(root, sourceDir)}\\ -> ${relative(root, destinationDir)}\\ (${count} files)`,
  );
  return count;
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
      total += syncCategory(category, target);
    }
  }

  console.log(`asset sync complete (${total} files)`);
}

main();
