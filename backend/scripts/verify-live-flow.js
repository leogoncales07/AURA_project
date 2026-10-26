import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
if (!process.argv.includes('--run')) {
  console.log('Use --run to create two synthetic Auth accounts, validate the API and RLS, and delete only those accounts. No emails are sent.');
  process.exit(0);
}
if (!process.env.S_SERV) throw new Error('S_SERV is required.');
process.env.NODE_ENV = 'production';
process.env.GEMINI_ENABLED = 'false'; // No test conversations are sent to an AI provider.
const { default: admin, createAuthClient, createUserClient } = await import('../src/services/supabaseService.js');
const { default: app } = await import('../src/app.js');
const runId = randomUUID();
const created = new Set();
const checks = [];
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function checked(request) {
  const { data, error } = await request;
  if (error) throw new Error(`Supabase validation failed (${error.status || error.code || 'unknown'}).`);
  return data;
}
async function account(label) {
  const email = `aura-validation-${label}-${runId}@example.invalid`;
  const password = randomBytes(32).toString('base64url');
  const result = await checked(admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name: `AURA validation ${label}`, aura_validation: runId },
  }));
  created.add(result.user.id);
  const session = await checked(createAuthClient().auth.signInWithPassword({ email, password }));
  assert.equal(session.user.id, result.user.id);
  return { id: result.user.id, token: session.session.access_token, refreshToken: session.session.refresh_token,
    client: createUserClient(session.session.access_token) };
}
async function request(endpoint, owner, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + endpoint, {
    method, headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${owner.token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}
function success(result, expected = 200) {
  assert.equal(result.status, expected, `API status ${result.status}; expected ${expected}.`);
  return result.data;
}
async function count(table, userId) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if (error) throw new Error(`Cannot verify ${table} (${error.code}).`);
  return count;
}
let failure;
try {
  const alice = await account('a');
  const bob = await account('b');
  checks.push('temporary_accounts_and_login');
  success(await request('/api/v1/account/profile', alice));
  assert.equal((await checked(alice.client.from('users').select('id').eq('id', alice.id).single())).id, alice.id);
  checks.push('profile_trigger');

  success(await request('/companion/log', alice, { user_id: alice.id, mood_score: 8, notes: 'Synthetic validation' }));
  success(await request('/companion/sleep', alice, { user_id: alice.id, bedTime: '23:00', wakeTime: '07:00', hours: 8 }));
  const daily = success(await request(`/companion/${alice.id}/logs`, alice)).logs;
  assert.equal(daily.length, 1); assert.equal(daily[0].mood_score, 8); assert.equal(daily[0].sleep_hours, 8);
  success(await request('/companion/reflection', alice, { user_id: alice.id, text: 'Synthetic validation' }));
  const chat = success(await request('/companion/chat', alice, { user_id: alice.id, message: 'Synthetic validation', language: 'en' }));
  assert.ok(chat.conversation_id); assert.equal(chat.messages.length, 2);
  success(await request('/assessments/submit', alice, { user_id: alice.id, questionnaire_id: 'PHQ-9', answers: Array(9).fill(0) }), 201);
  checks.push('mood_sleep_reflection_chat_assessment');

  success(await request('/api/v1/account/profile', alice, { display_name: 'AURA synthetic validation', bio: 'Synthetic validation' }, 'PATCH'));
  success(await request('/api/v1/settings', alice, { theme: 'light', sleep_target_hours: 8 }, 'PATCH'));
  assert.equal(success(await request('/api/v1/settings', alice)).data.theme, 'light');
  checks.push('profile_and_settings_persistence');

  assert.equal((await request(`/companion/${alice.id}/logs`, bob)).status, 403);
  assert.equal((await request('/companion/log', bob, { user_id: alice.id, mood_score: 4 })).status, 403);
  assert.equal((await request(`/companion/${alice.id}/logs`, null)).status, 401);
  for (const table of ['daily_logs', 'sleep_logs', 'reflections', 'conversations', 'assessments', 'app_settings']) {
    const visible = await checked(bob.client.from(table).select('user_id').eq('user_id', alice.id));
    assert.equal(visible.length, 0, `RLS: ${table}`);
  }
  const forbidden = await bob.client.from('reflections').insert({ user_id: alice.id, text: 'Synthetic foreign insertion' });
  assert.equal(forbidden.error?.code, '42501');
  checks.push('api_ownership_and_real_rls');

  const exported = success(await request('/api/v1/account/export', alice, {})).data;
  assert.equal(exported.moodLogs.length, 1); assert.equal(exported.sleepLogs.length, 1);
  assert.equal(exported.reflections.length, 1); assert.equal(exported.assessments.length, 1);
  assert.equal(exported.conversations.length, 1); assert.equal(exported.settings.theme, 'light');
  assert.equal(exported.user.current_token_hash, undefined);
  checks.push('complete_export');

  const renewed = success(await request('/auth/refresh', null, { refresh_token: alice.refreshToken }));
  assert.ok(renewed.access_token); assert.ok(renewed.refresh_token); assert.equal(renewed.user.id, alice.id);
  alice.token = renewed.access_token;
  success(await request('/auth/me', alice));
  checks.push('refresh_and_authenticated_request');

  success(await request('/companion/log', bob, { user_id: bob.id, mood_score: 5 }));
  success(await request('/api/v1/account/wellness-data', bob, { confirm: 'DELETE' }, 'DELETE'));
  assert.equal(await count('daily_logs', bob.id), 0);
  success(await request('/auth/me', bob));
  assert.equal(await count('daily_logs', alice.id), 1);
  checks.push('wellness_deletion_preserves_account_and_other_users');

  success(await request('/api/v1/account/delete', alice, { confirm: 'DELETE' }));
  for (const table of ['daily_logs', 'sleep_logs', 'reflections', 'conversations', 'assessments', 'user_sessions', 'app_settings']) {
    assert.equal(await count(table, alice.id), 0, `Account deletion: ${table}`);
  }
  const deleted = await admin.auth.admin.getUserById(alice.id);
  assert.ok(deleted.error, 'Auth account must be deleted');
  assert.equal((await request('/auth/me', alice)).status, 401);
  success(await request('/auth/me', bob));
  created.delete(alice.id);
  checks.push('account_deletion_auth_cascade_and_token_rejection');
} catch (error) {
  failure = error;
} finally {
  // Only remove IDs created by this exact run, and verify their marker before deleting.
  for (const id of created) {
    try {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error?.status === 404) continue;
      if (error || data.user.user_metadata?.aura_validation !== runId) throw new Error('Temporary account cleanup guard failed.');
      const deletion = await admin.auth.admin.deleteUser(id);
      if (deletion.error) throw new Error('Temporary account cleanup failed.');
      const verify = await admin.auth.admin.getUserById(id);
      if (!verify.error) throw new Error('Temporary account still exists after cleanup.');
    } catch (error) { failure ||= error; }
  }
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  const { default: pool } = await import('../src/db/db.js');
  await pool.end();
  const { default: redis } = await import('../src/services/cacheService.js');
  if (redis.isOpen) await redis.quit();
}
console.log(JSON.stringify({ checks, passed: !failure, temporaryAccountCleanup: !failure ? 'verified' : 'check required' }, null, 2));
if (failure) { console.error(failure.message); process.exitCode = 1; }
