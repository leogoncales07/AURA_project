import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');
const envFlagIndex = process.argv.indexOf('--env');
const envName = envFlagIndex >= 0 ? process.argv[envFlagIndex + 1] : '.env';

if (!envName || envName.startsWith('-')) {
  throw new Error('Use --env followed by a file path, for example --env .env.school.example');
}

const envPath = path.resolve(backendRoot, envName);
const values = dotenv.parse(await fs.readFile(envPath, 'utf8'));
const corsOrigins = (values.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);

const inspectedSources = [
  'frontend/src/app/login/page.js',
  'mobile/app/(auth)/login.jsx',
  'frontend/src/app/meditations/page.js',
  'mobile/app/(tabs)/meditations.jsx',
  'backend/src/controllers/libraryController.js'
];
const sourceText = (await Promise.all(inspectedSources.map(async relativePath => ({
  relativePath,
  text: await fs.readFile(path.join(projectRoot, relativePath), 'utf8')
}))));
const unsafeDemoCredential = /presentation-demo-token|demo123456|demo@aura\.com|demo-presenter/i;
const quarantinedAudioReference = /(?:balance|focus|sleep)\.mp3/i;

const checks = {
  schoolModeEnabled: values.AURA_SCHOOL_DEMO === 'true',
  geminiExplicitlyDisabled: values.GEMINI_ENABLED === 'false',
  explicitCorsOrigins: corsOrigins.length > 0 && !corsOrigins.includes('*'),
  passwordResetUrlConfigured: /^https?:\/\//.test(values.PASSWORD_RESET_URL || ''),
  noDemoCredentialsInClients: sourceText.every(file => !unsafeDemoCredential.test(file.text)),
  noQuarantinedAudioReferences: sourceText.every(file => !quarantinedAudioReference.test(file.text))
};

const warnings = [
  'Use a dedicated Supabase account containing fictional data only; keep its password outside Git.',
  'The quarantined MP3 files must remain outside distributed web/mobile folders.',
  'Expo Go is suitable for the classroom check, but it does not replace a native store-build test.'
];
const ready = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  ready,
  envFile: path.relative(backendRoot, envPath),
  checks,
  warnings
}, null, 2));

if (!ready) process.exitCode = 1;
