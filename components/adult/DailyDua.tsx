'use client';

import { useEffect, useState } from 'react';
import styles from './DailyDua.module.css';
import { RefreshCw, Hand } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { CONTEXT_DB, ContextItem } from '@/lib/context-engine';
import { getFrenchDuaTranslationLabel } from '@/lib/dua-translation-label';

export default function DailyDua() {
    const { language } = useI18n();
    const [dua, setDua] = useState<ContextItem>(CONTEXT_DB[0]);

    useEffect(() => {
        const start = new Date(new Date().getFullYear(), 0, 0);
        const day = Math.floor((Date.now() - start.getTime()) / 86_400_000);
        setDua(CONTEXT_DB[day % CONTEXT_DB.length]);
    }, []);

    const chooseAnother = () => setDua(CONTEXT_DB[Math.floor(Math.random() * CONTEXT_DB.length)]);
    const frenchText = dua.translations?.fr?.text;
    const showFrench = language === 'fr' && Boolean(frenchText);
    const displayedTranslation = showFrench ? frenchText : dua.text;
    const displayedLanguage = showFrench ? 'fr' : 'en';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Hand size={18} />
                    <span>{language === 'fr' ? 'Doua du jour' : language === 'ar' ? 'دعاء اليوم' : 'Dua of the day'}</span>
                </div>
                <button onClick={chooseAnother} className={styles.refreshBtn} title="Choose another dua" aria-label="Choose another dua">
                    <RefreshCw size={16} />
                </button>
            </div>

            <h3>{dua.title}</h3>
            {dua.arabic && <p className={styles.arabic} lang="ar" dir="rtl">{dua.arabic}</p>}
            {dua.transliteration && <p className={styles.transliteration} lang="ar-Latn">{dua.transliteration}</p>}
            {language !== 'en' && (
                <small>
                    {language === 'fr'
                        ? showFrench ? getFrenchDuaTranslationLabel(dua.translations?.fr?.source) : 'Traduction anglaise source · OpenDua'
                        : 'الترجمة الإنجليزية · OpenDua'}
                </small>
            )}
            <p className={styles.translation} lang={displayedLanguage}>{displayedTranslation}</p>
            <span className={styles.source}>{dua.source}</span>
        </div>
    );
}

