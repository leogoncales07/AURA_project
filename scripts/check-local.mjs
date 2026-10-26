import assert from 'node:assert/strict';

const web = 'http://127.0.0.1:3000';
const api = 'http://127.0.0.1:8000';
const health = await fetch(api + '/health');
assert.equal(health.status, 200);
assert.equal((await health.json()).service, 'aura-api');
const login = await fetch(web + '/login');
assert.equal(login.status, 200);
const html = await login.text();
const asset = html.match(/(?:src|href)="([^"]*\/_next\/static\/[^\"]+)"/);
assert.ok(asset, 'The login page must reference a static build asset.');
const staticFile = await fetch(new URL(asset[1].replaceAll('&amp;', '&'), web));
assert.equal(staticFile.status, 200);
await staticFile.arrayBuffer();
const audio = await fetch(web + '/audio/balance.mp3', { method: 'HEAD' });
assert.equal(audio.status, 200);
const allowed = await fetch(api + '/health', { headers: { Origin: 'http://localhost:3000' } });
assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:3000');
await allowed.arrayBuffer();
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
console.log(JSON.stringify({ health: 'ok', standalone: 'ok', staticAsset: 'ok', audio: 'ok', legalPages: 'ok', cors: 'ok' }));
