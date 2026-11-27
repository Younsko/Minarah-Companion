'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect, useRef } from 'react';
import styles from './QuranBrowser.module.css';
import { Search, Play, Pause, ChevronLeft, BookOpen, Bookmark, ArrowRight, Plus, Minus, Repeat2, Star, Volume2, VolumeX, SkipForward, SkipBack, LocateFixed } from 'lucide-react';
import { fetchSurahList } from '@/app/actions';
import { useI18n } from '@/lib/i18n-context';
import { RECITERS, getDefaultReciter } from '@/lib/reciters';
import CustomSelect from '@/components/CustomSelect';
import { addFavorite, removeFavorite, isFavorited, getFavoriteByIdentifier } from '@/lib/favorites';

interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
    footnotes?: string | null;
}

interface LastRead {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    timestamp: number;
}



interface QuranBrowserProps {
    initialTarget?: { surahNumber: number, ayahNumber: number } | null;
}

export default function QuranBrowser({ initialTarget }: QuranBrowserProps) {
    const { language, t } = useI18n();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [freeView, setFreeView] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [lastRead, setLastRead] = useState<LastRead | null>(null);
    const [favoritesVersion, setFavoritesVersion] = useState(0); // For forcing re-render on favorite change

    // Static Quran Data (loaded from /data/quran/surah-X.json for speed!)
    const [cachedSurahData, setCachedSurahData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // Load Quran from static files (fast CDN delivery!)
    useEffect(() => {
        if (selectedSurah) {
            setCachedSurahData(null);
            setIsLoading(true);

            fetch(`/data/quran/surah-${selectedSurah.number}.json`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (data) {
                        setCachedSurahData(data);
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load static quran:', err);
                    setIsLoading(false);
                });
        } else {
            setCachedSurahData(null);
            setIsLoading(false);
        }
    }, [selectedSurah]);


    // ... existing state ...

    // Check for missing data and force reseed if needed


    // UI State
    const [fontSize, setFontSize] = useState(28); // Default larger for Quran
    const [showTranslation, setShowTranslation] = useState(true);
    const [showTransliteration, setShowTransliteration] = useState(true);
    const [showResizer, setShowResizer] = useState(false); // Collapsed by default on mobile

    // Audio State
    const [currentAyahIndex, setCurrentAyahIndex] = useState(-1);
    const currentAyahIndexRef = useRef(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingBismillah, setPlayingBismillah] = useState(false);
    const playingBismillahRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedReciter, setSelectedReciter] = useState(() => getDefaultReciter());
    const [loopVerse, setLoopVerse] = useState<number | null>(null); // Verse number to loop, null if not looping
    const [volume, setVolume] = useState(0.8); // Volume 0-1

    const scrollQuranToTop = () => {
        const root = containerRef.current;
        if (!root) return;
        let parent = root.parentElement;
        while (parent) {
            const overflowY = window.getComputedStyle(parent).overflowY;
            if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
                parent.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            parent = parent.parentElement;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Navigation on Load Logic
    const pendingScrollRef = useRef<{ ayahNumber: number } | null>(null);

    // Sync refs with state
    useEffect(() => {
        currentAyahIndexRef.current = currentAyahIndex;
    }, [currentAyahIndex]);

    useEffect(() => {
        playingBismillahRef.current = playingBismillah;
    }, [playingBismillah]);

    // Sync volume with audio element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handleFontSizeChange = (delta: number) => {
        setFontSize(prev => Math.min(Math.max(prev + delta, 20), 48));
    };

    // Progressive Rendering State
    const [visibleVersesCount, setVisibleVersesCount] = useState(10);

    // Reset visible verses when surah changes
    useEffect(() => {
        setVisibleVersesCount(10);
    }, [selectedSurah]);

    useEffect(() => {
        if (!selectedSurah) return;
        const frame = window.requestAnimationFrame(scrollQuranToTop);
        return () => window.cancelAnimationFrame(frame);
    }, [selectedSurah]);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        const allowFreeView = () => {
            if (isPlaying) setFreeView(true);
        };
        const allowFreeViewFromKeyboard = (event: KeyboardEvent) => {
            const target = event.target;
            const isTyping = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName));
            if (isPlaying && !isTyping && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
                setFreeView(true);
            }
        };
        const allowFreeViewFromScrollbar = (event: PointerEvent) => {
            const scrollable = (() => {
                let parent = root.parentElement;
                while (parent) {
                    const overflowY = window.getComputedStyle(parent).overflowY;
                    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
                    parent = parent.parentElement;
                }
                return null;
            })();
            if (!isPlaying || !scrollable) return;
            const bounds = scrollable.getBoundingClientRect();
            if (event.clientX >= bounds.right - 18 && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
                setFreeView(true);
            }
        };
        window.addEventListener('wheel', allowFreeView, { passive: true });
        document.addEventListener('touchmove', allowFreeView, { passive: true });
        document.addEventListener('keydown', allowFreeViewFromKeyboard);
        window.addEventListener('pointerdown', allowFreeViewFromScrollbar);
        return () => {
            window.removeEventListener('wheel', allowFreeView);
            document.removeEventListener('touchmove', allowFreeView);
            document.removeEventListener('keydown', allowFreeViewFromKeyboard);
            window.removeEventListener('pointerdown', allowFreeViewFromScrollbar);
        };
    }, [isPlaying]);

    // Infinite Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                setVisibleVersesCount(prev => prev + 10);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        async function loadSurahs() {
            setIsLoadingList(true);
            const list = await fetchSurahList();
            setSurahs(list);
            setFilteredSurahs(list);
            setIsLoadingList(false);

            // Handle initial target navigation
            if (initialTarget) {
                const targetSurah = list.find(s => s.number === initialTarget.surahNumber);
                if (targetSurah) {
                    // If we are already on this surah, just scroll
                    if (selectedSurah?.number === targetSurah.number) {
                        // Ensure verse is rendered before scrolling
                        if (initialTarget.ayahNumber > visibleVersesCount) {
                            setVisibleVersesCount(initialTarget.ayahNumber + 5);
                        }
                        setTimeout(() => scrollToAyah(initialTarget.ayahNumber), 300);
                    } else {
                        // Otherwise switch surah and queue scroll
                        handleSurahClick(targetSurah);
                        pendingScrollRef.current = { ayahNumber: initialTarget.ayahNumber };
                    }
                }
            }
        }
        loadSurahs();

        // Load Last Read
        const saved = localState.getItem('muslim-life-quran-bookmark');
        if (saved && !initialTarget) {
            setLastRead(JSON.parse(saved));
        }

        // Load Settings
        const savedSettings = localState.getItem('muslim-life-quran-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setShowTranslation(settings.showTranslation ?? true);
            setShowTransliteration(settings.showTransliteration ?? true);
        }
    }, [initialTarget]);

    // Save Settings
    useEffect(() => {
        localState.setItem('muslim-life-quran-settings', JSON.stringify({
            showTranslation,
            showTransliteration
        }));
    }, [showTranslation, showTransliteration]);

    // Listen for reciter changes from Settings modal
    useEffect(() => {
        const handleReciterChanged = (e: CustomEvent) => {
            setSelectedReciter(e.detail);
        };
        window.addEventListener('reciter-changed', handleReciterChanged as EventListener);
        return () => window.removeEventListener('reciter-changed', handleReciterChanged as EventListener);
    }, []);

    // Execute pending scroll when data is loaded
    useEffect(() => {
        if (cachedSurahData && pendingScrollRef.current) {
            const { ayahNumber } = pendingScrollRef.current;

            // First, ensure the verse is rendered by expanding visibleVersesCount
            // Add extra buffer to ensure smooth scrolling
            if (ayahNumber > visibleVersesCount) {
                setVisibleVersesCount(ayahNumber + 5);
            }

            // Delay scroll to allow rendering of the expanded verse list
            setTimeout(() => {
                scrollToAyah(ayahNumber);
                pendingScrollRef.current = null;
            }, 600);
        }
    }, [cachedSurahData, visibleVersesCount]);



    // Update audio source when reciter changes if playing
    useEffect(() => {
        if (isPlaying && audioRef.current && cachedSurahData && cachedSurahData[0]) {
            const currentAyah = cachedSurahData[0].ayahs[currentAyahIndex];
            if (currentAyah) {
                const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${currentAyah.number}.mp3`;
                const currentTime = audioRef.current.currentTime;
                audioRef.current.src = audioUrl;
                audioRef.current.currentTime = currentTime;
                audioRef.current.play().catch(console.error);
            }
        }
    }, [selectedReciter]);

    // Auto-scroll to active ayah and bookmark
    useEffect(() => {
        if (currentAyahIndex !== -1 && cachedSurahData) {
            // Handle both array and object structures for robustness
            let ayahs;
            if (Array.isArray(cachedSurahData) && cachedSurahData[0]) {
                ayahs = cachedSurahData[0].ayahs;
            } else if (cachedSurahData.ayahs) {
                ayahs = cachedSurahData.ayahs;
            } else if (cachedSurahData.editions && cachedSurahData.editions[0]) {
                ayahs = cachedSurahData.editions[0].ayahs;
            }

            if (ayahs && ayahs[currentAyahIndex]) {
                const ayah = ayahs[currentAyahIndex];
                const ayahNumber = ayah.numberInSurah;

                // Let the listener take control of the reading position while playback continues.
                if (!freeView) {
                    if (ayahNumber > visibleVersesCount) {
                        setVisibleVersesCount(ayahNumber + 5);
                        setTimeout(() => {
                            document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    } else {
                        document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }

                // Auto-bookmark
                if (selectedSurah) {
                    saveProgress(selectedSurah, ayahNumber);
                }
            }
        }
    }, [currentAyahIndex, cachedSurahData, selectedSurah, visibleVersesCount, freeView]);

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            setFilteredSurahs(surahs.filter(s =>
                s.englishName.toLowerCase().includes(lower) ||
                s.englishNameTranslation.toLowerCase().includes(lower) ||
                s.number.toString().includes(lower)
            ));
        } else {
            setFilteredSurahs(surahs);
        }
    }, [searchQuery, surahs]);

    const handleSurahClick = (surah: Surah) => {
        setSelectedSurah(surah);
        setFreeView(false);
        setSearchQuery('');
        // Reset audio
        setIsPlaying(false);
        setCurrentAyahIndex(-1);
        setPlayingBismillah(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleBackToList = () => {
        setSelectedSurah(null);
        setFreeView(false);
        setSearchQuery('');
        setIsPlaying(false);
        setPlayingBismillah(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleResume = () => {
        if (lastRead) {
            const surah = surahs.find(s => s.number === lastRead.surahNumber);
            if (surah) {
                // Navigate to surah but preserve the ayah to resume from
                setSelectedSurah(surah);
                setFreeView(false);
                setSearchQuery('');
                // Set currentAyahIndex based on lastRead so play button resumes from there
                // We subtract 1 because ayahNumber is 1-indexed but array index is 0-indexed
                setCurrentAyahIndex(lastRead.ayahNumber - 1);
                setIsPlaying(false);
                setPlayingBismillah(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                pendingScrollRef.current = { ayahNumber: lastRead.ayahNumber };
            }
        }
    };

    const scrollToAyah = (ayahNumber: number) => {
        setFreeView(false);
        const element = document.getElementById(`ayah-${ayahNumber}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            element.classList.add(styles.activeAyah);
            setTimeout(() => element.classList.remove(styles.activeAyah), 2000);
        }
    };

    const saveProgress = (surah: Surah, ayahNumber: number) => {
        const progress: LastRead = {
            surahNumber: surah.number,
            surahName: surah.englishName,
            ayahNumber,
            timestamp: Date.now()
        };
        setLastRead(progress);
        localState.setItem('muslim-life-quran-bookmark', JSON.stringify(progress));
    };

    const playAudio = async (index: number) => {
        if (!cachedSurahData || !cachedSurahData[0]) return;
        setFreeView(false);

        // If clicking the same ayah that is currently playing/paused
        if (currentAyahIndex === index) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play();
                setIsPlaying(true);
            }
            return;
        }

        // If starting a new ayah
        if (index === 0 && selectedSurah?.number !== 1 && selectedSurah?.number !== 9) {
            // Play Bismillah first for all surahs except Al-Fatiha (1) and At-Tawbah (9)
            setPlayingBismillah(true);
            setCurrentAyahIndex(index); // Set index but mark as bismillah playing
            setIsPlaying(true);

            if (audioRef.current) {
                audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/1.mp3`; // Bismillah is Ayah 1 of Surah 1
                try {
                    await audioRef.current.play();
                } catch (e) {
                    console.error("Audio play failed", e);
                    setIsPlaying(false);
                }
            }
        } else {
            playAyah(index);
        }
    };

    const playAyah = async (index: number) => {
        if (!cachedSurahData || !cachedSurahData[0]) return;

        const ayahs = cachedSurahData[0].ayahs;
        if (index >= ayahs.length) {
            // Surah finished - automatically play next surah if available
            if (selectedSurah && selectedSurah.number < 114) {
                const nextSurah = surahs.find(s => s.number === selectedSurah.number + 1);
                if (nextSurah) {
                    // Switch to next surah and start playing from beginning
                    handleSurahClick(nextSurah);
                    // Queue playback to start after surah data loads
                    setTimeout(() => {
                        playAudio(0);
                    }, 1000);
                    return;
                }
            }
            // No next surah (we're at Surah 114) - stop playback
            setIsPlaying(false);
            setCurrentAyahIndex(-1);
            return;
        }

        setPlayingBismillah(false);
        setCurrentAyahIndex(index);
        setIsPlaying(true);

        const ayah = ayahs[index];
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${ayah.number}.mp3`;

        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            try {
                await audioRef.current.play();
            } catch (e) {
                console.error("Audio play failed", e);
                setIsPlaying(false);
            }
        }
    };

    const handleAudioEnded = () => {
        if (playingBismillahRef.current) {
            // Bismillah finished, play first ayah
            playAyah(0);
        } else if (loopVerse !== null && currentAyahIndexRef.current + 1 === loopVerse) {
            // Loop mode: replay same verse after 2 second delay
            setTimeout(() => {
                playAyah(currentAyahIndexRef.current);
            }, 2000);
        } else {
            // Ayah finished, play next
            const nextIndex = currentAyahIndexRef.current + 1;
            playAyah(nextIndex);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleBookmark = (surah: Surah, ayahNumber: number) => {
        const bookmark: LastRead = {
            surahNumber: surah.number,
            surahName: surah.englishName,
            ayahNumber: ayahNumber,
            timestamp: Date.now()
        };
        setLastRead(bookmark);
        localState.setItem('muslim-life-quran-bookmark', JSON.stringify(bookmark));
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            // If we have a current ayah selected (e.g. from navigation), play it
            if (currentAyahIndex !== -1) {
                // If src is not set or we want to ensure correct track
                if (!audioRef.current?.src || audioRef.current.ended) {
                    playAyah(currentAyahIndex); // Force play the verse directly if we are resuming
                } else {
                    audioRef.current?.play().catch(e => console.error("Audio play failed", e));
                }
            } else {
                // Start from beginning
                playAyah(0);
            }
            setIsPlaying(true);
        }
    };

    // Render Surah List
    if (!selectedSurah) {
        return (
            <div className={styles.container}>
                <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={language === 'fr' ? 'Rechercher une sourate...' : 'Search Surah...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {lastRead && (
                    <div className={styles.lastReadContainer}>
                        <div className={styles.lastReadHeader}>
                            <Bookmark size={16} className={styles.lastReadIcon} />
                            <span>{t('continueReading')}</span>
                        </div>
                        <div className={styles.lastReadCard} onClick={() => {
                            const surah = surahs.find(s => s.number === lastRead.surahNumber);
                            if (surah) {
                                setSelectedSurah(surah);
                                setSearchQuery('');
                                setCurrentAyahIndex(lastRead.ayahNumber - 1);
                                setIsPlaying(false);
                                setPlayingBismillah(false);
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current.currentTime = 0;
                                }
                                pendingScrollRef.current = { ayahNumber: lastRead.ayahNumber };
                            }
                        }}>
                            <div className={styles.lastReadInfo}>
                                <span className={styles.lastReadSurah}>{lastRead.surahName}</span>
                                <span className={styles.lastReadAyah}>Ayah {lastRead.ayahNumber}</span>
                            </div>
                            <ArrowRight size={18} className={styles.lastReadArrow} />
                        </div>
                    </div>
                )}

                {isLoadingList ? (
                    <div className={styles.loadingSpinner}>
                        <div className={styles.spinner} />
                        <span>{language === 'fr' ? 'Chargement...' : 'Loading...'}</span>
                    </div>
                ) : (
                    <div className={styles.surahGrid}>
                        {filteredSurahs.map(surah => (
                            <button
                                key={surah.number}
                                className={styles.surahCard}
                                onClick={() => handleSurahClick(surah)}
                            >
                                <div className={styles.surahNumber}>{surah.number}</div>
                                <div className={styles.surahInfo}>
                                    <h3>{surah.englishName}</h3>
                                    <p>{surah.englishNameTranslation}</p>
                                </div>
                                <div className={styles.arabicName}>
                                    {surah.name.replace('سورة ', '')}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Render Quran View
    return (
        <div className={styles.container} ref={containerRef}>

            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                style={{ display: 'none' }}
            />

            {/* Floating Font Resizer & Settings - Collapsible */}
            <div className={`${styles.floatingFontResizer} ${showResizer ? styles.resizerExpanded : styles.resizerCollapsed}`}>
                {/* Toggle Button - Always visible */}
                <button
                    onClick={() => setShowResizer(!showResizer)}
                    className={styles.resizerToggle}
                    title={showResizer ? "Hide Settings" : "Show Settings"}
                >
                    {showResizer ? '✕' : 'Aa'}
                </button>

                {/* Expandable Content */}
                {showResizer && (
                    <>
                        <button
                            onClick={() => handleFontSizeChange(2)}
                            className={styles.resizerBtn}
                            title="Increase Font Size"
                        >
                            <Plus size={16} />
                        </button>
                        <span className={styles.resizerValue}>{fontSize}</span>
                        <button
                            onClick={() => handleFontSizeChange(-2)}
                            className={styles.resizerBtn}
                            title="Decrease Font Size"
                        >
                            <Minus size={16} />
                        </button>

                        <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', margin: '0.25rem 0' }} />

                        <button
                            onClick={() => setShowTranslation(!showTranslation)}
                            className={`${styles.resizerBtn} ${showTranslation ? styles.bookmarked : ''}`}
                            title="Toggle Translation"
                            style={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                        >
                            {language === 'fr' ? 'FR' : 'EN'}
                        </button>
                        <button
                            onClick={() => setShowTransliteration(!showTransliteration)}
                            className={`${styles.resizerBtn} ${showTransliteration ? styles.bookmarked : ''}`}
                            title="Toggle Transliteration"
                            style={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                        >
                            TR
                        </button>
                    </>
                )}
            </div>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <button onClick={handleBackToList} className={styles.backToListButton}>
                            <ChevronLeft size={24} />
                        </button>
                    </div>

                    <div className={styles.headerCenter}>
                        {/* Previous Surah Button with Name */}
                        {selectedSurah.number > 1 ? (() => {
                            const prevSurah = surahs.find(s => s.number === selectedSurah.number - 1);
                            return prevSurah ? (
                                <button
                                    className={styles.navButtonWithName}
                                    onClick={() => handleSurahClick(prevSurah)}
                                >
                                    <ChevronLeft size={20} />
                                    <div className={styles.navButtonText}>
                                        <span className={styles.navButtonLabel}>Previous</span>
                                        <span className={styles.navButtonSurah}>{prevSurah.englishName}</span>
                                    </div>
                                </button>
                            ) : null;
                        })() : (
                            <div className={styles.navButtonPlaceholder} />
                        )}

                        <div className={styles.navSurahInfo}>
                            <span className={styles.navSurahName}>{selectedSurah.englishName}</span>
                            <span className={styles.navSurahArabic}>{selectedSurah.name}</span>
                        </div>

                        {/* Next Surah Button with Name */}
                        {selectedSurah.number < 114 ? (() => {
                            const nextSurah = surahs.find(s => s.number === selectedSurah.number + 1);
                            return nextSurah ? (
                                <button
                                    className={styles.navButtonWithName}
                                    onClick={() => handleSurahClick(nextSurah)}
                                >
                                    <div className={styles.navButtonText}>
                                        <span className={styles.navButtonLabel}>Next</span>
                                        <span className={styles.navButtonSurah}>{nextSurah.englishName}</span>
                                    </div>
                                    <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                            ) : null;
                        })() : (
                            <div className={styles.navButtonPlaceholder} />
                        )}
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.ayahInputContainer}>
                            <span className={styles.ayahInputLabel}>Ayah</span>
                            <input
                                type="number"
                                min={1}
                                max={selectedSurah?.numberOfAyahs || 1}
                                defaultValue={currentAyahIndex + 1 > 0 ? currentAyahIndex + 1 : ''}
                                key={`ayah-input-${currentAyahIndex}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const val = parseInt(input.value);
                                        if (selectedSurah && !isNaN(val) && val >= 1 && val <= selectedSurah.numberOfAyahs) {
                                            // Ensure verse is rendered
                                            if (val > visibleVersesCount) {
                                                setVisibleVersesCount(val + 5);
                                            }
                                            setTimeout(() => scrollToAyah(val), 100);
                                            input.blur();
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (selectedSurah && !isNaN(val) && val >= 1 && val <= selectedSurah.numberOfAyahs) {
                                        // Ensure verse is rendered
                                        if (val > visibleVersesCount) {
                                            setVisibleVersesCount(val + 5);
                                        }
                                        setTimeout(() => scrollToAyah(val), 100);
                                    }
                                }}
                                className={styles.verseInput}
                            />
                            <span className={styles.ayahTotal}>/ {selectedSurah?.numberOfAyahs}</span>
                        </div>

                        <div className={styles.audioControls}>
                            <div className={styles.reciterSelectWrapper}>
                                <CustomSelect
                                    options={RECITERS}
                                    value={selectedReciter}
                                    onChange={setSelectedReciter}
                                />
                            </div>
                            <button onClick={togglePlayPause} className={styles.playButton}>
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p style={{ margin: '0.6rem 1rem', textAlign: 'center', fontSize: '0.72rem', opacity: 0.68 }}>
                Texte arabe : <a href="https://alquran.cloud/credits" target="_blank" rel="noreferrer">AlQuranCloud</a> · Traductions : <a href="https://quranenc.com/en/home/api" target="_blank" rel="noreferrer">QuranEnc</a>, Noor International Center (EN 1.1.2 · FR 1.0.0).
            </p>

            {/* Floating Audio Player */}
            {selectedSurah && (
                <div className={`${styles.floatingPlayer} ${isPlaying ? styles.playerActive : ''}`}>
                    {isPlaying && freeView && currentAyahIndex >= 0 && (
                        <button
                            type="button"
                            className={styles.returnToAyah}
                            onClick={() => scrollToAyah(currentAyahIndex + 1)}
                            aria-label={language === 'fr' ? 'Revenir au verset en cours' : 'Return to the verse in progress'}
                        >
                            <LocateFixed size={16} />
                            <span className={styles.freeViewLabel}>{language === 'fr' ? 'Vue libre' : language === 'ar' ? 'عرض حر' : 'Free view'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{language === 'fr' ? 'Revenir au verset' : language === 'ar' ? 'العودة إلى الآية' : 'Return to verse'}</span>
                        </button>
                    )}
                    <div className={styles.playerContent}>
                        {/* Current Info */}
                        <div className={styles.playerInfo}>
                            <span className={styles.playerSurah}>{selectedSurah.englishName}</span>
                            <span className={styles.playerAyah}>
                                {currentAyahIndex >= 0 ? `Ayah ${currentAyahIndex + 1}` : '—'}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className={styles.playerControls}>
                            <button
                                className={styles.playerBtn}
                                onClick={() => {
                                    if (currentAyahIndex > 0) {
                                        playAudio(currentAyahIndex - 1);
                                    }
                                }}
                                disabled={currentAyahIndex <= 0}
                            >
                                <SkipBack size={18} />
                            </button>

                            <button
                                className={styles.playerPlayBtn}
                                onClick={togglePlayPause}
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: '2px' }} />}
                            </button>

                            <button
                                className={styles.playerBtn}
                                onClick={() => {
                                    const maxIndex = cachedSurahData?.[0]?.ayahs?.length || 0;
                                    if (currentAyahIndex < maxIndex - 1) {
                                        playAudio(currentAyahIndex + 1);
                                    }
                                }}
                            >
                                <SkipForward size={18} />
                            </button>
                        </div>

                        {/* Volume */}
                        <div className={styles.playerVolume}>
                            <button
                                className={styles.playerBtn}
                                onClick={() => setVolume(v => v === 0 ? 0.8 : 0)}
                            >
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className={styles.volumeSlider}
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isPlaying && (
                        <div className={styles.playerProgress}>
                            <div
                                className={styles.playerProgressFill}
                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`${styles.content} ${styles.noScrollbar}`}>
                {(!cachedSurahData) ? (
                    <div className={styles.ayahList}>
                        <div className={styles.bismillahContainer}>
                            <div className={styles.bismillah} style={{ opacity: 0.3 }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={styles.skeletonContainer}>
                                <div className={styles.skeletonHeader}>
                                    <div className={`${styles.skeletonNumber} ${styles.skeleton}`} />
                                    <div className={styles.skeletonActions}>
                                        <div className={`${styles.skeletonBtn} ${styles.skeleton}`} />
                                        <div className={`${styles.skeletonBtn} ${styles.skeleton}`} />
                                        <div className={`${styles.skeletonBtn} ${styles.skeleton}`} />
                                    </div>
                                </div>
                                <div className={`${styles.skeletonArabic} ${styles.skeleton}`} />
                                <div className={`${styles.skeletonTranslation} ${styles.skeleton}`} />
                                <div className={`${styles.skeletonTranslationShort} ${styles.skeleton}`} />
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles.loading} style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                Loading Quran...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.ayahList}>
                        <div className={styles.bismillahContainer}>
                            <div className={styles.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
                            <div className={styles.bismillahTranslation}>In the name of Allah, the Entirely Merciful, the Especially Merciful</div>
                        </div>

                        {(() => {
                            // Handle different data structures
                            let quranEdition: any = null;
                            let translationEdition: any = null;
                            let transliterationEdition: any = null;

                            if (Array.isArray(cachedSurahData)) {
                                quranEdition = cachedSurahData.find((e: any) => e.edition?.identifier === 'quran-uthmani' || e.identifier === 'quran-uthmani');
                                // Fallback: if not found, use the first element if it looks like an edition
                                if (!quranEdition && cachedSurahData.length > 0 && cachedSurahData[0].ayahs) {
                                    quranEdition = cachedSurahData[0];
                                }

                                const translationId = language === 'fr' ? 'french_montada' : 'english_saheeh';
                                translationEdition = cachedSurahData.find((e: any) => e.edition?.identifier === translationId || e.identifier === translationId);
                                transliterationEdition = cachedSurahData.find((e: any) => e.edition?.identifier === 'en.transliteration' || e.identifier === 'en.transliteration');
                            } else if (cachedSurahData && cachedSurahData.ayahs) {
                                // Single edition object
                                quranEdition = cachedSurahData;
                            } else if (cachedSurahData && cachedSurahData.editions) {
                                // Nested editions object
                                quranEdition = cachedSurahData.editions.find((e: any) => e.edition?.identifier === 'quran-uthmani' || e.identifier === 'quran-uthmani');
                                const translationId = language === 'fr' ? 'french_montada' : 'english_saheeh';
                                translationEdition = cachedSurahData.editions.find((e: any) => e.edition?.identifier === translationId || e.identifier === translationId);
                                transliterationEdition = cachedSurahData.editions.find((e: any) => e.edition?.identifier === 'en.transliteration' || e.identifier === 'en.transliteration');
                            }

                            if (quranEdition && quranEdition.ayahs) {
                                // Progressive Rendering Logic
                                // We render the first 20 verses immediately, then the rest.
                                // Note: We need to use a state for this, but we are inside a render function.
                                // We should move this logic out or use a simple slice for now if we can't use state here.
                                // Actually, we can just render all of them but React might be slow.
                                // Let's use a simple slice based on a state variable we'll add to the component.

                                const versesToRender = quranEdition.ayahs.slice(0, visibleVersesCount);

                                return (
                                    <>
                                        {versesToRender.map((ayah: Ayah, index: number) => {
                                            const translation = translationEdition?.ayahs?.[index];
                                            const transliteration = transliterationEdition?.ayahs?.[index];

                                            // Only highlight if it's the current ayah AND we are not playing the Bismillah preamble
                                            const isActive = currentAyahIndex === index && !playingBismillah;

                                            // Remove Bismillah from the first verse if it's not Al-Fatiha (1) or Tawbah (9)
                                            // Al-Fatiha's first verse IS the Bismillah so we keep it there
                                            let displayText = ayah.text;
                                            if (ayah.numberInSurah === 1 && selectedSurah.number !== 1 && selectedSurah.number !== 9) {
                                                // Remove Bismillah prefix - exact match from JSON files
                                                displayText = displayText
                                                    .replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '')
                                                    .trim();
                                            }

                                            return (
                                                <div
                                                    key={ayah.number}
                                                    id={`ayah-${ayah.numberInSurah}`}
                                                    className={`${styles.ayahContainer} ${isActive ? styles.activeAyah : ''}`}
                                                >
                                                    <div className={styles.ayahHeader}>
                                                        <div className={styles.ayahNumber}>{ayah.numberInSurah}</div>
                                                        <div className={styles.ayahActions}>
                                                            <button
                                                                className={`${styles.actionBtn} ${isFavorited('verse', `${selectedSurah.number}:${ayah.numberInSurah}`) ? styles.favorited : ''}`}
                                                                onClick={() => {
                                                                    const identifier = `${selectedSurah.number}:${ayah.numberInSurah}`;
                                                                    if (isFavorited('verse', identifier)) {
                                                                        const fav = getFavoriteByIdentifier('verse', identifier);
                                                                        if (fav) removeFavorite(fav.id);
                                                                    } else {
                                                                        addFavorite({
                                                                            type: 'verse',
                                                                            title: `${selectedSurah.englishName} ${ayah.numberInSurah}`,
                                                                            arabicText: ayah.text,
                                                                            translation: translation?.text,
                                                                            source: `Quran ${selectedSurah.number}:${ayah.numberInSurah}`,
                                                                            surahNumber: selectedSurah.number,
                                                                            ayahNumber: ayah.numberInSurah,
                                                                        });
                                                                    }
                                                                    // Force re-render
                                                                    setFavoritesVersion(v => v + 1);
                                                                }}
                                                                title="Add to favorites"
                                                            >
                                                                <Star size={16} fill={isFavorited('verse', `${selectedSurah.number}:${ayah.numberInSurah}`) ? 'currentColor' : 'none'} />
                                                            </button>
                                                            <button
                                                                className={`${styles.actionBtn} ${lastRead?.surahNumber === selectedSurah.number && lastRead?.ayahNumber === ayah.numberInSurah ? styles.bookmarked : ''}`}
                                                                onClick={() => toggleBookmark(selectedSurah, ayah.numberInSurah)}
                                                            >
                                                                <Bookmark size={16} />
                                                            </button>
                                                            <button
                                                                className={`${styles.actionBtn} ${loopVerse === ayah.numberInSurah ? styles.bookmarked : ''}`}
                                                                onClick={() => setLoopVerse(loopVerse === ayah.numberInSurah ? null : ayah.numberInSurah)}
                                                                title={loopVerse === ayah.numberInSurah ? "Stop Loop" : "Loop this verse"}
                                                            >
                                                                <Repeat2 size={16} />
                                                            </button>
                                                            <button
                                                                className={styles.playAyahBtn}
                                                                onClick={() => playAudio(index)}
                                                            >
                                                                {isActive && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={styles.arabicText}
                                                        style={{ fontSize: `${fontSize}px` }}
                                                    >
                                                        {displayText}
                                                    </div>

                                                    {showTransliteration && transliteration && (
                                                        <div
                                                            className={styles.phoneticText}
                                                            style={{ fontSize: `${Math.max(14, fontSize * 0.5)}px` }}
                                                        >
                                                            {transliteration.text}
                                                        </div>
                                                    )}

                                                    {showTranslation && translation && (
                                                        <div
                                                            className={styles.translationText}
                                                            style={{ fontSize: `${Math.max(16, fontSize * 0.6)}px` }}
                                                        >
                                                            {translation.text.replace(/^\s*(?:\(\d+\)|\d+\.)\s*/, '').replace(/\[\d+\]/g, '').trim()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {visibleVersesCount < quranEdition.ayahs.length && (
                                            <div className={styles.loading} style={{ padding: '1rem' }}>
                                                Loading more verses...
                                            </div>
                                        )}
                                    </>
                                );
                            }
                            return (
                                <div className={styles.loading}>
                                    Unable to load verses. Please try refreshing or selecting another Surah.
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
