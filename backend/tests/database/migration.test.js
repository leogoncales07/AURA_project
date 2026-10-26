import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
let db;
const migration = await fs.readFile(new URL('../../src/db/migrations/20261026_durable_wellness.sql', import.meta.url), 'utf8');
async function asUser(id) {
  await db.exec('RESET ROLE; SET ROLE authenticated;');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.query("SELECT set_config('request.jwt.claim.role', 'authenticated', false)");
}
async function count(table, id) {
  const { rows } = await db.query(`SELECT count(*)::int AS total FROM public.${table} WHERE user_id = $1`, [id]);
  return rows[0].total;
}
before(async () => {
  db = await PGlite.create();
  // Simulate only Supabase's roles and JWT helpers. The app schema/migration are unmodified.
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id UUID PRIMARY KEY, raw_user_meta_data JSONB DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
    GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO authenticated, anon;
  `);
  const schema = await fs.readFile(new URL('../../schema.sql', import.meta.url), 'utf8');
  await db.exec(schema);
  // Exercise backfill for an existing account, and the trigger for a new account.
  await db.query('INSERT INTO auth.users(id, raw_user_meta_data) VALUES ($1, $2)', [alice, { name: 'Alice' }]);
  await db.exec(migration);
  await db.query('INSERT INTO auth.users(id, raw_user_meta_data) VALUES ($1, $2)', [bob, { name: 'Bob' }]);
});
after(async () => { await db?.close(); });

test('migration runs in PostgreSQL and can be reapplied without losing data', async () => {
  const { rows } = await db.query('SELECT id, name FROM public.users ORDER BY name');
  assert.deepEqual(rows, [{ id: alice, name: 'Alice' }, { id: bob, name: 'Bob' }]);
  await db.exec(migration);
  assert.equal((await db.query('SELECT count(*)::int AS total FROM public.users')).rows[0].total, 2);
});
test('atomic daily and sleep functions preserve other measurements', async () => {
  await asUser(alice);
  await db.query('SELECT * FROM public.save_daily_log($1)', [{ mood_score: 8, notes: 'Synthetic' }]);
  await db.query('SELECT * FROM public.save_sleep_log($1)', [{ bedTime: '23:00', wakeTime: '07:00', hours: 8, quality: 75 }]);
  await db.query('SELECT * FROM public.save_daily_log($1)', [{ mood_score: 9 }]);
  const { rows } = await db.query('SELECT mood_score, sleep_hours::float8 AS sleep_hours, notes FROM public.daily_logs');
  assert.deepEqual(rows, [{ mood_score: 9, sleep_hours: 8, notes: 'Synthetic' }]);
  await assert.rejects(db.query('SELECT * FROM public.save_sleep_log($1)', [{ hours: -1 }]), error => error.code === '23514');
  assert.equal((await db.query('SELECT sleep_hours::float8 AS hours FROM public.daily_logs')).rows[0].hours, 8);
  assert.equal(await count('sleep_logs', alice), 1);
});
test('RLS prevents another account from reading or inserting someone else’s data', async () => {
  await asUser(bob);
  assert.deepEqual((await db.query('SELECT * FROM public.daily_logs')).rows, []);
  assert.deepEqual((await db.query('SELECT * FROM public.sleep_logs')).rows, []);
  await assert.rejects(db.query('INSERT INTO public.reflections(user_id, text) VALUES ($1, $2)', [alice, 'Synthetic']), error => error.code === '42501');
  await db.query('SELECT * FROM public.save_daily_log($1)', [{ mood_score: 5 }]);
  assert.equal(await count('daily_logs', bob), 1);
});
test('settings merge patches and remain private between accounts', async () => {
  await asUser(alice);
  await db.query('SELECT public.save_app_settings($1)', [{ theme: 'light', accent_color: 'rose' }]);
  await db.query('SELECT public.save_app_settings($1)', [{ theme: 'dark' }]);
  assert.deepEqual((await db.query('SELECT preferences FROM public.app_settings')).rows[0].preferences, { theme: 'dark', accent_color: 'rose' });
  await asUser(bob);
  assert.deepEqual((await db.query('SELECT * FROM public.app_settings')).rows, []);
});
test('wellness deletion clears only the current account and keeps its profile', async () => {
  await asUser(bob);
  await db.query('SELECT public.delete_wellness_data()');
  assert.equal(await count('daily_logs', bob), 0);
  assert.equal((await db.query('SELECT id FROM public.users')).rows[0].id, bob);
  await asUser(alice);
  assert.equal(await count('daily_logs', alice), 1);
});
test('Auth deletion removes all wellness records transactionally', async () => {
  await asUser(alice);
  await db.query('INSERT INTO public.reflections(user_id, text) VALUES ($1, $2)', [alice, 'Synthetic']);
  await db.query("INSERT INTO public.conversations(user_id, agent_type, role, message) VALUES ($1, 'CompanionBot', 'user', 'Synthetic')", [alice]);
  await db.query("INSERT INTO public.assessments(user_id, questionnaire, answers) VALUES ($1, 'PSS-10', '[]')", [alice]);
  await db.query("INSERT INTO public.user_sessions(user_id, session_type) VALUES ($1, 'assessment')", [alice]);
  await db.exec('RESET ROLE');
  await db.query('DELETE FROM auth.users WHERE id = $1', [alice]);
  for (const table of ['daily_logs', 'sleep_logs', 'reflections', 'conversations', 'assessments', 'user_sessions', 'app_settings']) {
    assert.equal(await count(table, alice), 0, table);
  }
  assert.equal((await db.query('SELECT id FROM public.users')).rows[0].id, bob);
});
