import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('bundled OpenDua edition preserves attribution and separates source Arabic from licensed editorial fields', async () => {
  const data = JSON.parse(await readFile(new URL('../public/data/opendua-v0.0.4.json', import.meta.url), 'utf8'));
  assert.equal(data.dataset, 'OpenDua');
  assert.equal(data.version, '0.0.4');
  assert.equal(data.licence, 'CC-BY-4.0');
  assert.equal(data.duas.length, 262);
  assert.match(data.attribution, /Hisn al-Muslim/);
  assert.match(data.attribution, /CC BY 4\.0/);
  assert.match(data.frenchTranslationSource.redistribution, /without changing scholarly content/i);
  for (const dua of data.duas) {
    assert.ok(dua.id);
    assert.ok(dua.title);
    assert.ok(dua.arabic);
    assert.ok(dua.translation);
    assert.ok(dua.transliteration);
    assert.equal(dua.translationLanguage, 'en');
    assert.ok(dua.tags.length > 0);
  }
  const frenchDuas = data.duas.filter(dua => typeof dua.translations?.fr?.text === 'string');
  assert.equal(frenchDuas.length, 262);
  for (const dua of frenchDuas) {
    assert.ok(dua.translations.fr.text.trim());
    assert.ok(dua.translations.fr.source);
  }
  assert.equal(frenchDuas.filter(dua => dua.translations.fr.source.startsWith('IslamHouse')).length, 190);
  assert.equal(frenchDuas.filter(dua => dua.translations.fr.source.startsWith('QuranEnc')).length, 8);
  assert.equal(frenchDuas.filter(dua => dua.translations.fr.source.startsWith('Minarah')).length, 64);
  assert.match(data.duas.find(dua => dua.id === 'dua-000076').translations.fr.text, /Dis :/);
  assert.match(data.duas.find(dua => dua.id === 'dua-000113').translations.fr.text, /Le Messager a cru/);
  assert.match(data.duas.find(dua => dua.id === 'dua-000080').translations.fr.notice, /pas une édition savante/);
  assert.match(data.duas.find(dua => dua.id === 'dua-000019').translations.fr.text, /lumière dans mon coeur/);
  assert.match(data.duas.find(dua => dua.id === 'dua-000019').translations.fr.source, /invocation 19, p\. 21/);
});
