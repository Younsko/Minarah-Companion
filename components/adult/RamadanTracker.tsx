'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './RamadanTracker.module.css';
import { CheckCircle2, Circle, BookOpen, Moon, Sun, Star, Sunrise, Sunset, CloudMoon, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface DailyProgress {
    date: string;
    fasting: boolean;
    prayers: {
        fajr: boolean;
        dhuhr: boolean;
        asr: boolean;
        maghrib: boolean;
        isha: boolean;
    };
    taraweeh: boolean;
    quranPages: number;
    dhikrCount: number;
    goodDeed: boolean;
}

export default function RamadanTracker() {
    const { language, t: globalT } = useI18n();
    const [progress, setProgress] = useState<DailyProgress>({
        date: new Date().toISOString().split('T')[0],
        fasting: false,
        prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        taraweeh: false,
        quranPages: 0,
        dhikrCount: 0,
        goodDeed: false
    });

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const saved = localState.getItem(`ramadan-progress-${today}`);
        if (saved) {
            setProgress(JSON.parse(saved));
        }
    }, []);

    const saveProgress = (newProgress: DailyProgress) => {
        setProgress(newProgress);
        localState.setItem(`ramadan-progress-${newProgress.date}`, JSON.stringify(newProgress));
    };

    const togglePrayer = (prayer: keyof typeof progress.prayers) => {
        const newProgress = {
            ...progress,
            prayers: { ...progress.prayers, [prayer]: !progress.prayers[prayer] }
        };
        saveProgress(newProgress);
    };

    const toggleFasting = () => {
        saveProgress({ ...progress, fasting: !progress.fasting });
    };

    const toggleTaraweeh = () => {
        saveProgress({ ...progress, taraweeh: !progress.taraweeh });
    };

    const updateQuran = (pages: number) => {
        saveProgress({ ...progress, quranPages: pages });
    };

    const incrementDhikr = () => {
        saveProgress({ ...progress, dhikrCount: progress.dhikrCount + 1 });
    };

    const decrementDhikr = () => {
        if (progress.dhikrCount > 0) {
            saveProgress({ ...progress, dhikrCount: progress.dhikrCount - 1 });
        }
    };

    const handleDhikrInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0) {
            saveProgress({ ...progress, dhikrCount: value });
        }
    };

    const handleQuranInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0) {
            saveProgress({ ...progress, quranPages: value });
        }
    };

    const t = (key: string) => {
        // Use global i18n context
        return globalT(key);
    };

    const getPrayerIcon = (prayer: string) => {
        switch (prayer) {
            case 'fajr': return <Sunrise size={18} />;
            case 'dhuhr': return <Sun size={18} />;
            case 'asr': return <CloudMoon size={18} />; // Afternoon sun/cloud
            case 'maghrib': return <Sunset size={18} />;
            case 'isha': return <Moon size={18} />;
            default: return <Circle size={18} />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Moon className={styles.icon} size={24} />
                <h2>{t('ramadan_tracker_title')}</h2>
            </div>

            <div className={styles.grid}>
                {/* Fasting Toggle */}
                <div
                    className={`${styles.card} ${progress.fasting ? styles.completed : ''}`}
                    onClick={toggleFasting}
                >
                    <div className={styles.cardHeader}>
                        <Sun size={20} />
                        <span>{t('fasting')}</span>
                    </div>
                    {progress.fasting ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>

                {/* Prayers - Redesigned Vertical List */}
                <div className={styles.prayersCard}>
                    <h3>{t('prayers_title')}</h3>
                    <div className={styles.prayerListVertical}>
                        {(Object.keys(progress.prayers) as Array<keyof typeof progress.prayers>).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`${styles.prayerRow} ${progress.prayers[p] ? styles.active : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePrayer(p);
                                }}
                            >
                                <div className={styles.prayerInfo}>
                                    {getPrayerIcon(p)}
                                    <span>{t(p)}</span>
                                </div>
                                {progress.prayers[p] ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Taraweeh */}
                <div
                    className={`${styles.card} ${progress.taraweeh ? styles.completed : ''}`}
                    onClick={toggleTaraweeh}
                >
                    <div className={styles.cardHeader}>
                        <Star size={20} />
                        <span>{t('taraweeh')}</span>
                    </div>
                    {progress.taraweeh ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>

                {/* Quran Tracker */}
                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <BookOpen size={20} />
                        <span>{t('quran')}</span>
                    </div>
                    <div className={styles.counter}>
                        <button type="button" onClick={() => updateQuran(Math.max(0, progress.quranPages - 1))}>-</button>
                        <input
                            type="number"
                            value={progress.quranPages}
                            onChange={handleQuranInput}
                            min="0"
                            className={styles.counterInput}
                        />
                        <button type="button" onClick={() => updateQuran(progress.quranPages + 1)}>+</button>
                    </div>
                </div>

                {/* Dhikr Tracker */}
                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <Sparkles size={20} />
                        <span>{t('Dhikr')}</span>
                    </div>
                    <div className={styles.counter}>
                        <button type="button" onClick={decrementDhikr}>-</button>
                        <input
                            type="number"
                            value={progress.dhikrCount}
                            onChange={handleDhikrInput}
                            min="0"
                            className={styles.counterInput}
                        />
                        <button type="button" onClick={incrementDhikr}>+</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
