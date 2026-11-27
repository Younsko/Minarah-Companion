'use client';

import React, { useState } from 'react';
import styles from './ContextCard.module.css';
import { useI18n } from '@/lib/i18n-context';
import { Star } from 'lucide-react';
import { addFavorite, removeFavorite, isFavorited, getFavoriteByIdentifier } from '@/lib/favorites';
import { ContextItem } from '@/lib/context-engine';
import { getFrenchDuaTranslationLabel } from '@/lib/dua-translation-label';

export default function ContextCard({ item }: { item: ContextItem }) {
    const { language } = useI18n();
    const [isFav, setIsFav] = useState(() => isFavorited('dua', item.id));
    const displayedTranslation = language === 'fr' && item.translations?.fr?.text
        ? item.translations.fr.text
        : item.text;
    const hasFrenchTranslation = Boolean(language === 'fr' && item.translations?.fr?.text);
    const displayedTranslationLanguage = hasFrenchTranslation ? 'fr' : 'en';

    const handleFavoriteToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isFav) {
            const favorite = getFavoriteByIdentifier('dua', item.id);
            if (favorite) removeFavorite(favorite.id);
            setIsFav(false);
            return;
        }
        addFavorite({
            type: 'dua',
            title: item.title,
            arabicText: item.arabic,
            translation: displayedTranslation,
            source: item.source,
            originalId: item.id,
        });
        setIsFav(true);
    };

    return (
        <article className={styles.card}>
            <div className={styles.header}>
                <span className={`${styles.type} ${styles.dua}`}>{language === 'fr' ? 'Doua' : language === 'ar' ? 'دعاء' : 'Dua'}</span>
                <div className={styles.headerRight}>
                    {item.source && <span className={styles.source}>{item.source}</span>}
                    <button
                        className={`${styles.favoriteBtn} ${isFav ? styles.favorited : ''}`}
                        onClick={handleFavoriteToggle}
                        title={language === 'fr' ? (isFav ? 'Retirer des favoris' : 'Ajouter aux favoris') : language === 'ar' ? (isFav ? 'إزالة من المفضلة' : 'أضف إلى المفضلة') : (isFav ? 'Remove from favorites' : 'Add to favorites')}
                        aria-label={language === 'fr' ? (isFav ? 'Retirer des favoris' : 'Ajouter aux favoris') : language === 'ar' ? (isFav ? 'إزالة من المفضلة' : 'أضف إلى المفضلة') : (isFav ? 'Remove from favorites' : 'Add to favorites')}
                    >
                        <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            <h3 className={styles.title}>{item.title}</h3>
            {item.arabic && <p className={styles.arabic} lang="ar" dir="rtl">{item.arabic}</p>}
            {item.transliteration && <p className={styles.transliteration} lang="ar-Latn">{item.transliteration}</p>}
            {hasFrenchTranslation && <small className={styles.languageNote}>{getFrenchDuaTranslationLabel(item.translations?.fr?.source)}</small>}
            {language === 'fr' && !hasFrenchTranslation && <small className={styles.languageNote}>Traduction anglaise source · OpenDua</small>}
            {language === 'ar' && displayedTranslationLanguage === 'en' && <small className={styles.languageNote} dir="rtl">الترجمة الإنجليزية المصدر · OpenDua</small>}
            <p className={styles.translation} lang={displayedTranslationLanguage}>{displayedTranslation}</p>
            {language === 'fr' && !hasFrenchTranslation && (
                <a
                    className={styles.frenchSourceLink}
                    href="https://islamhouse.com/fr/books/2846930/"
                    target="_blank"
                    rel="noreferrer"
                >
                    Consulter l’édition française de la Citadelle du musulman
                </a>
            )}
        </article>
    );
}
