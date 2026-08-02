#!/usr/bin/env node

/**
 * Convert raster images under ./assets to WebP, then remove the originals.
 * Skips files that are already .webp.
 */

import { readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assetsRoot = join(root, 'assets');

const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

async function convertFile(sourcePath) {
  const extension = extname(sourcePath).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(extension)) {
    return false;
  }

  const targetPath = sourcePath.slice(0, -extension.length) + '.webp';
  const isPng = extension === '.png';

  await sharp(sourcePath)
    .webp({
      quality: 82,
      alphaQuality: 90,
      effort: 4,
      ...(isPng ? {} : {}),
    })
    .toFile(targetPath);

  rmSync(sourcePath);
  console.log(`converted ${relative(root, sourcePath)} -> ${relative(root, targetPath)}`);
  return true;
}

async function main() {
  const files = walk(assetsRoot);
  let converted = 0;

  for (const file of files) {
    if (await convertFile(file)) {
      converted += 1;
    }
  }

  console.log(`webp conversion complete (${converted} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
