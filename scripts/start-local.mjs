import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateFile = path.join(root, 'tmp', 'aura-local-processes.json');
const expoGo = process.argv.includes('--expo-go');
const schoolDemo = process.argv.includes('--school-demo');
const lan = expoGo || process.argv.includes('--lan');

const processIsAlive = pid => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
};

if (fs.existsSync(stateFile)) {
  let previous;
  try { previous = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}
  if (processIsAlive(previous?.ownerPid)) {
    console.error(`A AURA já parece estar em execução (PID ${previous.ownerPid}). Use STOP_AURA.bat antes de iniciar novamente.`);
    process.exit(1);
  }
  try {
    fs.unlinkSync(stateFile);
    console.log('Foi removido um estado temporário obsoleto de uma execução anterior.');
  } catch (error) {
    console.error(`Não foi possível remover o estado temporário obsoleto: ${error.message}`);
    process.exit(1);
  }
}

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
  { name: 'API', cwd: 'backend', script: 'src/index.js', env: { PORT: '8000', AURA_BIND_HOST: lan ? '0.0.0.0' : '127.0.0.1', NODE_ENV: 'production', ...(schoolDemo ? { AURA_SCHOOL_DEMO: 'true', GEMINI_ENABLED: 'false' } : {}), ...(lan ? { CORS_ORIGINS: `http://localhost:3000,http://127.0.0.1:3000,http://${lanAddress}:3000` } : {}) } },
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
  const active = [...children];
  for (const child of active) {
    if (process.platform === 'win32' && child.pid) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      child.kill('SIGTERM');
    }
  }
  try { fs.unlinkSync(stateFile); } catch {}
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
process.on('SIGHUP', () => stop());
for (const service of services) {
  const child = spawn(process.execPath, [...flags, service.script, ...(service.args || [])], {
    cwd: path.join(root, service.cwd), stdio: 'inherit', env: { ...process.env, ...service.env },
  });
  children.add(child);
  child.on('error', () => { console.error(`${service.name}: não foi possível iniciar.`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) stop(code || 0); });
}
let monitor;
if (process.platform === 'win32') {
  monitor = spawn(process.execPath, [path.join(root, 'scripts/monitor-local-processes.mjs'), String(process.pid), stateFile, ...[...children].map(child => String(child.pid))], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  monitor.unref();
}
fs.mkdirSync(path.dirname(stateFile), { recursive: true });
fs.writeFileSync(stateFile, `${JSON.stringify({
  ownerPid: process.pid,
  monitorPid: monitor?.pid || null,
  startedAt: new Date().toISOString(),
  services: [...children].map((child, index) => ({ name: services[index].name, pid: child.pid }))
}, null, 2)}\n`, { flag: 'wx' });
console.log('AURA local: http://localhost:3000 | API: http://localhost:8000/health');
if (lan) console.log(`Telemóvel na mesma rede: API http://${lanAddress}:8000/health | Web http://${lanAddress}:3000`);
if (expoGo) console.log('Leia o QR code do Metro com o Expo Go. Este arranque não publica a aplicação.');
if (schoolDemo) console.log('MODO ESCOLAR: Gemini bloqueado no backend; use apenas a conta e os dados fictícios preparados.');
console.log('Use Ctrl+C para parar os serviços deste arranque.');
