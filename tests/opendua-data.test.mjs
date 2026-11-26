import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('bundled OpenDua edition contains only CC BY 4.0 editorial fields', async () => {
  const data = JSON.parse(await readFile(new URL('../public/data/opendua-v0.0.4.json', import.meta.url), 'utf8'));
  assert.equal(data.dataset, 'OpenDua');
  assert.equal(data.version, '0.0.4');
  assert.equal(data.licence, 'CC-BY-4.0');
  assert.equal(data.duas.length, 262);
  assert.match(data.attribution, /Hisn al-Muslim/);
  assert.match(data.attribution, /CC BY 4\.0/);
  for (const dua of data.duas) {
    assert.ok(dua.id);
    assert.ok(dua.title);
    assert.ok(dua.translation);
    assert.ok(dua.transliteration);
    assert.ok(dua.tags.length > 0);
    assert.equal(Object.hasOwn(dua, 'arabic'), false);
  }
});
