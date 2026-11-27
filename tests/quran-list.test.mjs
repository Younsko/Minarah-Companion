import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Quran catalog lists each of the 114 surahs once', async () => {
  const catalog = JSON.parse(await readFile(new URL('../public/data/quran/surahs.json', import.meta.url), 'utf8'));
  assert.equal(catalog.length, 114);
  assert.deepEqual(catalog.map(surah => surah.number), Array.from({ length: 114 }, (_, index) => index + 1));
  assert.equal(new Set(catalog.map(surah => surah.englishName)).size, 114);
  for (const surah of catalog) {
    const editions = JSON.parse(await readFile(new URL(`../public/data/quran/surah-${surah.number}.json`, import.meta.url), 'utf8'));
    const source = editions[0];
    assert.equal(surah.name, source.name);
    assert.equal(surah.numberOfAyahs, source.numberOfAyahs);
  }
});
