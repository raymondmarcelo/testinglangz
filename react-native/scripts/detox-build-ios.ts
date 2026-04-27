import { spawnSync } from 'node:child_process';
import { basename, extname, join, sep } from 'node:path';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

type RunOptions = {
  cwd?: string;
  stdio?: 'inherit' | 'pipe';
};

type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type XcodeContainer = {
  flag: '-workspace' | '-project';
  path: string;
};

if (process.platform !== 'darwin') {
  console.error('iOS Detox builds require macOS and Xcode.');
  process.exit(1);
}

const rootDir = process.cwd();
const iosDir = join(rootDir, 'ios');
const derivedDataPath = join(iosDir, 'build');
const detoxAppPath = join(derivedDataPath, 'Build', 'Products', 'Debug-iphonesimulator', 'DetoxApp.app');
const maxContainerDepth = 3;
const excludedSchemeKeywords = ['test', 'uitest', 'unittest', 'integrationtest', 'snapshottest', 'tvos', 'macos'];

function spawn(command: string, args: string[], options: RunOptions = {}): RunResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    stdio: options.stdio === 'inherit' ? 'inherit' : 'pipe',
    encoding: 'utf8',
    shell: false,
  });

  return {
    status: typeof result.status === 'number' ? result.status : null,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function run(command: string, args: string[], options: RunOptions = {}): void {
  const result = spawn(command, args, { ...options, stdio: 'inherit' });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runAndCapture(command: string, args: string[], options: RunOptions = {}): string {
  const result = spawn(command, args, options);

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

function tryRun(command: string, args: string[], options: RunOptions = {}): boolean {
  const result = spawn(command, args, { ...options, stdio: 'inherit' });
  return result.status === 0;
}

function isIgnoredWorkspace(pathName: string): boolean {
  return pathName.endsWith(`${sep}Pods.xcworkspace`) || pathName.includes('.xcodeproj' + sep);
}

function findXcodeContainerCandidates(currentPath: string, depth: number): XcodeContainer[] {
  if (!existsSync(currentPath) || depth > maxContainerDepth) {
    return [];
  }

  const entries = readdirSync(currentPath, { withFileTypes: true });
  const containers: XcodeContainer[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = join(currentPath, entry.name);

    if (entry.name.endsWith('.xcworkspace') && !isIgnoredWorkspace(entryPath)) {
      containers.push({ flag: '-workspace', path: entryPath });
      continue;
    }

    if (entry.name.endsWith('.xcodeproj')) {
      containers.push({ flag: '-project', path: entryPath });
      continue;
    }

    containers.push(...findXcodeContainerCandidates(entryPath, depth + 1));
  }

  return containers;
}

function hasXcodeContainer(): boolean {
  return findXcodeContainerCandidates(iosDir, 0).length > 0;
}

function ensureIosProject(): void {
  if (!existsSync(iosDir) || !hasXcodeContainer()) {
    console.error('Missing bare React Native iOS project. Ensure ios/ contains an Xcode workspace or project.');
    process.exit(1);
  }
}

function installPodsIfNeeded(): void {
  const podfilePath = join(iosDir, 'Podfile');

  if (!existsSync(podfilePath)) {
    return;
  }

  if (tryRun('npx', ['pod-install', '--project-directory=ios'], { cwd: rootDir })) {
    return;
  }

  run('pod', ['install', '--repo-update'], { cwd: iosDir });
}

function logBuildEnvironment(): void {
  console.log('Using iOS build environment:');
  run('sw_vers', []);
  run('xcodebuild', ['-version']);
}

function scoreContainer(container: XcodeContainer): number {
  let score = 0;

  if (container.flag === '-workspace') {
    score += 100;
  }

  const relativeDepth = container.path.replace(iosDir, '').split(sep).filter(Boolean).length;
  score -= relativeDepth * 10;

  if (!container.path.includes('.xcodeproj' + sep)) {
    score += 20;
  }

  return score;
}

function isExcludedScheme(scheme: string): boolean {
  const normalized = scheme.toLowerCase().replaceAll(/[^a-z]/g, '');

  if (normalized.startsWith('pods')) {
    return true;
  }

  return excludedSchemeKeywords.some((keyword) => normalized.includes(keyword));
}

function findBuildContainer(): XcodeContainer {
  const candidates = findXcodeContainerCandidates(iosDir, 0);

  if (candidates.length === 0) {
    console.error('Unable to find an Xcode workspace or project in ios/.');
    process.exit(1);
  }

  const sortedCandidates = [...candidates];
  sortedCandidates.sort((left, right) => scoreContainer(right) - scoreContainer(left));
  const [bestMatch] = sortedCandidates;

  if (!bestMatch) {
    console.error('Unable to resolve an Xcode workspace or project for Detox iOS build.');
    process.exit(1);
  }

  return bestMatch;
}

function resolveScheme(container: XcodeContainer): string {
  const output = runAndCapture('xcodebuild', ['-list', '-json', container.flag, container.path], { cwd: rootDir });
  const parsed = JSON.parse(output) as {
    workspace?: { schemes?: string[] };
    project?: { schemes?: string[] };
  };

  const rawSchemes = [...(parsed.workspace?.schemes || []), ...(parsed.project?.schemes || [])];
  const schemes = rawSchemes.filter((scheme, index) => Boolean(scheme) && rawSchemes.indexOf(scheme) === index);
  const containerName = basename(container.path, extname(container.path));

  const exactMatch = schemes.find(
    (scheme) => !isExcludedScheme(scheme) && scheme.toLowerCase() === containerName.toLowerCase(),
  );
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = schemes.find(
    (scheme) => !isExcludedScheme(scheme) && scheme.toLowerCase().includes(containerName.toLowerCase()),
  );
  if (partialMatch) {
    return partialMatch;
  }

  const fallbackMatch = schemes.find((scheme) => !isExcludedScheme(scheme));
  if (fallbackMatch) {
    return fallbackMatch;
  }

  console.error('Unable to resolve a non-test Xcode scheme for Detox iOS build.');
  process.exit(1);
}

function shouldIgnoreAppBundle(name: string): boolean {
  return /tests?\.app$/iu.test(name) || /uitests?\.app$/iu.test(name);
}

function isCollectableAppBundle(name: string, isDirectoryOrSymlink: boolean): boolean {
  return name.endsWith('.app') && isDirectoryOrSymlink && !shouldIgnoreAppBundle(name);
}

function shouldTraverseDirectory(name: string, isDirectory: boolean): boolean {
  return isDirectory && !name.endsWith('.app');
}

function collectAppBundles(rootPath: string): string[] {
  if (!existsSync(rootPath)) {
    return [];
  }

  const appBundles: string[] = [];
  const pending = [rootPath];

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath) {
      break;
    }

    const entries = readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(currentPath, entry.name);
      const isDirectoryOrSymlink = entry.isDirectory() || entry.isSymbolicLink();

      if (isCollectableAppBundle(entry.name, isDirectoryOrSymlink)) {
        appBundles.push(entryPath);
        continue;
      }

      if (shouldTraverseDirectory(entry.name, entry.isDirectory())) {
        pending.push(entryPath);
      }
    }
  }

  return appBundles;
}

function scoreBuiltApp(appPath: string, scheme: string): number {
  let score = 0;

  if (appPath.includes('Debug-iphonesimulator')) {
    score += 100;
  }

  if (basename(appPath) === `${scheme}.app`) {
    score += 50;
  }

  if (!appPath.includes('Release')) {
    score += 10;
  }

  return score;
}

function findBuiltApp(productsRoot: string, scheme: string): string {
  const appBundles = collectAppBundles(productsRoot);

  if (appBundles.length === 0) {
    console.error(`Unable to find a built .app under ${productsRoot}.`);
    process.exit(1);
  }

  const sortedAppBundles = [...appBundles];
  sortedAppBundles.sort((left, right) => scoreBuiltApp(right, scheme) - scoreBuiltApp(left, scheme));
  const [bestMatch] = sortedAppBundles;

  if (!bestMatch) {
    console.error('Unable to find a built .app in Xcode derived data products output.');
    process.exit(1);
  }

  return bestMatch;
}

ensureIosProject();
logBuildEnvironment();
installPodsIfNeeded();

const container = findBuildContainer();
const scheme = resolveScheme(container);

run(
  'xcodebuild',
  [
    container.flag,
    container.path,
    '-scheme',
    scheme,
    '-configuration',
    'Debug',
    '-sdk',
    'iphonesimulator',
    '-destination',
    'generic/platform=iOS Simulator',
    '-derivedDataPath',
    derivedDataPath,
    'CODE_SIGNING_ALLOWED=NO',
    'CLANG_WARN_NULLABILITY_COMPLETENESS=NO',
    'GCC_TREAT_WARNINGS_AS_ERRORS=NO',
    'SWIFT_TREAT_WARNINGS_AS_ERRORS=NO',
    'clean',
    'build',
  ],
  { cwd: rootDir },
);

const productsRoot = join(derivedDataPath, 'Build', 'Products');
const productsDir = join(productsRoot, 'Debug-iphonesimulator');
const builtAppPath = findBuiltApp(productsRoot, scheme);

mkdirSync(productsDir, { recursive: true });

if (builtAppPath !== detoxAppPath) {
  rmSync(detoxAppPath, { recursive: true, force: true });
  cpSync(builtAppPath, detoxAppPath, { recursive: true });
}

console.log(`Prepared Detox iOS app at ${basename(detoxAppPath)}`);
