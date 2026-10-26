import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';

process.env.S_URL = 'https://supabase.test';
process.env.S_ANON = 'test-anon-key';
process.env.S_SERV = 'test-service-key';
process.env.NODE_ENV = 'production';
process.env.PASSWORD_RESET_URL = 'https://aura.test/reset-password';
const legacyDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'aura-test-'));
process.env.AURA_LEGACY_DATA_URL = pathToFileURL(legacyDirectory + path.sep).href;
const originalFetch = globalThis.fetch;
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
let requests = [], failTable = '', failDelete = false, recoveryFailure = null, server, base;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== 'supabase.test') return originalFetch(input, options);
  const headers = new Headers(options.headers || input.headers);
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  requests.push({ url, method, body, token: headers.get('authorization') });
  if (url.pathname === '/auth/v1/user' && method === 'GET') {
    const id = headers.get('authorization') === 'Bearer bob' ? bob : alice;
    if (headers.get('authorization') === 'Bearer invalid') return json({ msg: 'Invalid token' }, 401);
    return json({ id, email: 'test@example.com', user_metadata: { name: 'Test', id: 'forged-id' } });
  }
  if (url.pathname === '/auth/v1/user' && method === 'PUT') {
    if (failTable === 'profile') return json({ msg: 'Service unavailable' }, 503);
    return json({ id: alice, email: 'test@example.com', user_metadata: body.data });
  }
  if (url.pathname.includes('/auth/v1/admin/users/')) return failDelete ? json({ msg: 'Delete failed' }, 500) : json({});
  if (url.pathname === '/auth/v1/recover') return recoveryFailure ? json({ error_code: recoveryFailure.code, msg: 'Email delivery failed' }, recoveryFailure.status) : json({});
  if (failTable && url.pathname.endsWith('/' + failTable)) return json({ code: '42P01', message: 'Unavailable' }, 503);
  if (url.pathname.endsWith('/app_settings')) return json({ preferences: { theme: 'light' } });
  if (url.pathname.endsWith('/rpc/save_daily_log')) return json([{ id: 'log-id', mood_score: body.payload.mood_score, created_at: new Date().toISOString() }]);
  if (url.pathname.endsWith('/rpc/save_app_settings')) return json(body.payload);
  if (url.pathname.endsWith('/rpc/aura_storage_version')) return json(1);
  return json([]);
};
before(async () => {
  const { default: app } = await import('../src/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  globalThis.fetch = originalFetch;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  const { default: pool } = await import('../src/db/db.js');
  await pool.end();
});
async function call(path, body, token = 'alice', method = body ? 'POST' : 'GET') {
  const response = await originalFetch(base + path, { method, headers: {
    ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json',
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}

test('all wellness routes reject anonymous requests', async () => {
  for (const [path, body] of [
    [`/companion/${alice}/logs`], [`/companion/${alice}/sleep`], [`/companion/${alice}/stats`],
    [`/companion/${alice}/conversations`], ['/companion/log', { user_id: alice, mood_score: 5 }],
    ['/companion/chat', { user_id: alice, message: 'hello' }], ['/companion/reflection', { user_id: alice, text: 'hi' }],
    [`/assessments/${alice}/history`], ['/assessments/submit', { user_id: alice }],
  ]) assert.equal((await call(path, body, null)).status, 401, path);
});
test('health checks work without authentication or database requests', async () => {
  requests = [];
  const result = await call('/health', undefined, null);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: 'ok', service: 'aura-api' });
  assert.equal(requests.length, 0);
});
test('recovery reports delivery configuration and quota failures accurately', async () => {
  recoveryFailure = { code: 'email_address_not_authorized', status: 403 };
  const delivery = await call('/auth/forgot-password', { email: 'test@example.com' }, null);
  assert.equal(delivery.status, 503);
  assert.equal(delivery.body.error.code, 'RECOVERY_DELIVERY_UNAVAILABLE');
  recoveryFailure = { code: 'over_email_send_rate_limit', status: 429 };
  const limited = await call('/auth/forgot-password', { email: 'test@example.com' }, null);
  assert.equal(limited.status, 429);
  assert.equal(limited.body.error.code, 'RECOVERY_RATE_LIMITED');
  recoveryFailure = null;
});
test('ownership cannot be forged through URLs, bodies, or user metadata', async () => {
  requests = [];
  assert.equal((await call(`/companion/${bob}/logs`)).status, 403);
  assert.equal((await call('/companion/log', { user_id: bob, mood_score: 5 })).status, 403);
  assert.equal((await call(`/assessments/${bob}/history`)).status, 403);
  const own = await call(`/companion/${alice}/logs`);
  assert.equal(own.status, 200);
  assert.equal(requests.filter(r => r.url.pathname.startsWith('/rest')).length, 1);
  assert.equal(requests.at(-1).url.searchParams.get('user_id'), 'eq.' + alice);
  assert.equal(requests.at(-1).token, 'Bearer alice');
});
test('invalid answers and mood values cannot be persisted', async () => {
  assert.equal((await call('/companion/log', { user_id: alice, mood_score: 11 })).status, 400);
  assert.equal((await call('/companion/sleep', { user_id: alice, hours: -2 })).status, 400);
  assert.equal((await call('/assessments/submit', { user_id: alice, questionnaire_id: 'PHQ-9', answers: Array(9).fill('3') })).status, 400);
});
test('database outages produce an error instead of false success or local fallback', async () => {
  failTable = 'save_daily_log';
  assert.equal((await call('/companion/log', { user_id: alice, mood_score: 5 })).status, 503);
  failTable = 'daily_logs';
  assert.equal((await call(`/companion/${alice}/logs`)).status, 503);
  failTable = 'profile';
  assert.equal((await call('/api/v1/account/profile', { display_name: 'Alice' }, 'alice', 'PATCH')).status, 503);
  failTable = '';
});
test('profile and settings updates persist remotely', async () => {
  const result = await call('/api/v1/account/profile', { display_name: 'Alice', bio: 'Hello' }, 'alice', 'PATCH');
  assert.equal(result.status, 200);
  assert.equal(result.body.data.name, 'Alice');
  const settings = await call('/api/v1/settings', { theme: 'dark', accent_color: 'violet', sleep_target_hours: 8 }, 'alice', 'PATCH');
  assert.equal(settings.status, 200);
  assert.equal(settings.body.data.theme, 'dark');
  assert.equal((await call('/api/v1/settings', { unexpected: true }, 'alice', 'PATCH')).status, 400);
});
test('export contains conversations and preferences without internal token hashes', async () => {
  const result = await call('/api/v1/account/export', {});
  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.body.data.conversations));
  assert.equal(result.body.data.settings.theme, 'light');
  assert.equal(result.body.data.user.current_token_hash, undefined);
});
test('account deletion calls Supabase Auth and propagates failures', async () => {
  requests = [];
  assert.equal((await call('/api/v1/account/delete', { confirm: 'wrong' })).status, 400);
  failDelete = true;
  assert.equal((await call('/api/v1/account/delete', { confirm: 'DELETE' })).status, 503);
  failDelete = false;
  assert.equal((await call('/api/v1/account/delete', { confirm: 'DELETE' })).status, 200);
  assert.ok(requests.some(r => r.method === 'DELETE' && r.url.pathname.endsWith('/admin/users/' + alice)));
});
test('password recovery uses configured callback, never an arbitrary client redirect', async () => {
  requests = [];
  assert.equal((await call('/auth/forgot-password', { email: 'test@example.com', redirectTo: 'https://evil.test' }, null)).status, 200);
  assert.equal(requests.at(-1).url.searchParams.get('redirect_to'), process.env.PASSWORD_RESET_URL);
});
test('empty dashboard reports no fabricated measurements', async () => {
  const result = await call(`/companion/${alice}/stats`);
  assert.equal(result.status, 200);
  assert.equal(result.body.streak, 0);
  assert.equal(result.body.latestLog.mood_score, null);
  assert.deepEqual(result.body.weeklyMood, Array(7).fill(null));
});
test('missing database migration blocks account deletion before deleting Auth user', async () => {
  requests = []; failTable = 'aura_storage_version';
  assert.equal((await call('/api/v1/account/delete', { confirm: 'DELETE' })).status, 503);
  assert.ok(!requests.some(r => r.method === 'DELETE' && r.url.pathname.includes('/admin/users/')));
  failTable = '';
});
test('concurrent legacy cleanup cannot restore another deleted user', async () => {
  const file = path.join(legacyDirectory, 'logs.json');
  await fs.writeFile(file, JSON.stringify({ [alice]: [{ mood_score: 5 }], [bob]: [{ mood_score: 7 }], survivor: [] }));
  const { purgeLegacyData } = await import('../src/services/legacyDataService.js');
  await Promise.all([purgeLegacyData(alice), purgeLegacyData(bob)]);
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), { survivor: [] });
});
