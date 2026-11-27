'use client';

import { useI18n } from '@/lib/i18n-context';
import styles from './ContentSources.module.css';

export default function ContentSources() {
    const { language } = useI18n();
    const french = language === 'fr';
    return (
        <article className={styles.page}>
            <p className={styles.intro}>{french ? 'Les textes, traductions et outils utilisés dans Minarah sont crédités ici, avec leurs licences et leurs limites.' : 'Sources, translations, tools and their licenses used by Minarah are credited here.'}</p>

            <section className={styles.section}>
                <h3>{french ? 'Invocations · OpenDua' : 'Invocations · OpenDua'}</h3>
                <p>
                    OpenDua dataset v0.0.4 (<a href="https://opendua.org" target="_blank" rel="noreferrer">opendua.org</a>), by Ihsan Labs at the Human Development Fund. Based on Hisn al-Muslim by Sa&apos;id ibn Ali ibn Wahf al-Qahtani. OpenDua editorial text, dataset structure and the recitation by Muhammad Jumah are licensed <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. OpenDua makes no ownership claim over the underlying religious texts.
                </p>
            </section>

            <section className={styles.section}>
                <h3>{french ? 'Traductions françaises des invocations' : 'French dua translations'}</h3>
                <p>
                    Traductions françaises reproduites sans modification depuis <a href="https://islamhouse.com/fr/books/2846930/" target="_blank" rel="noreferrer">La Citadelle du Musulman</a> d&apos;Al-Qahtani. Sept invocations utilisent également la <a href="https://d1.islamhouse.com/data/fr/ih_books/single/fr_Fortress_of_the_Muslim.pdf" target="_blank" rel="noreferrer">3e édition française (2005)</a>; voir les <a href="https://d1.islamhouse.com/html/faq.htm" target="_blank" rel="noreferrer">conditions de redistribution</a> d&apos;IslamHouse.
                </p>
                <p>Les autres traductions françaises sont des adaptations du sens anglais OpenDua par Minarah.</p>
            </section>

            <section className={styles.section}>
                <h3>{french ? 'Traduction du Coran' : 'Quran translation'}</h3>
                <p>Les passages coraniques utilisent l&apos;édition française QuranEnc Noor International Center v1.0.0. Ces adaptations ne constituent pas une édition savante.</p>
            </section>

            <section className={styles.section}>
                <h3>{french ? 'Calcul des horaires' : 'Prayer-time calculations'}</h3>
                <p>{french ? 'Les horaires sont calculés sur cet appareil avec la bibliothèque Adhan JS. Les coordonnées, réglages et suivis restent dans le stockage local de Minarah.' : 'Prayer times are calculated on this device with the Adhan JS library. Coordinates, settings and progress stay in Minarah local storage.'} <a href="https://github.com/batoulapps/adhan-js" target="_blank" rel="noreferrer">Adhan JS · MIT</a>.</p>
            </section>

            <section className={styles.section}>
                <h3>{french ? 'Fuseaux horaires' : 'Time zones'}</h3>
                <p>{french ? 'Le fuseau est estimé localement depuis les coordonnées par @photostructure/tz-lookup. Ses limites peuvent être approximatives près de certaines frontières; le fuseau IANA peut être corrigé dans les réglages.' : 'The time zone is estimated locally from coordinates with @photostructure/tz-lookup. Some boundaries may be approximate; the IANA zone can be corrected in settings.'} <a href="https://github.com/photostructure/tz-lookup" target="_blank" rel="noreferrer">CC0 1.0</a>. Les limites proviennent de <a href="https://github.com/evansiroky/timezone-boundary-builder" target="_blank" rel="noreferrer">timezone-boundary-builder</a> et de données <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap · ODbL</a>.</p>
            </section>
        </article>
    );
}

