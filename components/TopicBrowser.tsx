'use client';

import { useState } from 'react';
import styles from './TopicBrowser.module.css';
import { getAllTopics, getContextualContent, ContextItem, CATEGORY_TRANSLATIONS } from '@/lib/context-engine';
import ContextCard from './adult/ContextCard';
import { useI18n } from '@/lib/i18n-context';

export default function TopicBrowser() {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [results, setResults] = useState<ContextItem[]>([]);
    const topics = getAllTopics();
    const { language } = useI18n();

    const getTranslatedTopic = (topic: string) => {
        if (language === 'en') return topic.charAt(0).toUpperCase() + topic.slice(1);
        if (language === 'fr' && CATEGORY_TRANSLATIONS[topic]?.fr) return CATEGORY_TRANSLATIONS[topic].fr;
        if (language === 'ar' && CATEGORY_TRANSLATIONS[topic]?.ar) return CATEGORY_TRANSLATIONS[topic].ar;
        return topic.charAt(0).toUpperCase() + topic.slice(1);
    };

    const handleTopicClick = (topic: string) => {
        setSelectedTopic(topic);
        const items = getContextualContent({ situation: topic });
        setResults(items);
    };

    const clearSelection = () => {
        setSelectedTopic(null);
        setResults([]);
    };

    return (
        <div className={styles.browser}>
            {!selectedTopic ? (
                <div className={styles.grid}>
                    {topics.map(topic => (
                        <button
                            key={topic}
                            className={styles.topicCard}
                            onClick={() => handleTopicClick(topic)}
                        >
                            {getTranslatedTopic(topic)}
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.results}>
                    <div className={styles.header}>
                        <h2>{getTranslatedTopic(selectedTopic)}</h2>
                        <button onClick={clearSelection} className={styles.backButton}>Back to Topics</button>
                    </div>

                    <div className={styles.resultsList}>
                        {results.map(item => (
                            <ContextCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
