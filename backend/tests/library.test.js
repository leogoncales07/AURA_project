import test from 'node:test';
import assert from 'node:assert/strict';
import { getLibraryContent } from '../src/controllers/libraryController.js';

const getContent = () => {
  let body;

  const response = {
    status(code) {
      assert.equal(code, 200);
      return this;
    },
    json(value) {
      body = value;
      return this;
    }
  };

  getLibraryContent({}, response);
  return body;
};

test('library practices use AURA attribution and document references', () => {
  const content = getContent();
  const practices = [
    ...Object.values(content.meditations),
    ...Object.values(content.sleep_methods)
  ];

  assert.equal(practices.length, 6);

  for (const practice of practices) {
    assert.equal(practice.source, 'AURA educational adaptation');
    assert.ok(practice.references.length >= 1);

    for (const reference of practice.references) {
      assert.ok(reference.title.length > 0);
      assert.match(reference.url, /^https:\/\//);
    }
  }
});

test('library copy avoids institutional attribution and guaranteed outcomes', () => {
  const serialized = JSON.stringify(getContent());

  assert.doesNotMatch(serialized, /Mayo Clinic|Harvard|Sleep Foundation/i);
  assert.doesNotMatch(serialized, /validated by|clinically proven|fall asleep quickly|reduces anxiety/i);
});
