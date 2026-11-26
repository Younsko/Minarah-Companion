import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const expectedVerseCounts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

test('bundled Quran data contains 114 aligned surahs and 6236 Arabic ayahs', async () => {
  let total = 0;
  for (let number = 1; number <= 114; number += 1) {
    const raw = await readFile(new URL(`../public/data/quran/surah-${number}.json`, import.meta.url), 'utf8');
    const editions = JSON.parse(raw);
    assert.equal(editions.length, 4, `surah ${number} should contain the expected four editions`);
    for (const edition of editions) {
      assert.equal(edition.number, number);
      assert.equal(edition.ayahs.length, expectedVerseCounts[number - 1], `verse count in surah ${number}`);
      assert.ok(edition.edition?.identifier, `edition attribution in surah ${number}`);
      assert.deepEqual(edition.ayahs.map(ayah => ayah.numberInSurah), Array.from({ length: edition.ayahs.length }, (_, index) => index + 1));
    }
    const identifiers = editions.map(edition => edition.edition.identifier);
    assert.deepEqual(identifiers, ['quran-uthmani', 'english_saheeh', 'french_montada', 'en.transliteration']);
    assert.equal(editions[1].edition.source, 'QuranEnc');
    assert.equal(editions[1].edition.version, '1.1.2');
    assert.equal(editions[1].edition.publisher, 'Noor International Center');
    assert.equal(editions[2].edition.source, 'QuranEnc');
    assert.equal(editions[2].edition.version, '1.0.0');
    assert.equal(editions[2].edition.publisher, 'Noor International Center');
    assert.ok(editions[1].ayahs.every(ayah => typeof ayah.text === 'string' && ayah.text.length > 0));
    assert.ok(editions[2].ayahs.every(ayah => typeof ayah.text === 'string' && ayah.text.length > 0));
    assert.ok(editions.every(edition => edition.ayahs.length === editions[0].ayahs.length));
    total += editions[0].ayahs.length;
  }
  assert.equal(total, 6236);
});
