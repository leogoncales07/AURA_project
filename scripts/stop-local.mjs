import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateFile = path.join(root, 'tmp', 'aura-local-processes.json');
const state = JSON.parse(await fs.readFile(stateFile, 'utf8').catch(() => 'null'));

if (!state) {
  console.log('No AURA launcher state was found. Nothing to stop.');
  process.exit(0);
}

const age = Date.now() - Date.parse(state.startedAt);
if (!Number.isFinite(age) || age < 0 || age > 12 * 60 * 60 * 1000) {
  throw new Error('Refusing to use a stale or invalid launcher state file. Inspect tmp/aura-local-processes.json manually.');
}

const pids = [state.ownerPid, ...(state.services || []).map(service => service.pid), state.monitorPid]
  .filter(pid => Number.isInteger(pid) && pid > 0);
const isAlive = pid => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

for (const pid of pids) {
  if (!isAlive(pid)) continue;
  try { process.kill(pid, 'SIGTERM'); } catch {}
}

await new Promise(resolve => setTimeout(resolve, 500));
const remaining = pids.filter(isAlive);
if (remaining.length) {
  throw new Error(`Could not stop AURA processes: ${remaining.join(', ')}. The launcher state file was preserved.`);
}
await fs.unlink(stateFile).catch(() => {});
console.log(`Stopped AURA launcher processes: ${pids.join(', ')}`);
