import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(backendRoot, '..');
const locales = ['pt', 'en', 'es', 'fr', 'de'];

test('web and mobile disclose automated AI in every supported language', async () => {
  for (const app of ['frontend/src/i18n', 'mobile/i18n']) {
    for (const locale of locales) {
      const file = path.join(projectRoot, app, `${locale}.json`);
      const messages = JSON.parse(await fs.readFile(file, 'utf8'));

      assert.ok(messages.chat.disclosureTitle.length > 0, file);
      assert.ok(messages.chat.disclosure.length > 40, file);
    }
  }

  for (const file of ['frontend/src/app/chat/page.js', 'mobile/app/(tabs)/chat.jsx']) {
    const source = await fs.readFile(path.join(projectRoot, file), 'utf8');
    assert.match(source, /chat\.disclosureTitle/);
    assert.match(source, /chat\.disclosure/);
  }
});

test('public interface copy avoids unsubstantiated clinical and instant-effect claims', async () => {
  const forbidden = /clinical assessments|avaliações clínicas|evaluaciones clínicas|évaluations cliniques|klinische bewertungen|clinical insights|insights clínicos|perspectivas clínicas|perspectives cliniques|klinische erkenntnisse|evidence-based meditations|meditações baseadas|meditaciones basadas|méditations basées|evidenzbasierte meditationen|medical monitoring|acompanhamento médico|AI therapist|terapeuta IA|thérapeute IA|KI-Therapeut|instantly deactivate|desativam instantaneamente/i;

  for (const app of ['frontend/src/i18n', 'mobile/i18n']) {
    for (const locale of locales) {
      const file = path.join(projectRoot, app, `${locale}.json`);
      const source = await fs.readFile(file, 'utf8');
      assert.doesNotMatch(source, forbidden, file);
    }
  }
});
