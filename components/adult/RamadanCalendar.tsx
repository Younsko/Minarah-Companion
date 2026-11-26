'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './RamadanCalendar.module.css';
import { Check, Star, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface DayStatus {
    date: string;
    fasting: boolean;
    allPrayers: boolean;
    taraweeh: boolean;
}

export default function RamadanCalendar() {
    const { language, t } = useI18n();
    const [days, setDays] = useState<DayStatus[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        // Generate calendar days for current month (simplified for now, ideally should align with Hijri)
        // For this MVP, we'll just show the current Gregorian month but styled for Ramadan tracking
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const newDays: DayStatus[] = [];
        for (let d = 1; d <= endOfMonth.getDate(); d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const saved = localState.getItem(`ramadan-progress-${dateStr}`);

            let status = { date: dateStr, fasting: false, allPrayers: false, taraweeh: false };
            if (saved) {
                const data = JSON.parse(saved);
                const prayers = data.prayers;
                const allPrayersCompleted = prayers && Object.values(prayers).every(Boolean);
                status = {
                    date: dateStr,
                    fasting: data.fasting,
                    allPrayers: allPrayersCompleted,
                    taraweeh: data.taraweeh
                };
            }
            newDays.push(status);
        }
        setDays(newDays);
    }, [currentMonth]);

    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US'), { weekday: 'short' }).format(date);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>
                    {new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US'), { month: 'long', year: 'numeric' }).format(currentMonth)}
                </h3>
            </div>

            <div className={styles.grid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.dayHeader}>
                        {language === 'ar' ? day : day.charAt(0)}
                    </div>
                ))}

                {/* Empty cells for start of month offset would go here */}

                {days.map((day) => (
                    <div key={day.date} className={`${styles.dayCell} ${day.fasting ? styles.fastingDay : ''}`}>
                        <span className={styles.dayNumber}>{parseInt(day.date.split('-')[2])}</span>
                        <div className={styles.indicators}>
                            {day.fasting && <Moon size={10} className={styles.iconFasting} />}
                            {day.allPrayers && <Check size={10} className={styles.iconPrayer} />}
                            {day.taraweeh && <Star size={10} className={styles.iconTaraweeh} />}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <Moon size={14} className={styles.iconFasting} />
                    <span>{language === 'fr' ? 'Jeûne' : 'Fasting'}</span>
                </div>
                <div className={styles.legendItem}>
                    <Check size={14} className={styles.iconPrayer} />
                    <span>{language === 'fr' ? 'Prières' : 'Prayers'}</span>
                </div>
                <div className={styles.legendItem}>
                    <Star size={14} className={styles.iconTaraweeh} />
                    <span>Taraweeh</span>
                </div>
            </div>
        </div>
    );
}
