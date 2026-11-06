import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');

test('content-rights manifest identifies existing files and current hashes', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, 'docs/content-rights.json'), 'utf8'));
  const ids = new Set();

  for (const asset of manifest.assets) {
    assert.ok(asset.id && !ids.has(asset.id));
    ids.add(asset.id);
    assert.equal(typeof asset.distributionAllowed, 'boolean');
    assert.ok(asset.files.length > 0);

    for (const relativePath of asset.files) {
      const data = await fs.readFile(path.join(projectRoot, relativePath));
      if (asset.sha256) {
        const hash = crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
        assert.equal(hash, asset.sha256, relativePath);
      }
    }
  }
});

test('release decisions manifest contains every external launch decision', async () => {
  const decisions = JSON.parse(await fs.readFile(path.join(projectRoot, 'docs/release-decisions.json'), 'utf8'));
  const required = [
    'serviceOwner', 'publicContactEmail', 'publicContactAddress', 'publicMinimumAge',
    'domain', 'domainOwnershipConfirmed', 'trademarkSearchConfirmed', 'retentionDays',
    'backupRetentionDays', 'hostingProvider', 'hostingRegion', 'dpaReviewed',
    'geminiPublicUse', 'legalReviewStatus', 'targetStores', 'googlePlayAccountOwner',
    'appleDeveloperAccountOwner', 'mobileIdentifiersConfirmed'
  ];

  for (const key of required) assert.ok(Object.hasOwn(decisions, key), key);
});
