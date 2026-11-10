import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requested = process.argv[2];
let releaseRoot;
if (requested) {
  releaseRoot = path.resolve(process.cwd(), requested);
} else {
  const releaseBase = path.join(sourceRoot, 'tmp', 'aura-release');
  const candidates = await fs.readdir(releaseBase, { withFileTypes: true }).catch(() => []);
  const latest = candidates.filter(entry => entry.isDirectory()).map(entry => entry.name).sort().at(-1);
  if (!latest) throw new Error('No prepared release was found. Run node scripts/prepare-release.mjs first.');
  releaseRoot = path.join(releaseBase, latest);
}

const manifestPath = path.join(releaseRoot, 'SOURCE_MANIFEST.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const expected = new Map(manifest.files.map(entry => [entry.file, entry.sha256]));
if (expected.size !== manifest.files.length) throw new Error('SOURCE_MANIFEST.json contains duplicate file paths.');

const blockedContentHashes = new Set([
  '4e75a22004904ed97cbc78922f4ace2b145f660735ef3118e9fb8826dd0562f7',
  'a611f0424c0530981310dcfc5e6810732bff221726b344206ee513da8b06159e',
  '8e3198b1a920860d519e244df179dd024939d386e6942f0cf1c7bd1b6a2576e2'
]);
const forbiddenDirectories = new Set(['.git', 'node_modules', '.next', '.expo', 'data', 'tmp']);
const parseEnvironment = text => Object.fromEntries(text.split(/\r?\n/).flatMap(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return [];
  const separator = trimmed.indexOf('=');
  if (separator < 1) return [];
  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return [[key, value]];
}));
const configured = parseEnvironment(await fs.readFile(path.join(sourceRoot, 'backend/.env'), 'utf8').catch(() => ''));
const protectedValues = ['G_KEY', 'S_SERV', 'S_ANON', 'O_PASS', 'DATABASE_URL']
  .map(key => configured[key]).filter(value => value && value.length >= 20);
const actual = new Map();

async function inspect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(releaseRoot, absolute).split(path.sep).join('/');
    const parts = relative.split('/');
    if (parts.some(part => forbiddenDirectories.has(part))) throw new Error(`Forbidden directory in release: ${relative}`);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in release: ${relative}`);
    if (entry.isDirectory()) { await inspect(absolute); continue; }
    if (relative === 'SOURCE_MANIFEST.json') continue;
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) throw new Error(`Private environment file in release: ${relative}`);
    const contents = await fs.readFile(absolute);
    if (protectedValues.some(value => contents.includes(Buffer.from(value)))) throw new Error(`Configured secret found in release: ${relative}`);
    const sha256 = createHash('sha256').update(contents).digest('hex');
    if (blockedContentHashes.has(sha256)) throw new Error(`Quarantined audio found in release: ${relative}`);
    actual.set(relative, sha256);
  }
}

await inspect(releaseRoot);
const missing = [...expected.keys()].filter(file => !actual.has(file));
const extra = [...actual.keys()].filter(file => !expected.has(file));
const changed = [...actual.entries()].filter(([file, hash]) => expected.has(file) && expected.get(file) !== hash).map(([file]) => file);
if (missing.length || extra.length || changed.length) {
  throw new Error(`Release manifest mismatch. Missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}; changed: ${changed.join(', ') || 'none'}.`);
}

console.log(JSON.stringify({
  verified: true,
  releaseRoot,
  files: actual.size,
  preparedAt: manifest.preparedAt,
  privateEnvironmentFiles: 0,
  configuredSecrets: 0,
  quarantinedAudioFiles: 0,
  forbiddenDirectories: 0,
  manifestMismatch: 0
}, null, 2));
