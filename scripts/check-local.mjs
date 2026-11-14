import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const web = 'http://127.0.0.1:3000';
const api = 'http://127.0.0.1:8000';
const schoolDemo = process.argv.includes('--school-demo');
const health = await fetch(api + '/health');
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.service, 'aura-api');
assert.equal(healthBody.schoolDemo, schoolDemo, `Expected schoolDemo=${schoolDemo}`);
const login = await fetch(web + '/login');
assert.equal(login.status, 200);
const html = await login.text();
const asset = html.match(/(?:src|href)="([^"]*\/_next\/static\/[^\"]+)"/);
assert.ok(asset, 'The login page must reference a static build asset.');
const staticFile = await fetch(new URL(asset[1].replaceAll('&amp;', '&'), web));
assert.equal(staticFile.status, 200);
await staticFile.arrayBuffer();
const quarantinedAudio = await fetch(web + '/audio/balance.mp3', { method: 'HEAD' });
assert.equal(quarantinedAudio.status, 404, 'Quarantined audio must not be distributed by the web build.');
const approvedAudio = {
  'balance-gentle-rain-loop.wav': 'F02BFA11CD744D6E9AED63F79F36E6B6419A9FB0F2B2B8C1BA82191663CED824',
  'focus-waterfall-loop.wav': '3207C9D6F8CA764554242F6C8668C695A087C85CD39310051F4A386D97D9335A',
  'sleep-brown-wind-loop.wav': '735ECE55193CAB9271B673ECB2513B8D29662936F3C2D6D3CD83C70CC036EA92'
};
for (const [file, expectedHash] of Object.entries(approvedAudio)) {
  const response = await fetch(`${web}/audio/${file}`);
  assert.equal(response.status, 200, `${file} must be distributed by the web build.`);
  const hash = crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex').toUpperCase();
  assert.equal(hash, expectedHash, file);
}
for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3000']) {
  const allowed = await fetch(api + '/health', { headers: { Origin: origin } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
  await allowed.arrayBuffer();
}
const denied = await fetch(api + '/health', { headers: { Origin: 'https://untrusted.invalid' } });
assert.equal(denied.status, 403);
await denied.arrayBuffer();
for (const page of ['privacy', 'terms']) {
  const response = await fetch(web + '/' + page);
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.ok(text.includes('Leonardo Pierre Gonçales e Matheus Esaka Silva'));
  assert.ok(text.includes('leogoncales07@gmail.com'));
}
console.log(JSON.stringify({ health: 'ok', schoolDemo, standalone: 'ok', staticAsset: 'ok', approvedAudio: 'verified', quarantinedAudio: 'not-distributed', legalPages: 'ok', cors: 'ok' }));
