import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const resolveFromProject = value => path.resolve(projectRoot, value);
const readEnv = async relativePath => dotenv.parse(await fs.readFile(resolveFromProject(relativePath), 'utf8').catch(() => ''));
const readJson = async relativePath => JSON.parse(await fs.readFile(resolveFromProject(relativePath), 'utf8'));
const exists = async relativePath => fs.access(resolveFromProject(relativePath)).then(() => true).catch(() => false);
const isPlaceholder = value => !value || /YOUR_|CHANGE_ME|EXAMPLE|localhost|127\.0\.0\.1/i.test(value);
const isHttps = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const storeUrl = (value, hostname) => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === hostname; } catch { return false; }
};

const backendEnvFile = argument('--backend-env', 'backend/.env');
const frontendEnvFile = argument('--frontend-env', 'frontend/.env.local');
const mobileEnvFile = argument('--mobile-env', 'mobile/.env');
const [backend, frontend, mobile, decisions, rights, appConfig] = await Promise.all([
  readEnv(backendEnvFile),
  readEnv(frontendEnvFile),
  readEnv(mobileEnvFile),
  readJson('docs/release-decisions.json'),
  readJson('docs/content-rights.json'),
  readJson('mobile/app.json')
]);

const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });

add('backend-production-mode', backend.NODE_ENV === 'production', 'NODE_ENV must be production.');
add('school-mode-disabled', backend.AURA_SCHOOL_DEMO === 'false', 'AURA_SCHOOL_DEMO must be explicitly false for a public release.');
add('supabase-configured', ['S_URL', 'S_ANON', 'S_SERV'].every(key => !isPlaceholder(backend[key])), 'Supabase URL and keys must be configured without placeholders.');
add('password-reset-https', isHttps(backend.PASSWORD_RESET_URL) && !isPlaceholder(backend.PASSWORD_RESET_URL), 'PASSWORD_RESET_URL must be a final HTTPS URL.');
const cors = (backend.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
add('cors-explicit-https', cors.length > 0 && !cors.includes('*') && cors.every(isHttps), 'CORS_ORIGINS must contain explicit HTTPS origins and never *.');
add('frontend-api-https', isHttps(frontend.NEXT_PUBLIC_API_URL) && !isPlaceholder(frontend.NEXT_PUBLIC_API_URL), 'The web API URL must be final and HTTPS.');
add('mobile-api-https', isHttps(mobile.EXPO_PUBLIC_API_URL) && !isPlaceholder(mobile.EXPO_PUBLIC_API_URL), 'The mobile API URL must be final and HTTPS.');
add('mobile-web-https', isHttps(mobile.EXPO_PUBLIC_WEB_URL) && !isPlaceholder(mobile.EXPO_PUBLIC_WEB_URL), 'The mobile legal/web URL must be final and HTTPS.');
add('legal-identity-configured', !isPlaceholder(frontend.AURA_LEGAL_ENTITY) && !isPlaceholder(frontend.NEXT_PUBLIC_SUPPORT_EMAIL), 'Legal identity and public support email must be configured.');

add('service-owner-decided', Boolean(decisions.serviceOwner), 'Identify the responsible service owner.');
add('public-contact-decided', Boolean(decisions.publicContactEmail && decisions.publicContactAddress), 'Provide public email and appropriate contact address.');
add('minimum-age-decided', Number.isInteger(decisions.publicMinimumAge) && decisions.publicMinimumAge > 0, 'Set the public minimum age.');
add('domain-confirmed', Boolean(decisions.domain && decisions.domainOwnershipConfirmed), 'Record the final domain and confirm ownership.');
add('name-search-confirmed', decisions.trademarkSearchConfirmed === true, 'Confirm the name/domain trademark search.');
add('retention-decided', Number.isInteger(decisions.retentionDays) && Number.isInteger(decisions.backupRetentionDays), 'Set data and backup retention periods.');
add('hosting-decided', Boolean(decisions.hostingProvider && decisions.hostingRegion), 'Record hosting provider and region.');
add('supplier-terms-reviewed', decisions.dpaReviewed?.supabase === true && decisions.dpaReviewed?.hosting === true && (decisions.geminiPublicUse === 'disabled' || decisions.dpaReviewed?.googleGemini === true), 'Review the applicable supplier terms/DPAs.');
add('legal-review-complete', decisions.legalReviewStatus === 'approved', 'Privacy policy and terms are still drafts.');
const targetStores = Array.isArray(decisions.targetStores) ? decisions.targetStores : [];
const validStoreTargets = targetStores.length > 0 && targetStores.every(store => ['googlePlay', 'appStore'].includes(store));
add('target-stores-decided', validStoreTargets, 'Choose at least one target store: googlePlay and/or appStore.');
add('google-play-release', !targetStores.includes('googlePlay') || (Boolean(decisions.googlePlayAccountOwner) && storeUrl(frontend.NEXT_PUBLIC_GOOGLE_PLAY_URL, 'play.google.com')), 'Google Play requires its account owner and final listing URL when selected.');
add('app-store-release', !targetStores.includes('appStore') || (Boolean(decisions.appleDeveloperAccountOwner) && storeUrl(frontend.NEXT_PUBLIC_APP_STORE_URL, 'apps.apple.com')), 'App Store requires its account owner and final listing URL when selected.');
add('mobile-identifiers-confirmed', decisions.mobileIdentifiersConfirmed === true, `Confirm Android/iOS identifiers (${appConfig.expo?.android?.package || 'missing'} / ${appConfig.expo?.ios?.bundleIdentifier || 'missing'}).`);

if (decisions.geminiPublicUse === 'enabled') {
  add('gemini-runtime-enabled', backend.GEMINI_ENABLED === 'true' && !isPlaceholder(backend.G_KEY), 'Gemini is declared enabled but its production configuration is incomplete.');
  add('gemini-eea-paid-confirmed', decisions.geminiEeaPaidServiceConfirmed === true, 'Confirm the applicable paid Gemini service for public EEA use.');
  add('gemini-age-compatible', Number.isInteger(decisions.publicMinimumAge) && decisions.publicMinimumAge >= 18, 'Public Gemini use requires the chosen audience to be compatible with the applicable terms.');
} else {
  add('gemini-public-decision', decisions.geminiPublicUse === 'disabled' && backend.GEMINI_ENABLED === 'false', 'Choose enabled or disabled; if disabled, set GEMINI_ENABLED=false.');
}

for (const asset of rights.assets) {
  let hashesMatch = true;
  if (asset.sha256) {
    for (const file of asset.files) {
      const data = await fs.readFile(resolveFromProject(file)).catch(() => null);
      const hash = data ? crypto.createHash('sha256').update(data).digest('hex').toUpperCase() : null;
      if (hash !== asset.sha256.toUpperCase()) hashesMatch = false;
    }
  }
  add(`rights-${asset.id}`, asset.distributionAllowed === true && hashesMatch, `${asset.id}: ${asset.status}; evidence: ${asset.evidence || 'missing'}.`);
}

add('incident-procedure-present', await exists('docs/INCIDENT_RESPONSE.md'), 'An incident procedure must be present.');
const privacySource = await fs.readFile(resolveFromProject('frontend/src/app/privacy/page.js'), 'utf8');
const termsSource = await fs.readFile(resolveFromProject('frontend/src/app/terms/page.js'), 'utf8');
add('legal-pages-not-draft', !/Rascunho|Draft for review/i.test(`${privacySource}\n${termsSource}`), 'Remove draft labels only after the texts are actually finalized and approved.');

const blockers = checks.filter(check => !check.ok);
const report = {
  ready: blockers.length === 0,
  configurationFiles: { backend: backendEnvFile, frontend: frontendEnvFile, mobile: mobileEnvFile },
  passed: checks.length - blockers.length,
  total: checks.length,
  blockers
};

console.log(JSON.stringify(report, null, 2));
if (blockers.length) process.exitCode = 1;
