'use client';

import React, { useState } from 'react';
import styles from './ContextCard.module.css';
import { useI18n } from '@/lib/i18n-context';
import { Star } from 'lucide-react';
import { addFavorite, removeFavorite, isFavorited, getFavoriteByIdentifier } from '@/lib/favorites';
import { ContextItem } from '@/lib/context-engine';

export default function ContextCard({ item }: { item: ContextItem }) {
    const { language } = useI18n();
    const [isFav, setIsFav] = useState(() => isFavorited('dua', item.id));

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
            translation: item.text,
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
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            <h3 className={styles.title}>{item.title}</h3>
            {item.transliteration && <p className={styles.transliteration} lang="en">{item.transliteration}</p>}
            {language !== 'en' && <small className={styles.languageNote}>{language === 'fr' ? 'Traduction anglaise (OpenDua)' : 'الترجمة الإنجليزية (OpenDua)'}</small>}
            <p className={styles.translation} lang="en">{item.text}</p>
        </article>
    );
}
