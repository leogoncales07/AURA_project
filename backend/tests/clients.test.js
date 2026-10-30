import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { serviceUrl } from '../../mobile/lib/dev-server.mjs';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key),
    async multiRemove(keys) { keys.forEach(key => values.delete(key)); }, async multiSet(pairs) { pairs.forEach(([key, value]) => values.set(key, value)); },
    async getAllKeys() { return [...values.keys()]; } };
}
async function client(platform, fetch) {
  const mobile = platform === 'mobile';
  const path = mobile ? '../../mobile/lib/api.js' : '../../frontend/src/lib/api.js';
  let source = await fs.readFile(new URL(path, import.meta.url), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replaceAll('export ', '');
  const local = storage(), session = storage();
  local.setItem('aura_token', 'expired'); local.setItem('aura_refresh_token', 'refresh'); local.setItem('aura_user', '{"id":"alice"}');
  const context = vm.createContext({ fetch, localStorage: local, sessionStorage: session, AsyncStorage: local,
    window: { location: { port: '3000', protocol: 'http:', hostname: 'localhost' }, dispatchEvent() {} },
    Constants: {}, serviceUrl, __DEV__: true, process: { env: {} }, console, AbortController, setTimeout, clearTimeout, Event,
  });
  vm.runInContext(source + '\nglobalThis.client = { api, clearSession };', context);
  return { ...context.client, local, session };
}

for (const platform of ['web', 'mobile']) {
  test(`${platform}: concurrent 401s refresh once and retry with the new token`, async () => {
    let refreshes = 0, attempts = 0;
    const c = await client(platform, async (url, options) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes++;
        await new Promise(resolve => setTimeout(resolve, 15));
        return json({ access_token: 'renewed', refresh_token: 'rotated' });
      }
      attempts++;
      return options.headers.Authorization === 'Bearer renewed' ? json({ logs: [] }) : json({ error: { message: 'Expired' } }, 401);
    });
    const results = await Promise.all([c.api.getLogs('alice'), c.api.getLogs('alice')]);
    assert.equal(refreshes, 1); assert.equal(attempts, 4);
    assert.ok(results.every(result => result.status === 200));
    assert.equal(c.local.getItem('aura_refresh_token'), 'rotated');
  });
  test(`${platform}: rejected refresh clears credentials without retry loops`, async () => {
    let calls = 0;
    const c = await client(platform, async () => { calls++; return json({ error: { message: 'Expired' } }, 401); });
    assert.equal((await c.api.getLogs('alice')).status, 401);
    assert.equal(calls, 2); assert.equal(c.local.getItem('aura_token'), null);
    assert.equal(c.local.getItem('aura_refresh_token'), null);
  });
  test(`${platform}: network failures while refreshing preserve the session for retry`, async () => {
    const c = await client(platform, async url => {
      if (url.endsWith('/auth/refresh')) throw new Error('Offline');
      return json({ message: 'Expired' }, 401);
    });
    assert.equal((await c.api.getLogs('alice')).status, 503);
    assert.equal(c.local.getItem('aura_refresh_token'), 'refresh');
  });
  test(`${platform}: login errors do not refresh a previous session`, async () => {
    let calls = 0;
    const c = await client(platform, async () => { calls++; return json({ error: { message: 'Invalid credentials' } }, 401); });
    const result = await c.api.login('invalid@example.com', 'wrong');
    assert.equal(result.error, 'Invalid credentials'); assert.equal(calls, 1);
  });
  test(`${platform}: password reset uses its recovery token without refreshing`, async () => {
    const c = await client(platform, async (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer recovery');
      assert.ok(url.endsWith('/auth/reset-password'));
      return json({ status: 'success' });
    });
    assert.equal((await c.api.resetPassword('new-password', 'recovery')).status, 200);
  });
}
