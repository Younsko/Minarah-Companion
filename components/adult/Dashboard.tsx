'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { Search, Calendar, X, Moon, Globe, Settings as SettingsIcon } from 'lucide-react';
import { getContextualContent, ContextItem } from '@/lib/context-engine';
import { fetchRandomAyah, QuranAyah } from '@/app/actions';
import ContextCard from './ContextCard';
import InvocationsLibrary from './InvocationsLibrary';
import RemindersList from '../RemindersList';
import QuranBrowser from './QuranBrowser';
import Settings from './Settings';
import Loading from '@/components/Loading';
import { useI18n } from '@/lib/i18n-context';
import { cleanVerseTranslation } from '@/lib/quran-format';
import RamadanTracker from './RamadanTracker';
import FavoritesSection from './FavoritesSection';
import PrayerTimesPanel from './PrayerTimesPanel';
import DailyDua from './DailyDua';
import DailyReadingCompanion from './DailyReadingCompanion';

export default function AdultDashboard() {
    const [activeTab, setActiveTab] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ContextItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { t, language, setLanguage } = useI18n();
    const [quranTarget, setQuranTarget] = useState<{ surahNumber: number, ayahNumber: number } | null>(null);
    const [quranKey, setQuranKey] = useState(0); // Key to force remount QuranBrowser
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const handleNavigateQuran = (e: CustomEvent) => {
            setQuranTarget(e.detail);
            setActiveTab('quran');
        };

        window.addEventListener('navigate-to-quran', handleNavigateQuran as EventListener);

        return () => {
            window.removeEventListener('navigate-to-quran', handleNavigateQuran as EventListener);
        };
    }, []);

    const [dailyContent, setDailyContent] = useState<{ type: 'ayah', content: QuranAyah | ContextItem | null }>({ type: 'ayah', content: null });

    // Ramadan State
    const [ramadanMode, setRamadanMode] = useState(false);
    const [timeToNextEvent, setTimeToNextEvent] = useState('');
    const [nextEventName, setNextEventName] = useState('');

    useEffect(() => {
        // Load Ramadan mode
        const checkMode = () => {
            const isRamadan = localState.getItem('muslim-life-ramadan-mode') === 'true';
            setRamadanMode(isRamadan);
        };

        checkMode();
        window.addEventListener('storage', checkMode);
        return () => window.removeEventListener('storage', checkMode);
    }, []);

    useEffect(() => {
        async function loadData() {
            const ayahData = await fetchRandomAyah();
            setDailyContent({ type: 'ayah', content: ayahData });
            checkDailyNotification(ayahData);
        }
        loadData();
    }, []);

    // Option A: Show notification when app opens after scheduled time
    const checkDailyNotification = async (ayah: QuranAyah | null) => {
        if (typeof window === 'undefined') return;

        const notificationsEnabled = localState.getItem('muslim-life-notifications') === 'true';
        if (!notificationsEnabled) return;

        const notificationTime = localState.getItem('muslim-life-notification-time') || '08:00';
        const today = new Date().toDateString();
        const lastNotificationDate = localState.getItem('muslim-life-last-notification-date');

        // Don't show if we already showed today
        if (lastNotificationDate === today) return;

        // Parse the notification time
        const [hours, minutes] = notificationTime.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Only show if current time is past the scheduled time
        if (new Date() < scheduledTime) return;

        // Check browser notification permission
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                // Create notification with daily content
                const title = language === 'fr' ? '🌙 Votre contenu du jour' :
                    language === 'ar' ? '🌙 محتوى اليوم' : '🌙 Your Daily Content';

                let body = '';
                if (ayah && 'surah' in ayah) {
                    body += `📖 ${ayah.surah.englishName} ${ayah.surah.number}:${ayah.number}\n`;
                }
                new Notification(title, {
                    body: body || (language === 'fr' ? 'Ouvrez Minarah pour découvrir' : 'Open Minarah to discover'),
                    icon: '/assets/minarah-logo.png',
                    tag: 'daily-content'
                });

                // Mark as shown for today
                localState.setItem('muslim-life-last-notification-date', today);
            } catch (e) {
                console.error('Failed to show notification:', e);
            }
        }
    };


    // Handle search input
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 2) {
            setIsSearching(true);
            const results = getContextualContent({ situation: query });
            setSearchResults(results);
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
    };

    const toggleLanguage = () => {
        if (language === 'en') setLanguage('fr');
        else if (language === 'fr') setLanguage('ar');
        else setLanguage('en');
    };

    if (!dailyContent.content) {
        return <Loading />;
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    {ramadanMode && (
                        <div className={styles.ramadanBanner}>
                            <Moon size={24} />
                            <span>{language === 'fr' ? 'Ramadan Moubarak' : (language === 'ar' ? 'رمضان مبارك' : 'Ramadan Mubarak')}</span>
                        </div>
                    )}
                    <div className={styles.headerButtons}>
                        <button onClick={() => setShowSettings(true)} className={styles.settingsButton} title="Settings">
                            <SettingsIcon size={20} />
                        </button>
                        <button onClick={toggleLanguage} className={styles.langButton}>
                            <Globe size={18} />
                            <span>{language.toUpperCase()}</span>
                        </button>
                    </div>
                </div>

                <div className={styles.greeting}>
                    <h1>{t('greeting')}</h1>
                    <p>{t('dashboard_subtitle')}</p>
                </div>

                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {searchQuery && (
                        <button onClick={clearSearch} className={styles.clearButton}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            </header>

            {isSearching ? (
                <main className={styles.content}>
                    <h2 className={styles.sectionTitle}>{t('results_for')} &ldquo;{searchQuery}&rdquo;</h2>
                    {searchResults.length > 0 ? (
                        <div className={styles.resultsGrid}>
                            {searchResults.map(item => (
                                <ContextCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>
                            <p>{t('no_results')}</p>
                        </div>
                    )}
                </main>
            ) : (
                <>
                    <nav className={styles.tabsContainer}>
                        <div className={styles.tabsWrapper} id="main-tabs">
                            {['today', 'quran', 'invocations', 'reminders'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                                    onClick={() => {
                                        if (tab === 'quran') {
                                            setQuranKey(k => k + 1);
                                            setQuranTarget(null);
                                        }
                                        setActiveTab(tab);
                                    }}
                                >
                                    {t(tab)}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <main className={styles.content}>
                        {activeTab === 'today' && (
                            <div className={styles.todayGrid}>
                                {/* Ramadan Countdown */}
                                {ramadanMode && (
                                    <div
                                        className={styles.card}
                                        style={{ borderColor: 'var(--primary)', background: 'var(--bg-secondary)' }}
                                    >
                                        <h3 style={{ color: 'var(--primary)' }}>🌙 {nextEventName}</h3>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>
                                            {timeToNextEvent}
                                        </div>
                                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                            {language === 'fr' ? 'Compte à rebours calculé sur cet appareil' : language === 'ar' ? 'العد التنازلي محسوب على هذا الجهاز' : 'Countdown calculated on this device'}
                                        </p>
                                    </div>
                                )}

                                {/* Prayer Checklist with Date */}
                                <div className={styles.card}>
                                    <PrayerTimesPanel />
                                </div>

                                <div className={styles.card}>
                                    <DailyReadingCompanion />
                                </div>

                                {/* Verse of the Day */}
                                <div className={styles.card}>
                                    <h3>{language === 'fr' ? '📖 Verset du Jour' : (language === 'ar' ? '📖 آية اليوم' : '📖 Verse of the Day')}</h3>
                                    {dailyContent.content ? (
                                        <>
                                            <p className={styles.quote}>
                                                &ldquo;{'text' in dailyContent.content ? dailyContent.content.text : ''}&rdquo;
                                            </p>

                                            {/* Translation Logic - Hide if language is Arabic (as text is likely already Arabic or we want to avoid fallback) */}
                                            {language !== 'ar' && (
                                                'translations' in dailyContent.content && dailyContent.content.translations ? (
                                                    <p className={styles.translation}>
                                                        {/* ContextItem specific translation */}
                                                        {cleanVerseTranslation(dailyContent.content.translations?.[language]?.text || dailyContent.content.translations?.fr?.text || dailyContent.content.text)}
                                                    </p>
                                                ) : 'translation' in dailyContent.content && (
                                                    <p className={styles.translation}>
                                                        {/* Hadith/Ayah translation */}
                                                        {cleanVerseTranslation(dailyContent.content.translation)}
                                                    </p>
                                                )
                                            )}

                                            {/* Source Logic - Clickable for Quran navigation */}
                                            {'surah' in dailyContent.content ? (
                                                <span
                                                    className={styles.source}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const content = dailyContent.content as QuranAyah;
                                                        const event = new CustomEvent('navigate-to-quran', {
                                                            detail: {
                                                                surahNumber: content.surah.number,
                                                                ayahNumber: content.number
                                                            }
                                                        });
                                                        window.dispatchEvent(event);
                                                    }}
                                                >
                                                    Surah {dailyContent.content.surah.englishName} ({dailyContent.content.surah.number}:{dailyContent.content.number})
                                                </span>
                                            ) : 'source' in dailyContent.content ? (
                                                <span className={styles.source}>
                                                    {(dailyContent.content as any).source}
                                                </span>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div style={{ padding: '0.5rem 0' }}>
                                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90%' }}></div>
                                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80%' }}></div>
                                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40%', marginTop: '1rem', marginLeft: 'auto' }}></div>
                                        </div>
                                    )}
                                </div>

                                {/* Daily Dua */}
                                <div className={styles.card}>
                                    <DailyDua />
                                </div>

                                {/* Favorites Section */}
                                <div className={styles.card}>
                                    <FavoritesSection
                                        onNavigateToVerse={(surahNumber, ayahNumber) => {
                                            setQuranTarget({ surahNumber, ayahNumber });
                                            setQuranKey(k => k + 1);
                                            setActiveTab('quran');
                                        }}
                                        onNavigateToTab={tab => setActiveTab(tab)}
                                    />
                                </div>
                            </div>
                        )}
                        {activeTab === 'quran' && (
                            <QuranBrowser key={`quran-${quranKey}`} initialTarget={quranTarget} />
                        )}

                        {activeTab === 'invocations' && (
                            <InvocationsLibrary />
                        )}

                        {activeTab === 'reminders' && (
                            <RemindersList />
                        )}


                    </main>
                </>
            )
            }

            {/* Settings Modal */}
            {showSettings && (
                <Settings onClose={() => setShowSettings(false)} />
            )}
        </div >
    );
}
