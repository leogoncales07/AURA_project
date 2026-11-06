import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');

test('school demo template disables external AI by default', async () => {
  const values = dotenv.parse(await fs.readFile(path.join(backendRoot, '.env.school.example'), 'utf8'));

  assert.equal(values.AURA_SCHOOL_DEMO, 'true');
  assert.equal(values.GEMINI_ENABLED, 'false');
  assert.notEqual(values.CORS_ORIGINS, '*');
});

test('web and mobile clients contain no built-in demo credential or fake token', async () => {
  const files = [
    'frontend/src/app/login/page.js',
    'mobile/app/(auth)/login.jsx'
  ];
  const unsafe = /presentation-demo-token|demo123456|demo@aura\.com|demo-presenter/i;

  for (const relativePath of files) {
    const source = await fs.readFile(path.join(projectRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, unsafe, relativePath);
  }
});
