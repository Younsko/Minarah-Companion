'use client';

import { useState, useMemo } from 'react';
import styles from './InvocationsLibrary.module.css';
import { getAllCategories, getAllTopics, getDuasByCategory, getContextualContent, ContextItem, CATEGORY_TRANSLATIONS, CATEGORY_TITLES } from '@/lib/context-engine';
import ContextCard from './ContextCard';
import OpenDuaAttribution from './OpenDuaAttribution';
import { useI18n } from '@/lib/i18n-context';
import {
    Search, Book, Compass, ArrowLeft,
    Sun, Moon, Shield, Home, Utensils,
    Plane, Heart, Cloud, Bed,
    Stethoscope, Library, BookOpen, CreditCard, HelpCircle,
    GraduationCap, HeartHandshake, Trophy,
    Clock, Users, Briefcase, Brain,
    AlertTriangle, CloudRain, Flame, ShieldAlert, Frown,
    HandHeart, BookHeart, Eye, Zap, Car
} from 'lucide-react';

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
        'morning': <Sun size={20} />,
        'evening': <Moon size={20} />,
        'protection': <Shield size={20} />,
        'home': <Home size={20} />,
        'eating': <Utensils size={20} />,
        'travel': <Plane size={20} />,
        'emotions': <Heart size={20} />,
        'weather': <Cloud size={20} />,
        'sleep': <Bed size={20} />,
        'sick': <Stethoscope size={20} />,
        'mosque': <Library size={20} />,
        'quran': <BookOpen size={20} />,
        'debt': <CreditCard size={20} />,
        'decision': <HelpCircle size={20} />,
        'exam': <GraduationCap size={20} />,
        'marriage': <HeartHandshake size={20} />,
        'success': <Trophy size={20} />,
    };
    return icons[category] || <Book size={20} />;
};

// Icon mapping for situations/topics - comprehensive coverage
const getSituationIcon = (topic: string) => {
    const icons: Record<string, React.ReactNode> = {
        // Quotidien / Daily
        'waking': <Sun size={20} />,
        'morning': <Sun size={20} />,
        'sleeping': <Moon size={20} />,
        'evening': <Moon size={20} />,
        'sleep': <Bed size={20} />,
        'eating': <Utensils size={20} />,
        'food': <Utensils size={20} />,
        'meal': <Utensils size={20} />,
        'daily': <Clock size={20} />,
        'clothes': <Heart size={20} />,
        'entering': <Home size={20} />,
        'leaving': <ArrowLeft size={20} />,
        'exit': <ArrowLeft size={20} />,
        // Émotions / Emotions
        'emotions': <Heart size={20} />,
        'anxiety': <Brain size={20} />,
        'stress': <Brain size={20} />,
        'distress': <AlertTriangle size={20} />,
        'calamity': <CloudRain size={20} />,
        'sadness': <Frown size={20} />,
        'depression': <Frown size={20} />,
        'anger': <Flame size={20} />,
        'mad': <Flame size={20} />,
        'frustrated': <Flame size={20} />,
        'fear': <ShieldAlert size={20} />,
        'worry': <Brain size={20} />,
        'love': <Heart size={20} />,
        // Lieux / Places
        'home': <Home size={20} />,
        'mosque': <Library size={20} />,
        'masjid': <Library size={20} />,
        'traveling': <Plane size={20} />,
        'travel': <Plane size={20} />,
        'journey': <Car size={20} />,
        'vehicle': <Car size={20} />,
        'transport': <Car size={20} />,
        // Protection
        'protection': <Shield size={20} />,
        'safety': <Shield size={20} />,
        'evil eye': <Eye size={20} />,
        'envy': <Eye size={20} />,
        'ruqyah': <Shield size={20} />,
        '3quls': <Shield size={20} />,
        // Santé / Health
        'sick': <Stethoscope size={20} />,
        'health': <Stethoscope size={20} />,
        'pain': <Stethoscope size={20} />,
        'illness': <Stethoscope size={20} />,
        'healing': <Stethoscope size={20} />,
        'body': <Stethoscope size={20} />,
        'visiting': <HeartHandshake size={20} />,
        // Événements météo / Weather
        'rain': <CloudRain size={20} />,
        'storm': <Zap size={20} />,
        'thunder': <Zap size={20} />,
        'wind': <Cloud size={20} />,
        'weather': <Cloud size={20} />,
        'nature': <Cloud size={20} />,
        // Travail et études / Work and study
        'work': <Briefcase size={20} />,
        'study': <GraduationCap size={20} />,
        'exam': <GraduationCap size={20} />,
        'test': <GraduationCap size={20} />,
        'student': <GraduationCap size={20} />,
        'knowledge': <GraduationCap size={20} />,
        // Famille / Family
        'family': <Users size={20} />,
        'kids': <Users size={20} />,
        'marriage': <HeartHandshake size={20} />,
        'spouse': <HeartHandshake size={20} />,
        // Religion et spiritualité / Religion
        'forgiveness': <HandHeart size={20} />,
        'adhkar': <BookHeart size={20} />,
        'quran': <BookOpen size={20} />,
        'prayer': <Library size={20} />,
        'sayyidul-istighfar': <HandHeart size={20} />,
        'dunya': <HelpCircle size={20} />,
        'akhirah': <Trophy size={20} />,
        // Décisions / Decisions
        'decision': <HelpCircle size={20} />,
        'istikhara': <HelpCircle size={20} />,
        'guidance': <HelpCircle size={20} />,
        // Finance
        'debt': <CreditCard size={20} />,
        'finance': <CreditCard size={20} />,
        // Autres / Other
        'success': <Trophy size={20} />,
        'gathering': <Users size={20} />,
        'meeting': <Users size={20} />,
        'general': <Book size={20} />,
    };
    return icons[topic] || <Book size={20} />;
};

type ViewMode = 'categories' | 'situations' | 'items';
type ContentType = 'duas' | 'situations';

export default function InvocationsLibrary() {
    const { language, t } = useI18n();
    const categories = getAllCategories();
    const topics = getAllTopics();

    const [viewMode, setViewMode] = useState<ViewMode>('categories');
    const [contentType, setContentType] = useState<ContentType>('duas');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [items, setItems] = useState<ContextItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Get translated category/topic name
    const getTranslatedName = (name: string) => {
        if (language === 'en') return CATEGORY_TITLES[name] || name.charAt(0).toUpperCase() + name.slice(1);
        if (language === 'fr' && CATEGORY_TRANSLATIONS[name]?.fr) return CATEGORY_TRANSLATIONS[name].fr;
        if (language === 'ar' && CATEGORY_TRANSLATIONS[name]?.ar) return CATEGORY_TRANSLATIONS[name].ar;
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Handle category click (Duas)
    const handleCategoryClick = (category: string) => {
        setSelectedItem(category);
        setItems(getDuasByCategory(category));
        setViewMode('items');
        setContentType('duas');
    };

    // Handle topic click (Situations)
    const handleTopicClick = (topic: string) => {
        setSelectedItem(topic);
        setItems(getContextualContent({ situation: topic }));
        setViewMode('items');
        setContentType('situations');
    };

    // Clear selection and go back
    const clearSelection = () => {
        setSelectedItem(null);
        setItems([]);
        setViewMode(contentType === 'duas' ? 'categories' : 'situations');
    };

    // Filter items based on search query (multilingual)
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item => {
            // Search in main text
            if (item.text?.toLowerCase().includes(query)) return true;
            if (item.arabic?.toLowerCase().includes(query)) return true;
            // Search in translations
            if (item.translations?.fr?.text?.toLowerCase().includes(query)) return true;
            if (item.translations?.en?.text?.toLowerCase().includes(query)) return true;
            // Search in tags
            if (item.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
            return false;
        });
    }, [items, searchQuery]);

    // Get all items for global search
    const allItems = useMemo(() => {
        const duaItems: ContextItem[] = [];
        const situationItems: ContextItem[] = [];

        categories.forEach(cat => {
            duaItems.push(...getDuasByCategory(cat));
        });

        topics.forEach(topic => {
            situationItems.push(...getContextualContent({ situation: topic }));
        });

        // Remove duplicates by ID
        const uniqueItems = new Map<string, ContextItem>();
        [...duaItems, ...situationItems].forEach(item => {
            if (!uniqueItems.has(item.id)) {
                uniqueItems.set(item.id, item);
            }
        });

        return Array.from(uniqueItems.values());
    }, [categories, topics]);

    // Global search results
    const globalSearchResults = useMemo(() => {
        if (!searchQuery.trim() || viewMode === 'items') return [];
        const query = searchQuery.toLowerCase();
        return allItems.filter(item => {
            if (item.text?.toLowerCase().includes(query)) return true;
            if (item.arabic?.toLowerCase().includes(query)) return true;
            if (item.translations?.fr?.text?.toLowerCase().includes(query)) return true;
            if (item.translations?.en?.text?.toLowerCase().includes(query)) return true;
            if (item.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
            return false;
        });
    }, [allItems, searchQuery, viewMode]);

    const getBackText = () => {
        if (language === 'fr') return 'Retour';
        if (language === 'ar') return 'عودة';
        return 'Back';
    };

    const getSearchPlaceholder = () => {
        if (language === 'fr') return 'Rechercher une invocation...';
        if (language === 'ar') return 'ابحث عن ذكر...';
        return 'Search invocations...';
    };

    return (
        <div className={styles.library}>
            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} size={20} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Show global search results */}
            {searchQuery.trim() && viewMode !== 'items' && globalSearchResults.length > 0 && (
                <div className={styles.searchResults}>
                    <h3 className={styles.searchResultsTitle}>
                        {language === 'fr' ? 'Résultats' : (language === 'ar' ? 'النتائج' : 'Results')} ({globalSearchResults.length})
                    </h3>
                    <div className={styles.list}>
                        {globalSearchResults.map(item => (
                            <ContextCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Switcher - only show when not viewing items and no search */}
            {viewMode !== 'items' && !searchQuery.trim() && (
                <>
                    <div className={styles.tabSwitcher}>
                        <button
                            className={`${styles.tabButton} ${viewMode === 'categories' ? styles.active : ''}`}
                            onClick={() => setViewMode('categories')}
                        >
                            <Book size={18} />
                            <span>{language === 'fr' ? 'Duas' : (language === 'ar' ? 'أدعية' : 'Duas')}</span>
                        </button>
                        <button
                            className={`${styles.tabButton} ${viewMode === 'situations' ? styles.active : ''}`}
                            onClick={() => setViewMode('situations')}
                        >
                            <Compass size={18} />
                            <span>{language === 'fr' ? 'Situations' : (language === 'ar' ? 'مواقف' : 'Situations')}</span>
                        </button>
                    </div>

                    {/* Categories Grid (Duas) */}
                    {viewMode === 'categories' && (
                        <div className={styles.grid}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={styles.categoryCard}
                                    onClick={() => handleCategoryClick(cat)}
                                >
                                    <span className={styles.cardIcon}>{getCategoryIcon(cat)}</span>
                                    <span className={styles.categoryName}>{getTranslatedName(cat)}</span>
                                    <span className={styles.count}>{getDuasByCategory(cat).length} {t('duas')}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Topics Grid (Situations) */}
                    {viewMode === 'situations' && (
                        <div className={styles.grid}>
                            {topics.map(topic => (
                                <button
                                    key={topic}
                                    className={styles.categoryCard}
                                    onClick={() => handleTopicClick(topic)}
                                >
                                    <span className={styles.cardIcon}>{getSituationIcon(topic)}</span>
                                    <span className={styles.categoryName}>{getTranslatedName(topic)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Items View */}
            {viewMode === 'items' && (
                <div className={styles.results}>
                    <div className={styles.header}>
                        <button onClick={clearSelection} className={styles.backButton}>
                            <ArrowLeft size={18} />
                            {getBackText()}
                        </button>
                        <h2>{getTranslatedName(selectedItem || '')}</h2>
                    </div>

                    {/* Search within category */}
                    {searchQuery.trim() && (
                        <p className={styles.filterInfo}>
                            {language === 'fr' ? 'Filtré:' : (language === 'ar' ? 'مُصفّى:' : 'Filtered:')} {filteredItems.length} / {items.length}
                        </p>
                    )}

                    <div className={styles.list}>
                        {(searchQuery.trim() ? filteredItems : items).map(item => (
                            <ContextCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
            <OpenDuaAttribution />
        </div>
    );
}
