import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/appError.js';

// Legacy files may still exist after the import. Do not leave a deleted user's copy behind.
const directory = process.env.AURA_LEGACY_DATA_URL || new URL('../../data/', import.meta.url);
let pending = Promise.resolve();
export function purgeLegacyData(userId, includeSettings = false) {
  const operation = pending.catch(() => {}).then(() => purge(userId, includeSettings));
  pending = operation;
  return operation;
}
async function purge(userId, includeSettings) {
  const names = ['logs', 'sleep', 'reflections', 'conversations', 'assessments'];
  if (includeSettings) names.push('user_settings');
  for (const name of names) {
    const file = new URL(name + '.json', directory);
    let data;
    try { data = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) {
      if (error.code === 'ENOENT') continue;
      throw new AppError('Unable to clear legacy data. Please contact support.', 503);
    }
    const updated = Array.isArray(data) ? data.filter(row => row.user_id !== userId) : { ...data };
    if (!Array.isArray(updated)) delete updated[userId];
    if (JSON.stringify(data) === JSON.stringify(updated)) continue;
    const temporary = fileURLToPath(file) + '.tmp';
    await fs.writeFile(temporary, JSON.stringify(updated, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporary, fileURLToPath(file));
  }
}
