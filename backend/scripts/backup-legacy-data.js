import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, '../tmp/aura-backups', new Date().toISOString().replace(/[:.]/g, '-'));
await fs.mkdir(destination, { recursive: true, mode: 0o700 });
const manifest = { createdAt: new Date().toISOString(), files: [] };
for (const name of ['logs.json', 'sleep.json', 'reflections.json', 'conversations.json', 'assessments.json', 'user_settings.json']) {
  const source = path.join(root, 'data', name);
  let contents;
  try { contents = await fs.readFile(source); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  JSON.parse(contents.toString('utf8'));
  await fs.writeFile(path.join(destination, name), contents, { flag: 'wx', mode: 0o600 });
  const digest = createHash('sha256').update(contents).digest('hex');
  const current = createHash('sha256').update(await fs.readFile(source)).digest('hex');
  if (digest !== current) throw new Error('A legacy file changed during the backup. Stop legacy writers and rerun.');
  manifest.files.push({ file: name, bytes: contents.length, sha256: digest });
}
await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
console.log(`Verified backup: ${destination} (${manifest.files.length} files). Originals were not changed.`);
