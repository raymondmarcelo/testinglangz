import fs from 'node:fs';
import path from 'node:path';

const maestroDir = path.resolve(process.cwd(), '.maestro');

if (!fs.existsSync(maestroDir) || !fs.statSync(maestroDir).isDirectory()) {
  console.error('Missing .maestro directory.');
  process.exit(1);
}

const flowFiles = fs
  .readdirSync(maestroDir)
  .filter((fileName) => fileName.endsWith('.yaml') || fileName.endsWith('.yml'));

if (flowFiles.length === 0) {
  console.error('No Maestro flow files found in .maestro/.');
  process.exit(1);
}

console.log(`Found ${flowFiles.length} Maestro flow file(s): ${flowFiles.join(', ')}`);
