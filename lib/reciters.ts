import { localState } from '@/lib/local-state';
// Shared reciters configuration for Quran audio playback
// Used by Settings and QuranBrowser components

export const RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
    { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
    { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly' },
    { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub' },
];

export function getDefaultReciter(): string {
    if (typeof window === 'undefined') return RECITERS[0].id;
    return localState.getItem('muslim-life-default-reciter') || RECITERS[0].id;
}

export function setDefaultReciter(reciterId: string): void {
    localState.setItem('muslim-life-default-reciter', reciterId);
}
