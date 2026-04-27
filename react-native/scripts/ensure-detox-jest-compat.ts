import fs from 'node:fs';
import path from 'node:path';

function resolveDetoxDir(): string | null {
  try {
    return path.dirname(require.resolve('detox/package.json'));
  } catch {
    return null;
  }
}

function removeLegacyShim(filePath: string, expectedContent: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (content !== expectedContent) {
    return false;
  }

  fs.rmSync(filePath);
  return true;
}

function main(): void {
  const detoxDir = resolveDetoxDir();

  if (!detoxDir) {
    console.warn('[detox-compat] Detox is not installed; skipping legacy shim cleanup.');
    return;
  }

  const jestRunnerDir = path.join(detoxDir, 'runners', 'jest');

  if (!fs.existsSync(jestRunnerDir)) {
    console.warn('[detox-compat] Detox Jest runner directory is missing; skipping legacy shim cleanup.');
    return;
  }

  const removedShims = [
    {
      fileName: 'reporter.js',
      expectedContent: "module.exports = require('./streamlineReporter');",
    },
    {
      fileName: 'testEnvironment.js',
      expectedContent: "module.exports = require('./JestCircusEnvironment');",
    },
  ].filter(({ fileName, expectedContent }) =>
    removeLegacyShim(path.join(jestRunnerDir, fileName), expectedContent),
  );

  if (removedShims.length > 0) {
    console.log(
      `[detox-compat] Removed stale Detox Jest shims: ${removedShims.map(({ fileName }) => fileName).join(', ')}`,
    );
    return;
  }

  console.log('[detox-compat] No stale Detox Jest shims found.');
}

main();
