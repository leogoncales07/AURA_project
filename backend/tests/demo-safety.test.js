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

test('mobile daily reminder verifies permission, restores safely and offers a local test', async () => {
  const notifications = await fs.readFile(path.join(projectRoot, 'mobile/lib/notifications.js'), 'utf8');
  const layout = await fs.readFile(path.join(projectRoot, 'mobile/app/(tabs)/_layout.jsx'), 'utf8');
  const settings = await fs.readFile(path.join(projectRoot, 'mobile/components/SettingsModal.jsx'), 'utf8');

  assert.match(notifications, /getPermissionsAsync/);
  assert.match(notifications, /setNotificationChannelAsync/);
  assert.match(notifications, /SchedulableTriggerInputTypes\.DAILY/);
  assert.match(notifications, /export async function restoreDailyReminder/);
  assert.match(notifications, /export async function sendTestReminder/);
  assert.match(layout, /restoreDailyReminder/);
  assert.match(settings, /sendTestReminder/);
});

test('approved procedural soundscapes are referenced by web and mobile without legacy MP3s', async () => {
  const web = await fs.readFile(path.join(projectRoot, 'frontend/src/app/meditations/page.js'), 'utf8');
  const mobile = await fs.readFile(path.join(projectRoot, 'mobile/app/(tabs)/meditations.jsx'), 'utf8');
  const combined = `${web}\n${mobile}`;

  for (const file of [
    'balance-gentle-rain-loop.wav',
    'focus-waterfall-loop.wav',
    'sleep-brown-wind-loop.wav'
  ]) assert.match(combined, new RegExp(file.replaceAll('.', '\\.'), 'i'), file);

  assert.doesNotMatch(combined, /\.(?:mp3)\b/i);
});
