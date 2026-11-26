'use client';

import styles from './PrayerStrip.module.css';
import { useI18n } from '@/lib/i18n-context';

interface PrayerStripProps {
    timings: Record<string, string>;
    nextPrayer: string | null;
}

export default function PrayerStrip({ timings, nextPrayer }: PrayerStripProps) {
    const { t } = useI18n();

    // Order of prayers to display
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    return (
        <div className={styles.container}>
            <div className={styles.scrollContainer}>
                {prayers.map((prayer) => {
                    const time = timings[prayer];
                    const isNext = nextPrayer === prayer;

                    // Simple logic to highlight current/next prayer
                    // In a real app, we'd compare times more robustly

                    return (
                        <div key={prayer} className={`${styles.prayerItem} ${isNext ? styles.active : ''}`}>
                            <span className={styles.name}>{prayer}</span>
                            <span className={styles.time}>{time?.split(' ')[0]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
