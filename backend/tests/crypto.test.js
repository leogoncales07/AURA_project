import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { encrypt, decrypt } from '../src/utils/crypto.js';

const originalKey = process.env.ENCRYPTION_KEY;
const testKey = 'synthetic-test-key-for-aura-crypto-only-2026';
after(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});

test('missing or weak encryption configuration refuses secret storage without breaking module import', () => {
  for (const key of [undefined, '', 'aura-master-key-2024', ' '.repeat(64)]) {
    if (key === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = key;
    assert.throws(() => encrypt('synthetic secret'), error => error.statusCode === 503);
    assert.throws(() => decrypt({}), error => error.statusCode === 503);
  }
});

test('encrypted secrets round-trip and repeated values use different nonces', () => {
  process.env.ENCRYPTION_KEY = testKey;
  const first = encrypt('Synthetic token — ação');
  const second = encrypt('Synthetic token — ação');
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.content, second.content);
  assert.equal(decrypt(first), 'Synthetic token — ação');
  assert.equal(decrypt(second), 'Synthetic token — ação');
});

test('tampering, truncated tags and a different key cannot decrypt a secret', () => {
  process.env.ENCRYPTION_KEY = testKey;
  const payload = encrypt('Synthetic token');
  const changed = (payload.content.startsWith('00') ? '01' : '00') + payload.content.slice(2);
  assert.throws(() => decrypt({ ...payload, content: changed }));
  assert.throws(() => decrypt({ ...payload, tag: payload.tag.slice(0, 8) }));
  assert.throws(() => decrypt({ ...payload, iv: 'not-an-iv' }));
  process.env.ENCRYPTION_KEY = 'another-synthetic-key-for-aura-tests-2026';
  assert.throws(() => decrypt(payload));
});

test('existing AES-GCM records with a configured strong key remain readable', () => {
  process.env.ENCRYPTION_KEY = testKey;
  const iv = Buffer.alloc(12, 7);
  const legacyCipher = crypto.createCipheriv('aes-256-gcm', crypto.scryptSync(testKey, 'salt', 32), iv);
  const content = Buffer.concat([legacyCipher.update('Legacy synthetic token', 'utf8'), legacyCipher.final()]);
  assert.equal(decrypt({ iv: iv.toString('hex'), content: content.toString('hex'), tag: legacyCipher.getAuthTag().toString('hex') }), 'Legacy synthetic token');
});
