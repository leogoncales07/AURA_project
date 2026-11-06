import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'backend/package.json'));
const dotenv = require('dotenv');
const destination = path.join(root, 'tmp/aura-release', new Date().toISOString().replace(/[:.]/g, '-'));
const groups = {
  '': ['docs', 'scripts', 'README.md', 'START_APP.bat', 'START_MOBILE.bat', 'START_SCHOOL_DEMO.bat', 'STOP_AURA.bat', 'compose.local.yaml', '.gitignore'],
  backend: ['src', 'scripts', 'tests', 'README.md', 'package.json', 'package-lock.json', 'schema.sql', 'Dockerfile', '.dockerignore', '.env.example', '.env.production.example'],
  frontend: ['src', 'public', 'scripts', 'README.md', 'package.json', 'package-lock.json', 'next.config.mjs', 'eslint.config.mjs', 'tsconfig.json', '.gitignore', 'Dockerfile', '.dockerignore', '.env.example', '.env.production.example'],
  mobile: ['app', 'assets', 'components', 'constants', 'i18n', 'lib', 'README.md', 'package.json', 'package-lock.json', 'app.config.js', 'app.json', 'eas.json', 'babel.config.js', 'metro.config.js', 'tsconfig.json', 'eslint.config.js', '.gitignore', '.env.example', '.env.production.example'],
};
// Include the PostCSS config selected by the frontend, without old backup configs.
for (const file of ['postcss.config.mjs', 'postcss.config.js']) {
  try { await fs.access(path.join(root, 'frontend', file)); groups.frontend.push(file); } catch {}
}
await fs.mkdir(destination, { recursive: true, mode: 0o700 });
for (const [directory, entries] of Object.entries(groups)) {
  for (const entry of entries) {
    const source = path.join(root, directory, entry);
    await fs.cp(source, path.join(destination, directory, entry), {
      recursive: true,
      filter: async candidate => {
        const parts = path.relative(root, candidate).split(path.sep);
        if (parts.some(part => ['node_modules', '.git', '.next', 'data', '.expo'].includes(part))) return false;
        return !(await fs.lstat(candidate)).isSymbolicLink();
      },
    });
  }
}
const configured = dotenv.parse(await fs.readFile(path.join(root, 'backend/.env')).catch(() => ''));
const protectedValues = ['G_KEY', 'S_SERV', 'S_ANON', 'O_PASS', 'DATABASE_URL']
  .map(key => configured[key]).filter(value => value && value.length >= 20);
const blockedContentHashes = new Set([
  '4e75a22004904ed97cbc78922f4ace2b145f660735ef3118e9fb8826dd0562f7',
  'a611f0424c0530981310dcfc5e6810732bff221726b344206ee513da8b06159e',
  '8e3198b1a920860d519e244df179dd024939d386e6942f0cf1c7bd1b6a2576e2'
]);
const manifest = [];
async function verify(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await verify(file); continue; }
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) throw new Error('Release contains a private environment file.');
    const contents = await fs.readFile(file);
    if (protectedValues.some(value => contents.includes(Buffer.from(value)))) throw new Error('Release contains a protected environment value. Do not upload it.');
    const sha256 = createHash('sha256').update(contents).digest('hex');
    if (blockedContentHashes.has(sha256)) throw new Error(`Release contains quarantined audio: ${path.relative(destination, file)}`);
    manifest.push({ file: path.relative(destination, file).split(path.sep).join('/'), sha256 });
  }
}
await verify(destination);
await fs.writeFile(path.join(destination, 'SOURCE_MANIFEST.json'), JSON.stringify({ preparedAt: new Date().toISOString(), files: manifest }, null, 2));
console.log(`Source release prepared: ${destination}`);
console.log(`${manifest.length} files verified. No private environment files, configured API keys, legacy data, Git history or node_modules were included.`);
