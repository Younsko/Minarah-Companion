'use client';

import { useState } from 'react';
import styles from './ContextWizard.module.css';
import { MapPin, Activity, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { getContextualContent, ContextItem } from '@/lib/context-engine';
import ContextCard from './adult/ContextCard';

type Step = 'location' | 'activity' | 'need' | 'results';

export default function ContextWizard() {
    const [step, setStep] = useState<Step>('location');
    const [selections, setSelections] = useState({
        location: '',
        activity: '',
        need: ''
    });
    const [results, setResults] = useState<ContextItem[]>([]);

    const handleSelect = (key: keyof typeof selections, value: string) => {
        setSelections(prev => ({ ...prev, [key]: value }));

        if (key === 'location') setStep('activity');
        if (key === 'activity') setStep('need');
        if (key === 'need') {
            // Fetch results
            const query = `${selections.location} ${selections.activity} ${value}`;
            const items = getContextualContent({ situation: query });
            setResults(items);
            setStep('results');
        }
    };

    const reset = () => {
        setStep('location');
        setSelections({ location: '', activity: '', need: '' });
        setResults([]);
    };

    return (
        <div className={styles.wizard}>
            {step !== 'results' && (
                <div className={styles.progressBar}>
                    <div className={`${styles.step} ${step === 'location' ? styles.active : ''}`}>1</div>
                    <div className={styles.line} />
                    <div className={`${styles.step} ${step === 'activity' ? styles.active : ''}`}>2</div>
                    <div className={styles.line} />
                    <div className={`${styles.step} ${step === 'need' ? styles.active : ''}`}>3</div>
                </div>
            )}

            <div className={styles.content}>
                {step === 'location' && (
                    <div className={styles.stepContent}>
                        <h2>Where are you?</h2>
                        <div className={styles.options}>
                            <button onClick={() => handleSelect('location', 'home')}>🏠 Home</button>
                            <button onClick={() => handleSelect('location', 'masjid')}>🕌 Masjid</button>
                            <button onClick={() => handleSelect('location', 'travel')}>✈️ Traveling</button>
                            <button onClick={() => handleSelect('location', 'nature')}>🌳 Outside</button>
                        </div>
                    </div>
                )}

                {step === 'activity' && (
                    <div className={styles.stepContent}>
                        <h2>What are you doing?</h2>
                        <div className={styles.options}>
                            <button onClick={() => handleSelect('activity', 'praying')}>🤲 Praying</button>
                            <button onClick={() => handleSelect('activity', 'eating')}>🍽️ Eating</button>
                            <button onClick={() => handleSelect('activity', 'sleeping')}>😴 Sleeping</button>
                            <button onClick={() => handleSelect('activity', 'working')}>💼 Working</button>
                        </div>
                    </div>
                )}

                {step === 'need' && (
                    <div className={styles.stepContent}>
                        <h2>What do you need?</h2>
                        <div className={styles.options}>
                            <button onClick={() => handleSelect('need', 'dua')}>Dua (Supplication)</button>
                            <button onClick={() => handleSelect('need', 'dhikr')}>Dhikr (Remembrance)</button>
                            <button onClick={() => handleSelect('need', 'etiquette')}>Etiquette (Adab)</button>
                        </div>
                    </div>
                )}

                {step === 'results' && (
                    <div className={styles.results}>
                        <div className={styles.resultsHeader}>
                            <h2>Here is what you should say:</h2>
                            <button onClick={reset} className={styles.resetButton}>Start Over</button>
                        </div>

                        {results.length > 0 ? (
                            results.map(item => <ContextCard key={item.id} item={item} />)
                        ) : (
                            <div className={styles.empty}>
                                <p>No specific matches found for this combination yet.</p>
                                <button onClick={reset}>Try different options</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
