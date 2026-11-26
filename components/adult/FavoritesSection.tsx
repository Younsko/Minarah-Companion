'use client';

import { useState, useEffect } from 'react';
import styles from './FavoritesSection.module.css';
import { Star, Trash2, ExternalLink, ChevronDown } from 'lucide-react';
import { getFavorites, removeFavorite, FavoriteItem } from '@/lib/favorites';
import { useI18n } from '@/lib/i18n-context';
import { CONTEXT_DB } from '@/lib/context-engine';

interface FavoritesSectionProps {
    onNavigateToVerse?: (surahNumber: number, ayahNumber: number) => void;
    onNavigateToTab?: (tab: string, itemId?: string) => void;
}

export default function FavoritesSection({ onNavigateToVerse, onNavigateToTab }: FavoritesSectionProps) {
    const { language } = useI18n();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const loadData = () => {
            setFavorites(getFavorites());
        };
        loadData();

        window.addEventListener('favorites-updated', loadData);
        return () => {
            window.removeEventListener('favorites-updated', loadData);
        };
    }, []);

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeFavorite(id);
    };

    const getGuideContent = (fav: FavoriteItem) => {
        return { title: fav.title, translation: fav.translation };
    };

    // Get translated content for invocation items  
    const getInvocationContent = (fav: FavoriteItem) => {
        if (fav.originalId) {
            const item = CONTEXT_DB.find(c => c.id === fav.originalId);
            if (item) {
                if (language === 'fr' && item.translations?.fr) {
                    return { translation: item.translations.fr.text || item.text };
                }
                return { translation: item.text };
            }
        }
        return { translation: fav.translation };
    };

    const handleFavoriteClick = (fav: FavoriteItem) => {
        // Navigate based on type
        if (fav.type === 'verse' && fav.surahNumber && fav.ayahNumber && onNavigateToVerse) {
            onNavigateToVerse(fav.surahNumber, fav.ayahNumber);
        } else if (fav.type === 'dua' && onNavigateToTab) {
            onNavigateToTab('invocations', fav.originalId);
        }
    };

    const displayedFavorites = showAll ? favorites : favorites.slice(0, 6);

    if (favorites.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Star size={32} className={styles.emptyIcon} />
                <p>{language === 'fr' ? 'Pas encore de favoris' : 'No favorites yet'}</p>
                <span className={styles.emptyHint}>
                    {language === 'fr'
                        ? 'Appuyez sur ⭐ sur un verset pour l\'ajouter'
                        : 'Tap ⭐ on a verse to add it'}
                </span>
            </div>
        );
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'verse': return '#8bc34a';
            case 'dua': return '#2196f3';
            case 'hadith': return '#9c27b0';
            default: return '#ffc107';
        }
    };

    const getTypeLabel = (type: string) => {
        if (language === 'fr') {
            switch (type) {
                case 'verse': return 'Verset';
                case 'dua': return 'Dua';
                case 'hadith': return 'Hadith';
                default: return type;
            }
        }
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Star size={18} className={styles.headerIcon} />
                    <span>{language === 'fr' ? 'Mes Favoris' : 'My Favorites'}</span>
                    <span className={styles.count}>{favorites.length}</span>
                </div>
            </div>

            {/* Pinterest-style Masonry Grid */}
            <div className={styles.masonryGrid}>
                {displayedFavorites.map(fav => {
                    // Get content in current language
                    const content = fav.type === 'hadith'
                        ? getGuideContent(fav)
                        : fav.type === 'dua'
                            ? getInvocationContent(fav)
                            : { title: fav.title, translation: fav.translation };

                    return (
                        <div
                            key={fav.id}
                            className={styles.pin}
                            onClick={() => handleFavoriteClick(fav)}
                        >
                            {/* Type Badge */}
                            <div
                                className={styles.pinBadge}
                                style={{ background: getTypeColor(fav.type) }}
                            >
                                {getTypeLabel(fav.type)}
                            </div>

                            {/* Arabic Text */}
                            {fav.arabicText && (fav.type !== 'hadith' || language === 'ar') && (
                                <p className={styles.pinArabic}>
                                    {(fav.type === 'hadith' && language === 'ar' && content.translation)
                                        ? content.translation.length > 300 ? content.translation.slice(0, 300) + '...' : content.translation
                                        : fav.arabicText.length > 300 ? fav.arabicText.slice(0, 300) + '...' : fav.arabicText
                                    }
                                </p>
                            )}

                            {/* Translation - use current language */}
                            {content.translation && (fav.type !== 'hadith' || language !== 'ar') && (
                                <p className={styles.pinTranslation}>
                                    {content.translation.length > 300
                                        ? content.translation.slice(0, 300) + '...'
                                        : content.translation}
                                </p>
                            )}

                            {/* Source */}
                            <div className={styles.pinFooter}>
                                <span className={styles.pinSource}>{fav.source}</span>
                                <button
                                    className={styles.pinDelete}
                                    onClick={(e) => handleRemove(fav.id, e)}
                                    title={language === 'fr' ? 'Supprimer' : 'Remove'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show More Button */}
            {favorites.length > 6 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className={styles.showMoreBtn}
                >
                    {showAll
                        ? (language === 'fr' ? 'Voir moins' : 'Show less')
                        : (language === 'fr' ? `Voir tout (${favorites.length})` : `Show all (${favorites.length})`)}
                    <ChevronDown size={16} className={showAll ? styles.chevronUp : ''} />
                </button>
            )}

            <p className={styles.localNote}>
                💾 {language === 'fr' ? 'Stocké localement' : 'Stored locally'}
            </p>
        </div>
    );
}
