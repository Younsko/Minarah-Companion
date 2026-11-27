'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './PrayerChecklist.module.css';
import { Check, Circle, Sun, Sunrise, Clock, Sunset, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { calendarDayKeyInTimeZone } from '@/lib/prayer-date.mjs';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type Prayer = typeof PRAYERS[number];
type PrayerKey = Prayer;
type Props = { prayerTimes?: Record<PrayerKey, string>; nextPrayer?: PrayerKey; timeZone?: string };

const PRAYER_ICONS: Record<Prayer, React.ReactNode> = {
    fajr: <Sunrise size={16} />,
    dhuhr: <Sun size={16} />,
    asr: <Clock size={16} />,
    maghrib: <Sunset size={16} />,
    isha: <Moon size={16} />,
};

const PRAYER_NAMES: Record<Prayer, { en: string; fr: string; ar: string }> = {
    fajr: { en: 'Fajr', fr: 'Fajr', ar: 'الفجر' },
    dhuhr: { en: 'Dhuhr', fr: 'Dhuhr', ar: 'الظهر' },
    asr: { en: 'Asr', fr: 'Asr', ar: 'العصر' },
    maghrib: { en: 'Maghrib', fr: 'Maghrib', ar: 'المغرب' },
    isha: { en: 'Isha', fr: 'Isha', ar: 'العشاء' },
};

function formatDateLabels(now: Date, timeZone: string, language: string) {
    const locale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone };
    let gregorian = now.toLocaleDateString(locale, options);
    if (language === 'fr') {
        const parts = gregorian.split(' ');
        parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        if (parts.length > 2) parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
        gregorian = parts.join(' ');
    }
    let hijri = '';
    try {
        hijri = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone,
        }).format(now);
        hijri = hijri.replace(/\s*B\.?C\.?E?\.?\s*/gi, ' ').replace(/\s*A\.?H\.?\s*/gi, ' AH ');
        if (!hijri.includes('AH') && !hijri.includes('هـ')) hijri = hijri.replace(/(\d{4})/, '$1 AH');
    } catch { /* Some browsers may not include the requested Hijri calendar. */ }
    return { gregorian, hijri: hijri.trim() };
}

export default function PrayerChecklist({ prayerTimes, nextPrayer, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }: Props) {
    const { language } = useI18n();
    const [prayersCompleted, setPrayersCompleted] = useState<Record<Prayer, boolean>>({
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
    });
    const dayKey = calendarDayKeyInTimeZone(new Date(), timeZone);
    const dateLabels = formatDateLabels(new Date(), timeZone, language);

    useEffect(() => {
        const utcToday = new Date().toISOString().split('T')[0];
        const saved = localState.getItem(`minarah-prayers-${dayKey}`) || (dayKey !== utcToday ? localState.getItem(`minarah-prayers-${utcToday}`) : null);
        try {
            const parsed = saved ? JSON.parse(saved) : null;
            const valid = Object.fromEntries(PRAYERS.map(prayer => [prayer, parsed?.[prayer] === true])) as Record<Prayer, boolean>;
            setPrayersCompleted(valid);
            if (saved && !localState.getItem(`minarah-prayers-${dayKey}`)) localState.setItem(`minarah-prayers-${dayKey}`, JSON.stringify(valid));
        } catch {
            setPrayersCompleted({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });
        }
    }, [dayKey, timeZone]);

    const togglePrayer = (prayer: Prayer) => {
        const today = calendarDayKeyInTimeZone(new Date(), timeZone);
        const updated = { ...prayersCompleted, [prayer]: !prayersCompleted[prayer] };
        setPrayersCompleted(updated);
        localState.setItem(`minarah-prayers-${today}`, JSON.stringify(updated));
    };

    const completedCount = Object.values(prayersCompleted).filter(Boolean).length;
    const progress = (completedCount / 5) * 100;

    return (
        <div className={styles.container}>
            {/* Date Display */}
            <div className={styles.dateSection}>
                <div className={styles.hijriDate}>🌙 {dateLabels.hijri}</div>
                <div className={styles.gregorianDate}>{dateLabels.gregorian}</div>
            </div>

            {/* Prayer Checklist */}
            <div className={styles.checklistSection}>
                <div className={styles.checklistHeader}>
                    <span className={styles.checklistTitle}>
                        {language === 'fr' ? 'Prières du jour' : language === 'ar' ? 'صلوات اليوم' : 'Daily Prayers'}
                    </span>
                    <span className={styles.progressText}>{completedCount}/5</span>
                </div>

                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>

                <div className={styles.prayerList}>
                    {PRAYERS.map(prayer => (
                        <button
                            key={prayer}
                            className={`${styles.prayerItem} ${prayer === nextPrayer ? styles.nextPrayer : ''} ${prayersCompleted[prayer] ? styles.completed : ''}`}
                            onClick={() => togglePrayer(prayer)}
                            aria-pressed={prayersCompleted[prayer]}
                            aria-label={`${PRAYER_NAMES[prayer][language as keyof typeof PRAYER_NAMES.fajr] || PRAYER_NAMES[prayer].en}${prayerTimes?.[prayer] ? `, ${prayerTimes[prayer]}` : ''}${prayersCompleted[prayer] ? ', completed' : ''}`}
                        >
                            <div className={styles.prayerIcon}>
                                {PRAYER_ICONS[prayer]}
                            </div>
                            <span className={styles.prayerName}>
                                {PRAYER_NAMES[prayer][language as keyof typeof PRAYER_NAMES.fajr] || PRAYER_NAMES[prayer].en}
                            </span>
                            <strong className={styles.prayerTime}>{prayerTimes?.[prayer] || '—'}</strong>
                            <div className={styles.checkCircle}>
                            {prayersCompleted[prayer] ? <Check size={14} /> : <Circle size={14} />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {completedCount === 5 && (
                <div className={styles.celebration}>
                    ✨ {language === 'fr' ? 'Toutes les prières accomplies !' : language === 'ar' ? 'أُنجزت جميع الصلوات!' : 'All prayers completed!'}
                </div>
            )}
        </div>
    );
}

