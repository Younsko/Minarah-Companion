'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RamadanContextType {
    isRamadanMode: boolean;
    toggleRamadanMode: () => void;
    hijriDate: string | null;
}

const RamadanContext = createContext<RamadanContextType | undefined>(undefined);

export function RamadanProvider({ children }: { children: ReactNode }) {
    const [isRamadanMode, setIsRamadanMode] = useState(false);
    const [hijriDate, setHijriDate] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        try {
            const hijri = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
            setHijriDate(hijri);
            const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric' }).formatToParts(today);
            if (parts.some(part => part.type === 'month' && part.value === '9')) setIsRamadanMode(true);
        } catch { setHijriDate(null); }
    }, []);

    const toggleRamadanMode = () => {
        setIsRamadanMode(prev => !prev);
    };

    return (
        <RamadanContext.Provider value={{ isRamadanMode, toggleRamadanMode, hijriDate }}>
            {children}
        </RamadanContext.Provider>
    );
}

export function useRamadan() {
    const context = useContext(RamadanContext);
    if (context === undefined) {
        throw new Error('useRamadan must be used within a RamadanProvider');
    }
    return context;
}
