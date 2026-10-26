import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, '.next/standalone');
await fs.access(path.join(destination, 'server.js'));
for (const [source, target] of [['public', 'public'], ['.next/static', '.next/static']]) {
  await fs.cp(path.join(root, source), path.join(destination, target), { recursive: true });
}
console.log('Standalone server prepared with public and static assets.');
