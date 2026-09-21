#!/usr/bin/env node

/**
 * Sync selected media from ./assets into application public directories.
 * Mirrors each category (destination is replaced to drop orphaned files).
 * Idempotent. Safe to re-run. Does not invent missing files.
 *
 * When invoked from an app package (website/admin), only that app's public
 * directory is written so parallel CI builds do not race on rmSync.
 * Root `pnpm sync:assets` still mirrors both apps.
 */

import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceRoot = join(root, 'assets');
const lockPath = join(root, 'scripts', '.sync-assets.lock');

const websiteAssets = join(root, 'apps', 'website', 'public', 'assets');
const adminAssets = join(root, 'apps', 'admin', 'public', 'assets');
const websiteApp = join(root, 'apps', 'website');
const adminApp = join(root, 'apps', 'admin');

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

export function isPathInside(parent, child) {
  const relativePath = relative(resolve(parent), resolve(child));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

export function resolveTargets(cwd = process.cwd(), env = process.env) {
  const override = env.SYNC_ASSETS_TARGET?.trim().toLowerCase();
  if (override === 'website') {
    return [websiteAssets];
  }
  if (override === 'admin') {
    return [adminAssets];
  }
  if (override === 'all') {
    return [websiteAssets, adminAssets];
  }

  const resolvedCwd = resolve(cwd);
  if (isPathInside(websiteApp, resolvedCwd)) {
    return [websiteAssets];
  }
  if (isPathInside(adminApp, resolvedCwd)) {
    return [adminAssets];
  }

  return [websiteAssets, adminAssets];
}

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

function errorCode(error) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

async function sleep(ms) {
  await new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function removeDir(path) {
  let lastError = /** @type {unknown} */ (undefined);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch (error) {
      const code = errorCode(error);
      lastError = error;
      if (code !== 'ENOTEMPTY' && code !== 'EBUSY' && code !== 'EPERM') {
        throw error;
      }
      await sleep(25 * (attempt + 1));
    }
  }
  throw lastError;
}

async function acquireLock(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    try {
      return openSync(lockPath, 'wx');
    } catch (error) {
      if (errorCode(error) !== 'EEXIST') {
        throw error;
      }
      try {
        const ageMs = Date.now() - statSync(lockPath).mtimeMs;
        if (ageMs > 120_000) {
          rmSync(lockPath, { force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error('timed out waiting for asset sync lock');
      }
      await sleep(50);
    }
  }
}

function releaseLock(fd) {
  try {
    closeSync(fd);
  } finally {
    rmSync(lockPath, { force: true });
  }
}

async function syncCategory(category, destinationRoot) {
  const sourceDir = join(sourceRoot, category);
  if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    return 0;
  }

  const destinationDir = join(destinationRoot, category);

  // Replace the category folder so deleted source files do not linger in public/.
  if (existsSync(destinationDir)) {
    await removeDir(destinationDir);
  }

  if (category === 'gallery') {
    copyGalleryFiltered(sourceDir, destinationDir);
  } else {
    cpSync(sourceDir, destinationDir, { recursive: true });
  }

  const count = countFiles(destinationDir);
  console.log(
    `synced ${relative(root, sourceDir)}${sep} -> ${relative(root, destinationDir)}${sep} (${count} files)`,
  );
  return count;
}

export async function syncAssets(cwd = process.cwd(), env = process.env) {
  if (!existsSync(sourceRoot)) {
    throw new Error('assets directory not found at repository root');
  }

  const targets = resolveTargets(cwd, env);
  const fd = await acquireLock();
  try {
    let total = 0;
    for (const target of targets) {
      ensureDir(target);
      for (const category of includeCategories) {
        total += await syncCategory(category, target);
      }
    }
    console.log(`asset sync complete (${total} files)`);
    return total;
  } finally {
    releaseLock(fd);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return pathToFileURL(resolve(entry)).href === import.meta.url;
}

if (isDirectRun()) {
  syncAssets().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
