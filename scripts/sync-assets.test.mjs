import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';

import { isPathInside, resolveTargets } from './sync-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const websiteApp = join(root, 'apps', 'website');
const adminApp = join(root, 'apps', 'admin');
const websiteReviews = join(root, 'apps', 'website', 'public', 'assets', 'reviews');
const adminReviews = join(root, 'apps', 'admin', 'public', 'assets', 'reviews');

test('resolveTargets isolates website and admin package directories', () => {
  assert.deepEqual(resolveTargets(websiteApp, {}), [
    join(root, 'apps', 'website', 'public', 'assets'),
  ]);
  assert.deepEqual(resolveTargets(adminApp, {}), [join(root, 'apps', 'admin', 'public', 'assets')]);
  assert.equal(resolveTargets(root, {}).length, 2);
  assert.deepEqual(resolveTargets(root, { SYNC_ASSETS_TARGET: 'website' }), [
    join(root, 'apps', 'website', 'public', 'assets'),
  ]);
  assert.equal(isPathInside(websiteApp, join(websiteApp, 'src')), true);
  assert.equal(isPathInside(websiteApp, adminApp), false);
});

function runSync(cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [join(root, 'scripts', 'sync-assets.mjs')], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun(undefined);
        return;
      }
      reject(new Error(`sync-assets exited ${code}: ${stderr}`));
    });
  });
}

test('parallel website and admin syncs complete without racing', async () => {
  await Promise.all([runSync(websiteApp), runSync(adminApp)]);
  assert.equal(existsSync(join(websiteReviews, 'omar-phelps.webp')), true);
  assert.equal(existsSync(join(adminReviews, 'omar-phelps.webp')), true);
});
