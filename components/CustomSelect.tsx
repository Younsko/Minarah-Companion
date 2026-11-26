'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    id: string;
    name: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Select...' }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.selectedValue}>
                    {selectedOption?.name || placeholder}
                </span>
                <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={`${styles.option} ${option.id === value ? styles.optionSelected : ''}`}
                            onClick={() => handleSelect(option.id)}
                        >
                            <span>{option.name}</span>
                            {option.id === value && <Check size={16} className={styles.checkIcon} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
