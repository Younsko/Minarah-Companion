'use client';

import { useState } from 'react';
import styles from './DuaLibrary.module.css';
import { getAllCategories, getDuasByCategory, ContextItem, CATEGORY_TRANSLATIONS } from '@/lib/context-engine';
import ContextCard from './adult/ContextCard';
import { useI18n } from '@/lib/i18n-context';

export default function DuaLibrary() {
    const categories = getAllCategories();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [duas, setDuas] = useState<ContextItem[]>([]);
    const { language, t } = useI18n();

    const getTranslatedCategory = (cat: string) => {
        if (language === 'en') return cat.charAt(0).toUpperCase() + cat.slice(1);
        if (language === 'fr' && CATEGORY_TRANSLATIONS[cat]?.fr) return CATEGORY_TRANSLATIONS[cat].fr;
        if (language === 'ar' && CATEGORY_TRANSLATIONS[cat]?.ar) return CATEGORY_TRANSLATIONS[cat].ar;
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setDuas(getDuasByCategory(category));
    };

    const clearSelection = () => {
        setSelectedCategory(null);
        setDuas([]);
    };

    return (
        <div className={styles.library}>
            {!selectedCategory ? (
                <div className={styles.grid}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={styles.categoryCard}
                            onClick={() => handleCategoryClick(cat)}
                        >
                            <span className={styles.categoryName}>{getTranslatedCategory(cat)}</span>
                            <span className={styles.count}>{getDuasByCategory(cat).length} {t('duas')}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.results}>
                    <div className={styles.header}>
                        <h2>{getTranslatedCategory(selectedCategory)} {t('duas')}</h2>
                        <button onClick={clearSelection} className={styles.backButton}>{language === 'fr' ? 'Retour' : (language === 'ar' ? 'عودة' : 'Back')}</button>
                    </div>
                    <div className={styles.list}>
                        {duas.map(dua => (
                            <ContextCard key={dua.id} item={dua} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
