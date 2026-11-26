'use client';

import { useState } from 'react';
import styles from './ModeSwitcher.module.css';
import { Sun, Moon, Baby, User, Star, Lock } from 'lucide-react';
import { useRamadan } from '@/lib/ramadan-context';

interface ModeSwitcherProps {
    mode: 'adult' | 'kids';
    theme: 'pistachio' | 'dark';
    onModeChange: (mode: 'adult' | 'kids') => void;
    onThemeChange: (theme: 'pistachio' | 'dark') => void;
}

export default function ModeSwitcher({ mode, theme, onModeChange, onThemeChange }: ModeSwitcherProps) {
    const { isRamadanMode, toggleRamadanMode } = useRamadan();
    const [showPin, setShowPin] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleModeClick = (newMode: 'adult' | 'kids') => {
        if (mode === 'kids' && newMode === 'adult') {
            setShowPin(true);
        } else {
            onModeChange(newMode);
        }
    };

    const verifyPin = () => {
        if (pin === '1234') { // Simple PIN for demo
            onModeChange('adult');
            setShowPin(false);
            setPin('');
            setError('');
        } else {
            setError('Incorrect PIN');
            setPin('');
        }
    };

    return (
        <div className={styles.switcher}>
            {showPin && (
                <div className={styles.pinOverlay}>
                    <div className={styles.pinModal}>
                        <Lock size={32} className={styles.lockIcon} />
                        <h3>Parental Gate</h3>
                        <p>Enter PIN to exit Kids Mode</p>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                            className={styles.pinInput}
                        />
                        {error && <p className={styles.error}>{error}</p>}
                        <div className={styles.pinActions}>
                            <button onClick={() => setShowPin(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={verifyPin} className={styles.confirmBtn}>Unlock</button>
                        </div>
                    </div>
                </div>
            )}

            <button
                className={`${styles.btn} ${mode === 'adult' ? styles.active : ''}`}
                onClick={() => handleModeClick('adult')}
                title="Adult Mode"
            >
                <User size={18} />
            </button>

            <div className={styles.divider} />

            <button
                className={`${styles.btn} ${theme === 'pistachio' ? styles.active : ''}`}
                onClick={() => onThemeChange('pistachio')}
                title="Light Theme"
            >
                <Sun size={18} />
            </button>
            <button
                className={`${styles.btn} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => onThemeChange('dark')}
                title="Dark Theme"
            >
                <Moon size={18} />
            </button>
        </div>
    );
}
