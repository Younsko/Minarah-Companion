'use client';

'use client';

import { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { CheckCircle, Trophy, Edit2, BookOpen, Heart } from 'lucide-react';
import { localState } from '@/lib/local-state';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n-context';

const MISSIONS = [
    { id: 1, titleKey: 'mission_bismillah', xp: 10, icon: '🍽️' },
    { id: 2, titleKey: 'mission_clean', xp: 20, icon: '🧹' },
    { id: 3, titleKey: 'mission_read', xp: 30, icon: '📖' },
    { id: 4, titleKey: 'mission_help', xp: 25, icon: '🤝' },
    { id: 5, titleKey: 'mission_smile', xp: 15, icon: '😊' },
];

const STORIES = [
    { id: 1, title: 'Prophet Yunus & the Whale', type: 'story' },
    { id: 2, title: 'The Ant & Prophet Sulaiman', type: 'story' },
    { id: 3, title: 'How to Pray: Fajr', type: 'guide' },
];
interface KidsProgress { xp: number; level: number; completedMissions: number[]; history: { date: string; xpEarned: number }[] }
const DEFAULT_PROGRESS: KidsProgress = { xp: 0, level: 1, completedMissions: [], history: [] };

export default function KidsDashboard() {
    const [progress, setProgress] = useState<KidsProgress | null>(null);
    const [name, setName] = useState('Little Explorer');
    const [isEditingName, setIsEditingName] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [activeTab, setActiveTab] = useState<'missions' | 'stories'>('missions');
    const { t } = useI18n();

    useEffect(() => {
        async function load() {
            try {
                const saved = localState.getItem('minarah-kids-progress');
                setProgress(saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS);
            } catch { setProgress(DEFAULT_PROGRESS); }
        }
        load();
    }, []);

    const handleNameChange = async (newName: string) => {
        // Basic filter for offensive words (demo purpose)
        const badWords = ['bad', 'stupid', 'hate'];
        if (badWords.some(w => newName.toLowerCase().includes(w))) return;

        setName(newName);
        localState.setItem('minarah-kids-name', newName);
        setIsEditingName(false);
    };

    const handleMissionComplete = async (missionId: number, xpReward: number) => {
        if (!progress) return;
        if (progress.completedMissions.includes(missionId)) return;

        const newXp = progress.xp + xpReward;
        const newLevel = Math.floor(newXp / 100) + 1;
        const leveledUp = newLevel > progress.level;

        const newProgress = {
            ...progress,
            xp: newXp,
            level: newLevel,
            completedMissions: [...progress.completedMissions, missionId],
            history: [...progress.history, { date: new Date().toISOString(), xpEarned: xpReward }]
        };

        setProgress(newProgress);
        localState.setItem('minarah-kids-progress', JSON.stringify(newProgress));

        if (leveledUp) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 4000);
        }
    };

    if (!progress) return null; // No loading flash

    const xpForNextLevel = progress.level * 100;
    const progressPercent = (progress.xp % 100) / 100 * 100;

    return (
        <div className={styles.dashboard}>
            {showLevelUp && (
                <div className={styles.levelUpOverlay}>
                    <div className={styles.levelUpCard}>
                        <Trophy size={80} color="#FFD700" className={styles.trophyIcon} />
                        <h2>{t('level_up')}</h2>
                        <p>You are now {t('level')} {progress.level}</p>
                        <div className={styles.rewardBadge}>
                            <BookOpen size={20} />
                            <span>{t('new_story_unlocked')}</span>
                        </div>
                    </div>
                </div>
            )}

            <header className={styles.header}>
                <div className={styles.profileSection}>
                    <div className={styles.avatarContainer}>
                        <Image src="/kids-mascot.png" alt="Mascot" width={80} height={80} className={styles.avatar} />
                    </div>
                    <div className={styles.profileInfo}>
                        {isEditingName ? (
                            <input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => handleNameChange(name)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameChange(name)}
                                className={styles.nameInput}
                            />
                        ) : (
                            <h2 onClick={() => setIsEditingName(true)} className={styles.name}>
                                {name} <Edit2 size={14} className={styles.editIcon} />
                            </h2>
                        )}
                        <div className={styles.levelBadge}>{t('level')} {progress.level}</div>
                    </div>
                </div>

                <div className={styles.xpContainer}>
                    <div className={styles.xpBar}>
                        <div className={styles.xpFill} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span>{progress.xp} / {xpForNextLevel} {t('xp')}</span>
                </div>
            </header>

            <nav className={styles.nav}>
                <button
                    className={`${styles.navBtn} ${activeTab === 'missions' ? styles.active : ''}`}
                    onClick={() => setActiveTab('missions')}
                >
                    {t('missions')}
                </button>
                <button
                    className={`${styles.navBtn} ${activeTab === 'stories' ? styles.active : ''}`}
                    onClick={() => setActiveTab('stories')}
                    title={t('stories')}
                >
                    <BookOpen size={20} />
                </button>
            </nav>

            <main className={styles.main}>
                {activeTab === 'missions' ? (
                    <>
                        <div className={styles.companionArea}>
                            {/* 2D Mascot is in header now, keeping this clean */}
                            <div className={styles.dailyMessage}>
                                &ldquo;{t('kids_greeting')} {name}! {t('kids_msg')}&rdquo;
                            </div>
                        </div>

                        <div className={styles.missionsGrid}>
                            {MISSIONS.map(mission => {
                                const isCompleted = progress.completedMissions.includes(mission.id);
                                return (
                                    <button
                                        key={mission.id}
                                        className={`${styles.missionCard} ${isCompleted ? styles.completed : ''}`}
                                        onClick={() => handleMissionComplete(mission.id, mission.xp)}
                                        disabled={isCompleted}
                                    >
                                        <div className={styles.missionIcon}>{mission.icon}</div>
                                        <div className={styles.missionContent}>
                                            <h3>{t(mission.titleKey)}</h3>
                                            <span className={styles.xpReward}>+{mission.xp} {t('xp')}</span>
                                        </div>
                                        {isCompleted && <CheckCircle className={styles.checkIcon} size={24} />}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className={styles.storiesGrid}>
                        <div className={styles.storyCard}>
                            <div className={styles.storyThumb}>
                                <Image src="/kids-story.png" alt="Story" width={120} height={120} />
                            </div>
                            <h3>{t('story_yunus')}</h3>
                            <button className={styles.readBtn}>{t('read_story')}</button>
                        </div>

                        <div className={styles.storyCard}>
                            <div className={styles.storyThumb}>
                                <Image src="/kids-prayer.png" alt="Prayer" width={120} height={120} />
                            </div>
                            <h3>{t('guide_fajr')}</h3>
                            <button className={styles.readBtn}>{t('watch_guide')}</button>
                        </div>

                        <div className={styles.storyCard}>
                            <div className={styles.storyThumb}>
                                <Image src="/kids-story.png" alt="Story" width={120} height={120} />
                            </div>
                            <h3>{t('story_sulaiman')}</h3>
                            <button className={styles.readBtn}>{t('read_story')}</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
