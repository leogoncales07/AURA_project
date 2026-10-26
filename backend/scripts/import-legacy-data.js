import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
const apply = process.argv.includes('--apply');
const skipUnlinked = process.argv.includes('--skip-unlinked');
const sources = ['logs', 'sleep', 'reflections', 'conversations', 'assessments', 'user_settings'];
const data = {};
for (const source of sources) {
  try { data[source] = JSON.parse(await fs.readFile(path.join(root, 'data', source + '.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error(`Invalid ${source}.json: import stopped; source files were not changed.`); data[source] = source === 'assessments' ? [] : {}; }
}
const summary = Object.fromEntries(sources.map(source => [source, Array.isArray(data[source]) ? data[source].length : Object.keys(data[source]).length]));
console.log('Source counts (users, or assessment rows):', summary);
if (!apply) { console.log('Dry run only. Stop legacy writers, back up data, apply SQL migration, then rerun with --apply.'); process.exit(0); }
if (!process.env.S_SERV) throw new Error('S_SERV is required. Source files were not changed.');
const client = createClient(process.env.S_URL, process.env.S_SERV, { auth: { persistSession: false, autoRefreshToken: false } });
const uuid = (seed) => {
  const hash = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('');
  hash[12] = '4'; hash[16] = '8';
  return `${hash.slice(0,8).join('')}-${hash.slice(8,12).join('')}-${hash.slice(12,16).join('')}-${hash.slice(16,20).join('')}-${hash.slice(20).join('')}`;
};
const date = value => { const d = new Date(value); if (!value || !Number.isFinite(d.getTime())) throw new Error('Missing or invalid legacy date; import stopped.'); return d.toISOString(); };
async function checked(request) { const { data, error } = await request; if (error) throw new Error(`Import failed (${error.code || error.status || 'unknown'}). Source files were not changed; rerunning is idempotent.`); return data; }
const counts = {};
const verification = [];
async function insert(table, row, options, identity) {
  const column = table === 'app_settings' ? 'user_id' : 'id';
  const inserted = await checked(client.from(table).upsert(row, options).select(column));
  counts[table] ||= { inserted: 0, existing: 0 };
  counts[table][inserted.length ? 'inserted' : 'existing']++;
  verification.push({ table, column, identity });
}
const users = new Set();
for (const source of sources) {
  if (source === 'assessments') data[source].forEach(row => users.add(row.user_id));
  else Object.keys(data[source]).forEach(id => users.add(id));
}
// Verify admin access before classifying missing owners. Bad credentials must never skip data.
const access = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
if (access.error) throw new Error(`Supabase admin access failed (${access.error.status}). No records were imported.`);
const verifiedUsers = [];
let unlinked = 0;
// Preflight every owner before any inserts. Never create profiles for deleted or fictitious Auth users.
for (const user_id of users) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) {
    unlinked++;
    continue;
  }
  const result = await client.auth.admin.getUserById(user_id);
  if (result.error?.status === 404 || result.error?.code === 'user_not_found') { unlinked++; continue; }
  if (result.error || !result.data.user || result.data.user.id !== user_id) throw new Error('Could not verify a legacy owner. No records were imported.');
  verifiedUsers.push(user_id);
}
if (unlinked && !skipUnlinked) throw new Error('Unlinked legacy owners found. Resolve them, or use --skip-unlinked to import verified owners and preserve unlinked records in the source files.');
if (!verifiedUsers.length) throw new Error('No verified legacy owners. No records were imported.');
console.log(`Verified owners: ${verifiedUsers.length}; unlinked owners preserved in source files: ${unlinked}.`);
for (const user_id of verifiedUsers) {
  await insert('users', { id: user_id }, { onConflict: 'id', ignoreDuplicates: true }, { id: user_id });
  const daily = new Map();
  for (const log of [...(data.logs[user_id] || [])].reverse()) {
    const created_at = date(log.timestamp || log.created_at);
    const log_date = created_at.slice(0,10);
    const row = daily.get(log_date) || { user_id, log_date, created_at };
    if (log.mood_score != null) row.mood_score = log.mood_score;
    if (log.sleep_hours != null) row.sleep_hours = log.sleep_hours;
    if (log.notes != null) row.notes = log.notes;
    row.created_at = created_at; daily.set(log_date, row);
  }
  for (const row of daily.values()) await insert('daily_logs', row, { onConflict: 'user_id,log_date', ignoreDuplicates: true }, { user_id, log_date: row.log_date });
  for (const source of ['sleep','reflections']) {
    const rows = data[source][user_id] || [];
    for (const [index, row] of rows.entries()) {
      const created_at = date(row.timestamp || row.created_at);
      const id = uuid(`${source}:${user_id}:${row.id || created_at}:${index}`);
      const fields = source === 'sleep' ? { bedTime: row.bedTime, wakeTime: row.wakeTime, hours: row.hours, quality: row.quality, notes: row.notes } : { text: row.text, prompt: row.prompt };
      await insert(source === 'sleep' ? 'sleep_logs' : 'reflections', { id, user_id, created_at, ...fields }, { onConflict: 'id', ignoreDuplicates: true }, { id });
    }
  }
  for (const thread of data.conversations[user_id] || []) {
    const conversation_id = uuid(`thread:${user_id}:${thread.id}`);
    for (const [index, message] of (thread.messages || []).entries()) {
      const id = uuid(`message:${conversation_id}:${index}`);
      await insert('conversations', { id, user_id, conversation_id, title: thread.title,
        agent_type: 'CompanionBot', role: message.role, message: message.message,
        created_at: new Date(new Date(date(message.timestamp || thread.updatedAt)).getTime() + index).toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true }, { id });
    }
  }
  for (const [index, row] of data.assessments.entries()) {
    if (row.user_id !== user_id) continue;
    const id = uuid(`assessment:${user_id}:${row.id || row.created_at}:${index}`);
    await insert('assessments', { ...row, id, created_at: date(row.created_at) }, { onConflict: 'id', ignoreDuplicates: true }, { id });
  }
  if (data.user_settings[user_id]) {
    const { user_id: ignored, updated_at, ...preferences } = data.user_settings[user_id];
    await insert('app_settings', { user_id, preferences }, { onConflict: 'user_id', ignoreDuplicates: true }, { user_id });
  }
}
for (const { table, column, identity } of verification) {
  const row = await checked(client.from(table).select(column).match(identity).maybeSingle());
  if (!row) throw new Error('A destination record could not be verified. Source files were not modified.');
}
console.log(JSON.stringify({ counts, verifiedDestinationRecords: verification.length, unlinkedOwnersPreserved: unlinked }, null, 2));
console.log('Import complete and destination record existence verified. Source files were not modified.');
