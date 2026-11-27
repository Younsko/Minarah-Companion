import openDua from '../public/data/opendua-v0.0.4.json';

export interface ContextItem {
  id: string;
  type: 'dua' | 'ayah' | 'hadith';
  title: string;
  text: string;
  arabic?: string;
  transliteration?: string;
  source?: string;
  tags: string[];
  references?: Array<{ text?: string; [key: string]: unknown }>;
  translations?: {
    en?: { text?: string };
    fr?: { text?: string; source?: string };
  };
  translationLanguage: 'en' | 'fr';
}

export interface ContextRequest {
  situation?: string;
}

export const CATEGORY_TRANSLATIONS: Record<string, { fr: string; ar: string }> = {
  'morning-and-evening': { fr: 'Matin et soir', ar: 'الصباح والمساء' },
  'sleep-and-waking': { fr: 'Sommeil et réveil', ar: 'النوم والاستيقاظ' },
  'prayer-and-the-masjid': { fr: 'Prière et mosquée', ar: 'الصلاة والمسجد' },
  'wudu-and-purification': { fr: 'Ablutions et purification', ar: 'الوضوء والطهارة' },
  'food-and-drink': { fr: 'Repas et boissons', ar: 'الطعام والشراب' },
  fasting: { fr: 'Jeûne', ar: 'الصيام' },
  'home-and-family': { fr: 'Maison et famille', ar: 'البيت والأسرة' },
  travel: { fr: 'Voyage', ar: 'السفر' },
  'hajj-and-umrah': { fr: 'Hajj et Omra', ar: 'الحج والعمرة' },
  'weather-and-nature': { fr: 'Météo et nature', ar: 'الطقس والطبيعة' },
  'distress-and-anxiety': { fr: 'Détresse et anxiété', ar: 'الكرب والقلق' },
  'illness-and-healing': { fr: 'Maladie et guérison', ar: 'المرض والشفاء' },
  'protection-and-refuge': { fr: 'Protection et refuge', ar: 'الحماية والاستعاذة' },
  'forgiveness-and-repentance': { fr: 'Pardon et repentir', ar: 'المغفرة والتوبة' },
  'provision-and-debt': { fr: 'Subsistance et dettes', ar: 'الرزق والدين' },
  'knowledge-and-guidance': { fr: 'Savoir et guidée', ar: 'العلم والهداية' },
  'gatherings-and-greetings': { fr: 'Rencontres et salutations', ar: 'المجالس والتحيات' },
  'death-and-the-deceased': { fr: 'Mort et défunt', ar: 'الموت والميت' },
  'dhikr-and-praise': { fr: 'Rappel et louange', ar: 'الذكر والثناء' },
};

export const CATEGORY_TITLES: Record<string, string> = {
  'morning-and-evening': 'Morning and evening',
  'sleep-and-waking': 'Sleep and waking',
  'prayer-and-the-masjid': 'Prayer and the masjid',
  'wudu-and-purification': 'Wudu and purification',
  'food-and-drink': 'Food and drink',
  fasting: 'Fasting',
  'home-and-family': 'Home and family',
  travel: 'Travel',
  'hajj-and-umrah': 'Hajj and Umrah',
  'weather-and-nature': 'Weather and nature',
  'distress-and-anxiety': 'Distress and anxiety',
  'illness-and-healing': 'Illness and healing',
  'protection-and-refuge': 'Protection and refuge',
  'forgiveness-and-repentance': 'Forgiveness and repentance',
  'provision-and-debt': 'Provision and debt',
  'knowledge-and-guidance': 'Knowledge and guidance',
  'gatherings-and-greetings': 'Gatherings and greetings',
  'death-and-the-deceased': 'Death and the deceased',
  'dhikr-and-praise': 'Dhikr and praise',
};

export const CONTEXT_DB: ContextItem[] = openDua.duas.map(dua => ({
  id: dua.id,
  type: 'dua',
  title: dua.title,
  text: dua.translation,
  arabic: dua.arabic,
  transliteration: dua.transliteration,
  source: dua.sourceReference ? `Hisn al-Muslim ${dua.sourceReference} · OpenDua v${openDua.version}` : `Hisn al-Muslim · OpenDua v${openDua.version}`,
  tags: dua.tags,
  references: dua.references,
  translations: {
    en: { text: dua.translation },
    fr: dua.translations?.fr,
  },
  translationLanguage: 'en',
}));

export function getContextualContent(request: ContextRequest): ContextItem[] {
  const query = request.situation?.trim().toLocaleLowerCase();
  if (!query) return [];
  return CONTEXT_DB.filter(item =>
    item.title.toLocaleLowerCase().includes(query)
    || item.text.toLocaleLowerCase().includes(query)
    || item.transliteration?.toLocaleLowerCase().includes(query)
    || item.tags.some(tag => tag.toLocaleLowerCase().includes(query)
      || CATEGORY_TRANSLATIONS[tag]?.fr.toLocaleLowerCase().includes(query)
      || CATEGORY_TRANSLATIONS[tag]?.ar.includes(query)),
  );
}

export function getAllTopics(): string[] {
  return Array.from(new Set(CONTEXT_DB.flatMap(item => item.tags))).sort();
}

export function getDuasByCategory(category: string): ContextItem[] {
  return CONTEXT_DB.filter(item => item.tags.includes(category));
}

export function getAllCategories(): string[] {
  return getAllTopics();
}
