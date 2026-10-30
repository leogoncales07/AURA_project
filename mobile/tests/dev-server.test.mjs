import test from 'node:test';
import assert from 'node:assert/strict';
import { metroHost, serviceUrl } from '../lib/dev-server.mjs';

test('Expo Go uses the current Metro LAN address when a saved local IP is stale', () => {
    assert.equal(metroHost('exp://192.168.68.51:8081'), '192.168.68.51');
    assert.equal(serviceUrl('http://192.168.68.56:8000', '192.168.68.51:8081', 8000, true), 'http://192.168.68.51:8000');
    assert.equal(serviceUrl('http://192.168.68.56:3000', '192.168.68.51:8081', 3000, true), 'http://192.168.68.51:3000');
});

test('configured production or remote API addresses are preserved', () => {
    assert.equal(serviceUrl('https://api.example.com', '192.168.68.51:8081', 8000, true), 'https://api.example.com');
    assert.equal(serviceUrl('http://192.168.68.56:8000', '192.168.68.51:8081', 8000, false), 'http://192.168.68.56:8000');
    assert.equal(metroHost('https://abc.exp.direct'), null);
});

test('without a LAN host the configured URL is used', () => {
    assert.equal(serviceUrl('http://10.0.0.5:8000', 'abc.exp.direct', 8000, true), 'http://10.0.0.5:8000');
});
