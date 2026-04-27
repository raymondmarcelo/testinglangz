import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import detoxGlobalSetup from 'detox/runners/jest/globalSetup.js';

function collectApkCandidates() {
  const rootPath = join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk');
  if (!existsSync(rootPath)) {
    return [];
  }

  const stack = [rootPath];
  const results = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.apk')) {
        results.push(fullPath);
      }
    }
  }

  return results.sort((left, right) => left.localeCompare(right));
}

function ensureExpectedDebugApk() {
  const expectedPath = join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

  if (existsSync(expectedPath)) {
    return;
  }

  const candidates = collectApkCandidates();
  if (candidates.length === 0) {
    return;
  }

  const preferred = candidates.find((candidate) => candidate.includes(join('debug', 'app-debug')));
  const source = preferred || candidates[0];
  if (!source) {
    return;
  }

  mkdirSync(join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'debug'), { recursive: true });
  copyFileSync(source, expectedPath);
  console.log(`[detox-apk] Normalized APK for Detox: ${source} -> ${expectedPath}`);
}

export default async function globalSetup() {
  ensureExpectedDebugApk();
  await detoxGlobalSetup();
}
