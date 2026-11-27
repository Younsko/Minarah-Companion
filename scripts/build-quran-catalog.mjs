import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const surahs = [];

for (let number = 1; number <= 114; number += 1) {
  const editions = JSON.parse(await readFile(resolve(root, `public/data/quran/surah-${number}.json`), 'utf8'));
  const arabic = editions.find(edition => edition.edition?.identifier === 'quran-uthmani');
  if (!arabic || arabic.number !== number) throw new Error(`Missing Arabic metadata for surah ${number}`);
  const { name, englishName, englishNameTranslation, numberOfAyahs, revelationType } = arabic;
  surahs.push({ number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType });
}

await writeFile(resolve(root, 'public/data/quran/surahs.json'), `${JSON.stringify(surahs)}\n`, 'utf8');
console.log(`Wrote metadata for ${surahs.length} unique surahs.`);
