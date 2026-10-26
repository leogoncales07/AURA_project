import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateText } from '../src/services/geminiService.js';

const original = { fetch: globalThis.fetch, key: process.env.G_KEY, model: process.env.GEMINI_MODEL, enabled: process.env.GEMINI_ENABLED };
const contents = [{ role: 'user', parts: [{ text: 'Synthetic test' }] }];
after(() => {
  globalThis.fetch = original.fetch;
  for (const [key, value] of [['G_KEY', original.key], ['GEMINI_MODEL', original.model], ['GEMINI_ENABLED', original.enabled]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
test('no remote request when Gemini is disabled or not configured', async () => {
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  delete process.env.G_KEY;
  assert.equal((await generateText({ contents })).reason, 'disabled');
  process.env.G_KEY = 'test-secret'; process.env.GEMINI_ENABLED = 'false';
  assert.equal((await generateText({ contents })).reason, 'disabled');
  delete process.env.GEMINI_ENABLED;
});
test('uses the existing key in a header, caps output and parses all visible parts', async () => {
  process.env.G_KEY = 'test-secret'; process.env.GEMINI_MODEL = 'gemini-2.5-flash';
  globalThis.fetch = async (url, options) => {
    assert.ok(!url.includes('test-secret')); assert.ok(!url.includes('?key='));
    assert.equal(options.headers['x-goog-api-key'], 'test-secret');
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.maxOutputTokens, 512);
    assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
    return json({ candidates: [{ content: { parts: [{ thought: true, text: 'hidden' }, { text: 'Hello ' }, { text: 'world' }] } }], usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 } });
  };
  const result = await generateText({ contents });
  assert.equal(result.text, 'Hello world');
  assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 3, totalTokens: 15 });
});
test('quota exhaustion and network errors return a usable fallback signal', async () => {
  globalThis.fetch = async () => json({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429);
  assert.equal((await generateText({ contents })).reason, 'quota');
  globalThis.fetch = async () => { throw new Error('Network unavailable'); };
  assert.equal((await generateText({ contents })).reason, 'unavailable');
});
test('invalid model names cannot change the request destination', async () => {
  process.env.GEMINI_MODEL = '../another-model?key=bad';
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  assert.equal((await generateText({ contents })).reason, 'configuration');
});
