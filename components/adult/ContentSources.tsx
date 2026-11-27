'use client';

import { useI18n } from '@/lib/i18n-context';
import styles from './ContentSources.module.css';

const SOURCES = {
    fr: {
        intro: 'Les textes, traductions et outils de Minarah sont crédités ici, avec les limites connues de chaque source.',
        duas: 'Invocations · OpenDua',
        duasBody: <>OpenDua v0.0.4, par Ihsan Labs au Human Development Fund, fournit les traductions anglaises, translittérations, titres, références et données éditoriales de 262 invocations. Ces éléments sont sous <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">licence CC BY 4.0</a>. OpenDua ne revendique pas la propriété des textes religieux sous-jacents. Le recueil s’inspire de Hisn al-Muslim de Sa&apos;id ibn Ali ibn Wahf al-Qahtani. <a href="https://opendua.org" target="_blank" rel="noreferrer">Voir OpenDua</a>.</>,
        french: 'Traductions françaises des invocations',
        frenchBody: <>Les traductions attribuées à <a href="https://islamhouse.com/fr/books/2846930/" target="_blank" rel="noreferrer">La Citadelle du Musulman</a> sont reproduites sans modification; sept invocations proviennent aussi de la <a href="https://d1.islamhouse.com/data/fr/ih_books/single/fr_Fortress_of_the_Muslim.pdf" target="_blank" rel="noreferrer">3e édition française (2005)</a>. Les autres sont des adaptations du sens anglais OpenDua par Minarah, destinées à aider la lecture et non présentées comme une traduction savante. <a href="https://d1.islamhouse.com/html/faq.htm" target="_blank" rel="noreferrer">Conditions de redistribution d’IslamHouse</a>.</>,
        quran: 'Traductions du Coran',
        quranBody: <>Les traductions française et anglaise proviennent des éditions Noor International Center distribuées par <a href="https://quranenc.com/en/home/api" target="_blank" rel="noreferrer">QuranEnc</a> (FR v1.0.0, EN v1.1.2). Le texte et les notes fournis sont conservés sans modification. Le texte arabe est attribué à <a href="https://alquran.cloud/credits" target="_blank" rel="noreferrer">AlQuranCloud</a>.</>,
        prayer: 'Horaires de prière et fuseau horaire',
        prayerBody: <>Les horaires sont calculés sur cet appareil avec <a href="https://github.com/batoulapps/adhan-js" target="_blank" rel="noreferrer">Adhan JS · MIT</a>. Le fuseau IANA est estimé localement depuis les coordonnées par <a href="https://github.com/photostructure/tz-lookup" target="_blank" rel="noreferrer">tz-lookup · CC0</a>, avec des limites possibles près des frontières; un réglage manuel reste disponible. Les frontières s’appuient sur <a href="https://github.com/evansiroky/timezone-boundary-builder" target="_blank" rel="noreferrer">timezone-boundary-builder</a> et les données <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap · ODbL</a>.</>,
        privacy: 'Données et contenus absents',
        privacyBody: 'La progression, les favoris, les réglages et les coordonnées restent dans le stockage local du navigateur. Minarah ne fournit pas de compte ni de synchronisation serveur. Aucun tafsir ni hadith quotidien non vérifié n’est affiché. L’audio, lorsqu’il est lancé, est diffusé depuis son fournisseur et n’est pas inclus dans le dépôt.',
    },
    en: {
        intro: 'Minarah’s texts, translations and tools are credited here, along with the known limits of each source.',
        duas: 'Supplications · OpenDua',
        duasBody: <>OpenDua v0.0.4, by Ihsan Labs at the Human Development Fund, supplies the English translations, transliterations, titles, references and editorial data for 262 supplications. These materials are licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. OpenDua makes no ownership claim over the underlying religious texts. The collection is based on Hisn al-Muslim by Sa&apos;id ibn Ali ibn Wahf al-Qahtani. <a href="https://opendua.org" target="_blank" rel="noreferrer">Visit OpenDua</a>.</>,
        french: 'French supplication translations',
        frenchBody: <>Translations attributed to <a href="https://islamhouse.com/fr/books/2846930/" target="_blank" rel="noreferrer">La Citadelle du Musulman</a> are reproduced unchanged; seven supplications also use the <a href="https://d1.islamhouse.com/data/fr/ih_books/single/fr_Fortress_of_the_Muslim.pdf" target="_blank" rel="noreferrer">third French edition (2005)</a>. Other French entries are Minarah adaptations of OpenDua’s English meaning, offered as reading aids rather than scholarly translations. <a href="https://d1.islamhouse.com/html/faq.htm" target="_blank" rel="noreferrer">IslamHouse redistribution terms</a>.</>,
        quran: 'Quran translations',
        quranBody: <>The French and English translations come from Noor International Center editions distributed by <a href="https://quranenc.com/en/home/api" target="_blank" rel="noreferrer">QuranEnc</a> (FR v1.0.0, EN v1.1.2). Supplied text and notes are kept unchanged. Arabic text is credited to <a href="https://alquran.cloud/credits" target="_blank" rel="noreferrer">AlQuranCloud</a>.</>,
        prayer: 'Prayer times and time zones',
        prayerBody: <>Prayer times are calculated on this device with <a href="https://github.com/batoulapps/adhan-js" target="_blank" rel="noreferrer">Adhan JS · MIT</a>. The IANA time zone is estimated locally from coordinates with <a href="https://github.com/photostructure/tz-lookup" target="_blank" rel="noreferrer">tz-lookup · CC0</a>; borders can be approximate, so a manual override is available. Boundaries use <a href="https://github.com/evansiroky/timezone-boundary-builder" target="_blank" rel="noreferrer">timezone-boundary-builder</a> and <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap · ODbL</a> data.</>,
        privacy: 'Data and excluded content',
        privacyBody: 'Progress, favorites, settings and coordinates stay in browser storage. Minarah has no account or server sync. No tafsir or unverified daily hadith is displayed. Audio, when played, streams from its provider and is not bundled in this repository.',
    },
    ar: {
        intro: 'مصادر النصوص والترجمات والأدوات في منارة، مع توضيح حدود كل مصدر.',
        duas: 'الأدعية · OpenDua',
        duasBody: <>يوفر OpenDua v0.0.4، من Ihsan Labs في Human Development Fund، الترجمات الإنجليزية والنقل الصوتي والعناوين والمراجع والبيانات التحريرية لـ 262 دعاءً. هذه المواد مرخصة بموجب <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. لا يدّعي OpenDua ملكية النصوص الدينية الأصلية. يستند العمل إلى حصن المسلم لسعيد بن علي بن وهف القحطاني. <a href="https://opendua.org" target="_blank" rel="noreferrer">موقع OpenDua</a>.</>,
        french: 'الترجمات الفرنسية للأدعية',
        frenchBody: <>نُقلت الترجمات المنسوبة إلى <a href="https://islamhouse.com/fr/books/2846930/" target="_blank" rel="noreferrer">La Citadelle du Musulman</a> دون تعديل، كما استُخدمت الطبعة الفرنسية الثالثة لعام 2005 لسبعة أدعية. الترجمات الفرنسية الأخرى صياغات منارة لمعنى OpenDua الإنجليزي، وهي للمساعدة على الفهم وليست ترجمة علمية. <a href="https://d1.islamhouse.com/html/faq.htm" target="_blank" rel="noreferrer">شروط إعادة النشر لدى IslamHouse</a>.</>,
        quran: 'ترجمات القرآن',
        quranBody: <>تأتي الترجمات الفرنسية والإنجليزية من إصدارات Noor International Center التي يوزعها <a href="https://quranenc.com/en/home/api" target="_blank" rel="noreferrer">QuranEnc</a> (الفرنسية v1.0.0 والإنجليزية v1.1.2)، مع إبقاء النص والحواشي دون تعديل. يُنسب النص العربي إلى <a href="https://alquran.cloud/credits" target="_blank" rel="noreferrer">AlQuranCloud</a>.</>,
        prayer: 'مواقيت الصلاة والمنطقة الزمنية',
        prayerBody: <>تُحسب مواقيت الصلاة على هذا الجهاز باستخدام <a href="https://github.com/batoulapps/adhan-js" target="_blank" rel="noreferrer">Adhan JS · MIT</a>. تُقدّر المنطقة الزمنية محليًا من الإحداثيات باستخدام <a href="https://github.com/photostructure/tz-lookup" target="_blank" rel="noreferrer">tz-lookup · CC0</a>، وقد تكون الحدود تقريبية؛ ويمكن اختيار منطقة يدويًا. تستند الحدود إلى <a href="https://github.com/evansiroky/timezone-boundary-builder" target="_blank" rel="noreferrer">timezone-boundary-builder</a> وبيانات <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap · ODbL</a>.</>,
        privacy: 'البيانات والمحتوى غير المتاح',
        privacyBody: 'تبقى القراءة والمفضلة والإعدادات والإحداثيات في تخزين المتصفح. لا يوجد حساب أو مزامنة مع خادم. لا يُعرض تفسير أو حديث يومي غير متحقق منه. عند تشغيل الصوت، يُبث من مزوده ولا يُضمّن في المستودع.',
    },
} as const;

export default function ContentSources() {
    const { language } = useI18n();
    const copy = SOURCES[language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en'];
    return (
        <article className={styles.page} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className={styles.intro}>{copy.intro}</p>
            <section className={styles.section}><h3>{copy.duas}</h3><p>{copy.duasBody}</p></section>
            <section className={styles.section}><h3>{copy.french}</h3><p>{copy.frenchBody}</p></section>
            <section className={styles.section}><h3>{copy.quran}</h3><p>{copy.quranBody}</p></section>
            <section className={styles.section}><h3>{copy.prayer}</h3><p>{copy.prayerBody}</p></section>
            <section className={styles.section}><h3>{copy.privacy}</h3><p>{copy.privacyBody}</p></section>
        </article>
    );
}
