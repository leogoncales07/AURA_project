import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = { ...dotenv.parse(await fs.readFile(path.join(root, '.env')).catch(() => '')), ...process.env };
const frontend = dotenv.parse(await fs.readFile(path.join(root, '../frontend/.env.local')).catch(() => ''));
const configured = key => Boolean(values[key]?.trim());
const result = {
  config: Object.fromEntries(['S_URL', 'S_ANON', 'S_SERV', 'DATABASE_URL', 'G_KEY', 'PASSWORD_RESET_URL', 'CORS_ORIGINS'].map(key => [key, configured(key)])),
  contactConfigured: Boolean(frontend.NEXT_PUBLIC_SUPPORT_EMAIL),
  legalEntityConfigured: Boolean(frontend.AURA_LEGAL_ENTITY),
};
const remote = process.argv.includes('--remote');
async function request(url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  } catch (error) {
    return { failure: error.cause?.code || error.code || error.name };
  }
}
if (remote && values.S_URL && values.S_ANON) {
  const headers = { apikey: values.S_ANON, Authorization: `Bearer ${values.S_ANON}` };
  result.supabase = {};
  const description = await request(`${values.S_URL}/rest/v1/`, { headers: { ...headers, Accept: 'application/openapi+json' } });
  if (description.response?.ok) result.supabase.userIdType = description.body.definitions?.users?.properties?.id?.format || description.body.definitions?.users?.properties?.id?.type || 'unknown';
  for (const table of ['users', 'daily_logs', 'assessments', 'conversations', 'sleep_logs', 'reflections', 'app_settings']) {
    // limit=0 checks schema availability without reading any user's records.
    const check = await request(`${values.S_URL}/rest/v1/${table}?select=*&limit=0`, { headers });
    result.supabase[table] = check.failure ? { networkError: check.failure } : { status: check.response.status, code: check.body?.code || null };
    if (check.failure) break;
  }
}
if (remote && values.G_KEY) {
  const model = values.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(model)) throw new Error('Invalid GEMINI_MODEL');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
  const headers = { 'x-goog-api-key': values.G_KEY, 'Content-Type': 'application/json' };
  const check = await request(endpoint, { headers });
  result.gemini = check.failure ? { networkError: check.failure } : {
    status: check.response.status, model, code: check.body.error?.status || null,
    supportsGeneration: Boolean(check.body.supportedGenerationMethods?.includes('generateContent')),
  };
  if (check.response?.ok && process.argv.includes('--generate')) {
    // Synthetic prompt only; no application records, health data or personal information.
    const smoke = await request(`${endpoint}:generateContent`, { method: 'POST', headers, body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Return only the word OK.' }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 16, thinkingConfig: { thinkingBudget: 0 } },
    }) });
    result.gemini.generation = smoke.failure ? { networkError: smoke.failure } : {
      status: smoke.response.status, code: smoke.body.error?.status || null,
      hasText: Boolean(smoke.body.candidates?.[0]?.content?.parts?.some(part => typeof part.text === 'string' && part.text.trim())),
      inputTokens: smoke.body.usageMetadata?.promptTokenCount ?? null,
      outputTokens: smoke.body.usageMetadata?.candidatesTokenCount ?? null,
      quotaMetrics: (smoke.body.error?.details || []).flatMap(detail => detail.violations || []).map(item => item.quotaMetric).filter(Boolean),
    };
  }
}
console.log(JSON.stringify(result, null, 2));
