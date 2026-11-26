#!/usr/bin/env node
/**
 * Script to remove Bismillah from verse 1 in existing static Quran JSON files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'quran');

// The Bismillah text to remove (exact string from the files)
const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';

for (let surahNum = 2; surahNum <= 114; surahNum++) {
    // Skip At-Tawbah (9) - no Bismillah
    if (surahNum === 9) continue;

    const filePath = path.join(DATA_DIR, `surah-${surahNum}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: surah-${surahNum}.json`);
        continue;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let modified = false;

        // Process each edition (Arabic, English, French, Transliteration)
        data.forEach(edition => {
            if (edition.ayahs && edition.ayahs[0] && edition.ayahs[0].numberInSurah === 1) {
                const firstAyah = edition.ayahs[0];
                const originalText = firstAyah.text;

                // Try to remove Bismillah if present
                if (originalText.startsWith(BISMILLAH)) {
                    firstAyah.text = originalText.substring(BISMILLAH.length).trim();
                    modified = true;
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data));
            console.log(`✅ Surah ${surahNum}: Bismillah removed`);
        } else {
            console.log(`⏭️ Surah ${surahNum}: No Bismillah found or already removed`);
        }
    } catch (error) {
        console.error(`❌ Error processing surah-${surahNum}.json:`, error.message);
    }
}

console.log('\n✨ Done!');
