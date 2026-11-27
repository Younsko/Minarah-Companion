import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chapters = [];

for (let surah = 1; surah <= 114; surah += 1) {
  const sourcePath = path.join(root, 'public', 'data', 'quran', `surah-${surah}.json`);
  const editions = JSON.parse(await readFile(sourcePath, 'utf8'));
  const arabic = editions.find(edition => edition.edition?.identifier === 'quran-uthmani');
  if (!arabic?.ayahs?.length) throw new Error(`Arabic Quran edition missing in surah ${surah}`);
  chapters.push(...arabic.ayahs.map(ayah => ({
    surah,
    ayah: ayah.numberInSurah,
    juz: ayah.juz,
  })));
}

if (chapters.length !== 6236) throw new Error(`Expected 6236 verses, found ${chapters.length}`);

const juz = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;
  const verses = chapters.filter(ayah => ayah.juz === number);
  if (verses.length === 0) throw new Error(`Juz ${number} is empty`);
  return { number, verses };
});

const plans = {};
for (const duration of [30, 60, 90]) {
  const partsPerJuz = duration / 30;
  const days = [];
  for (const section of juz) {
    const baseSize = Math.floor(section.verses.length / partsPerJuz);
    const remainder = section.verses.length % partsPerJuz;
    let offset = 0;
    for (let part = 0; part < partsPerJuz; part += 1) {
      const size = baseSize + (part < remainder ? 1 : 0);
      const verses = section.verses.slice(offset, offset + size);
      offset += size;
      days.push({
        day: days.length + 1,
        juz: section.number,
        part: part + 1,
        parts: partsPerJuz,
        from: { surah: verses[0].surah, ayah: verses[0].ayah },
        to: { surah: verses.at(-1).surah, ayah: verses.at(-1).ayah },
        verseCount: verses.length,
      });
    }
  }
  if (days.length !== duration) throw new Error(`Plan ${duration} has ${days.length} days`);
  plans[duration] = days;
}

const output = {
  source: 'Juz metadata from the bundled AlQuranCloud quran-uthmani edition; the plan adds no interpretation or verse text.',
  verseCount: chapters.length,
  juzCount: juz.length,
  plans,
};

const outputPath = path.join(root, 'public', 'data', 'quran', 'reading-plans.json');
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote 30-, 60-, and 90-day Quran reading plans to ${outputPath}`);
