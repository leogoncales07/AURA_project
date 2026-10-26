import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoGo = process.argv.includes('--expo-go');
const lan = expoGo || process.argv.includes('--lan');
let lanAddress;
if (lan) {
  const addresses = Object.entries(os.networkInterfaces()).flatMap(([name, rows]) => (rows || [])
    .filter(row => row.family === 'IPv4' && !row.internal && !row.address.startsWith('169.254.'))
    .map(row => ({ name, address: row.address })));
  const requested = process.argv.find(arg => arg.startsWith('--host='))?.slice(7);
  const wifi = addresses.filter(row => /wi-?fi|wireless|wlan/i.test(row.name));
  lanAddress = requested || (wifi.length === 1 ? wifi[0].address : addresses.length === 1 ? addresses[0].address : undefined);
  if (!lanAddress || !addresses.some(row => row.address === lanAddress)) {
    console.error('Indique o IP Wi-Fi deste computador com --host=IP. Existem várias interfaces de rede.');
    process.exit(1);
  }
}
for (const file of ['backend/.env', 'backend/node_modules/express/package.json', 'frontend/.next/standalone/server.js']) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error('Falta preparar a instalação. Consulte docs/SETUP.md. Ficheiro necessário: ' + file);
    process.exit(1);
  }
}
if (expoGo && !fs.existsSync(path.join(root, 'mobile/node_modules/expo/bin/cli'))) {
  console.error('Execute npm ci --prefix mobile antes de iniciar o Expo Go.');
  process.exit(1);
}
const flags = process.allowedNodeEnvironmentFlags.has('--use-system-ca') ? ['--use-system-ca'] : [];
const services = [
  { name: 'API', cwd: 'backend', script: 'src/index.js', env: { PORT: '8000', AURA_BIND_HOST: lan ? '0.0.0.0' : '127.0.0.1', NODE_ENV: 'production', ...(lan ? { CORS_ORIGINS: `http://localhost:3000,http://${lanAddress}:3000` } : {}) } },
  { name: 'Web', cwd: 'frontend', script: '.next/standalone/server.js', env: { PORT: '3000', HOSTNAME: lan ? '0.0.0.0' : '127.0.0.1', NODE_ENV: 'production' } },
];
if (expoGo) services.push({
  name: 'Expo Go', cwd: 'mobile', script: 'node_modules/expo/bin/cli', args: ['start', '--go', '--lan'],
  env: { NODE_ENV: 'development', REACT_NATIVE_PACKAGER_HOSTNAME: lanAddress, EXPO_PUBLIC_API_URL: `http://${lanAddress}:8000`, EXPO_PUBLIC_WEB_URL: `http://${lanAddress}:3000` },
});
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
for (const service of services) {
  const child = spawn(process.execPath, [...flags, service.script, ...(service.args || [])], {
    cwd: path.join(root, service.cwd), stdio: 'inherit', env: { ...process.env, ...service.env },
  });
  children.add(child);
  child.on('error', () => { console.error(`${service.name}: não foi possível iniciar.`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) stop(code || 0); });
}
console.log('AURA local: http://localhost:3000 | API: http://localhost:8000/health');
if (lan) console.log(`Telemóvel na mesma rede: API http://${lanAddress}:8000/health | Web http://${lanAddress}:3000`);
if (expoGo) console.log('Leia o QR code do Metro com o Expo Go. Este arranque não publica a aplicação.');
console.log('Use Ctrl+C para parar os serviços deste arranque.');
