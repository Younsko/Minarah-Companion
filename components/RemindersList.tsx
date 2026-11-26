'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './RemindersList.module.css';
import { CheckCircle2, Circle } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface Reminder {
    id: string;
    textKey: string; // Use a key instead of hardcoded text
    completed: boolean;
}

const REMINDER_DB: Record<string, { en: string; fr: string; ar: string }> = {
    'morning_adhkar': { en: 'Morning Adhkar', fr: 'Adhkar du Matin', ar: 'أذكار الصباح' },
    'duha_prayer': { en: 'Duha Prayer (2 Rakats)', fr: 'Prière de Duha (2 Rakats)', ar: 'صلاة الضحى' },
    'kahf_friday': { en: 'Read Surah Al-Kahf (Friday)', fr: 'Lire Sourate Al-Kahf (Vendredi)', ar: 'قراءة سورة الكهف' },
    'evening_adhkar': { en: 'Evening Adhkar', fr: 'Adhkar du Soir', ar: 'أذكار المساء' },
    'witr_prayer': { en: 'Witr Prayer', fr: 'Prière du Witr', ar: 'صلاة الوتر' },
    'kursi_sleep': { en: 'Read Ayat al-Kursi before sleep', fr: 'Lire Ayat al-Kursi avant de dormir', ar: 'آية الكرسي قبل النوم' },
    'forgive_sleep': { en: 'Forgive everyone before sleep', fr: 'Pardonner à tous avant de dormir', ar: 'مسامحة الجميع قبل النوم' },
    'tahajjud': { en: 'Tahajjud Prayer', fr: 'Prière de Tahajjud', ar: 'صلاة التهجد' },
    'quran_daily': { en: 'Read Daily Quran Portion', fr: 'Lire sa partie quotidienne du Coran', ar: 'ورد القرآن اليومي' },
    'charity': { en: 'Give Sadaqah (Charity)', fr: 'Donner une Sadaqah', ar: 'الصدقة' }
};

const DEFAULT_REMINDERS: Reminder[] = [
    { id: '1', textKey: 'morning_adhkar', completed: false },
    { id: '2', textKey: 'duha_prayer', completed: false },
    { id: '3', textKey: 'kahf_friday', completed: false },
    { id: '4', textKey: 'evening_adhkar', completed: false },
    { id: '5', textKey: 'witr_prayer', completed: false },
    { id: '6', textKey: 'kursi_sleep', completed: false },
    { id: '7', textKey: 'forgive_sleep', completed: false },
];

export default function RemindersList() {
    // Initialize with defaults to prevent flash/vibration when loading
    const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
    const [isLoaded, setIsLoaded] = useState(false);
    const { language } = useI18n();

    useEffect(() => {
        const saved = localState.getItem('muslim-life-reminders');
        if (saved) {
            // Migration logic: if saved data has 'text' instead of 'textKey', reset or migrate
            // For simplicity, if we detect old format, we reset to default to avoid issues
            const parsed = JSON.parse(saved);
            if (parsed.length > 0 && !parsed[0].textKey) {
                setReminders(DEFAULT_REMINDERS);
            } else {
                setReminders(parsed);
            }
        }
        setIsLoaded(true);
    }, []);

    const toggleReminder = (id: string) => {
        const updated = reminders.map(r =>
            r.id === id ? { ...r, completed: !r.completed } : r
        );
        setReminders(updated);
        localState.setItem('muslim-life-reminders', JSON.stringify(updated));
    };

    const resetReminders = () => {
        const reset = reminders.map(r => ({ ...r, completed: false }));
        setReminders(reset);
        localState.setItem('muslim-life-reminders', JSON.stringify(reset));
    };

    const getTranslatedText = (key: string) => {
        const entry = REMINDER_DB[key];
        if (!entry) return key;
        if (language === 'fr') return entry.fr;
        if (language === 'ar') return entry.ar;
        return entry.en;
    };

    // Safe progress calculation - avoid flash by only showing when loaded
    const progress = isLoaded && reminders.length > 0
        ? Math.round((reminders.filter(r => r.completed).length / reminders.length) * 100)
        : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.progressInfo}>
                    <h3>{language === 'fr' ? 'Sunnahs Quotidiennes' : (language === 'ar' ? 'السنن اليومية' : 'Daily Sunnahs')}</h3>
                    <span className={styles.percent}>{progress}% {language === 'fr' ? 'Fait' : (language === 'ar' ? 'مكتمل' : 'Done')}</span>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className={styles.list}>
                {reminders.map(reminder => (
                    <div
                        key={reminder.id}
                        className={`${styles.item} ${reminder.completed ? styles.completed : ''}`}
                        onClick={() => toggleReminder(reminder.id)}
                    >
                        {reminder.completed ? (
                            <CheckCircle2 className={styles.checkIcon} size={24} />
                        ) : (
                            <Circle className={styles.circleIcon} size={24} />
                        )}
                        <span className={styles.text}>{getTranslatedText(reminder.textKey)}</span>
                    </div>
                ))}
            </div>

            <button onClick={resetReminders} className={styles.resetButton}>
                {language === 'fr' ? 'Réinitialiser' : (language === 'ar' ? 'إعادة تعيين' : 'Reset for New Day')}
            </button>
        </div>
    );
}
