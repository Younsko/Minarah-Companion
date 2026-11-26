export interface QuranAyah {
  number: number;
  text: string;
  translation: string;
  translations?: { en: { text: string }; fr: { text: string } };
  surah: { name: string; englishName: string; number: number };
}

type SurahFile = Array<{ number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string; ayahs: Array<{ numberInSurah: number; text: string }> }>;
type SurahInfo = Pick<SurahFile[number], 'number' | 'name' | 'englishName' | 'englishNameTranslation' | 'numberOfAyahs' | 'revelationType'>;

export async function fetchSurah(number: number): Promise<SurahFile | null> {
  if (!Number.isInteger(number) || number < 1 || number > 114) return null;
  try {
    const response = await fetch(`/data/quran/surah-${number}.json`);
    return response.ok ? await response.json() as SurahFile : null;
  } catch { return null; }
}

export async function fetchSurahList(): Promise<SurahInfo[]> {
  const file = await fetchSurah(1);
  return file?.length ? file.map(({ number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType }) => ({ number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType })) : [];
}

export async function fetchRandomAyah(): Promise<QuranAyah | null> {
  try {
    const day = new Date();
    const seed = Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86400000);
    const surahNumber = seed % 114 + 1;
    const data = await fetchSurah(surahNumber);
    if (!data?.length) return null;
    const editions = data;
    const index = seed % data[0].ayahs.length;
    const arabic = editions[0];
    const english = editions[1];
    const french = editions[2];
    return {
      number: arabic.ayahs[index].numberInSurah,
      text: arabic.ayahs[index].text.replace(/^\uFEFF/, ''),
      translation: french.ayahs[index].text,
      translations: { en: { text: english.ayahs[index].text }, fr: { text: french.ayahs[index].text } },
      surah: { name: arabic.name, englishName: arabic.englishName, number: arabic.number },
    };
  } catch { return null; }
}
