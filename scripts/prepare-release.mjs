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
  '': ['docs', 'scripts', 'README.md', 'START_APP.bat', 'START_MOBILE.bat', 'compose.local.yaml', '.gitignore'],
  backend: ['src', 'scripts', 'tests', 'README.md', 'package.json', 'package-lock.json', 'schema.sql', 'Dockerfile', '.dockerignore', '.env.example', '.env.production.example'],
  frontend: ['src', 'public', 'scripts', 'README.md', 'package.json', 'package-lock.json', 'next.config.mjs', 'eslint.config.mjs', 'tsconfig.json', '.gitignore', 'Dockerfile', '.dockerignore', '.env.example', '.env.production.example'],
  mobile: ['app', 'assets', 'components', 'constants', 'i18n', 'lib', 'README.md', 'package.json', 'package-lock.json', 'app.config.js', 'app.json', 'eas.json', 'babel.config.js', 'tsconfig.json', 'eslint.config.js', '.gitignore', '.env.example', '.env.production.example'],
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
const manifest = [];
async function verify(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await verify(file); continue; }
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) throw new Error('Release contains a private environment file.');
    const contents = await fs.readFile(file);
    if (protectedValues.some(value => contents.includes(Buffer.from(value)))) throw new Error('Release contains a protected environment value. Do not upload it.');
    manifest.push({ file: path.relative(destination, file).split(path.sep).join('/'), sha256: createHash('sha256').update(contents).digest('hex') });
  }
}
await verify(destination);
await fs.writeFile(path.join(destination, 'SOURCE_MANIFEST.json'), JSON.stringify({ preparedAt: new Date().toISOString(), files: manifest }, null, 2));
console.log(`Source release prepared: ${destination}`);
console.log(`${manifest.length} files verified. No private environment files, configured API keys, legacy data, Git history or node_modules were included.`);
