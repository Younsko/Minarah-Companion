'use client';
import { localState } from '@/lib/local-state';

// Types
export interface FavoriteItem {
    id: string;
    type: 'verse' | 'dua' | 'hadith' | 'invocation';
    title: string;
    arabicText?: string;
    translation?: string;
    source?: string;
    surahNumber?: number;
    ayahNumber?: number;
    addedAt: number;
    collectionId?: string;
    note?: string;
    originalId?: string; // Original ID from guide/invocation for lookup
}

export interface Collection {
    id: string;
    name: string;
    emoji: string;
    createdAt: number;
    isPinned: boolean;
}

const FAVORITES_KEY = 'minarah-favorites';
const COLLECTIONS_KEY = 'minarah-collections';

// Get all favorites
export function getFavorites(): FavoriteItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localState.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Add a favorite
export function addFavorite(item: Omit<FavoriteItem, 'id' | 'addedAt'>): FavoriteItem {
    const favorites = getFavorites();
    const newItem: FavoriteItem = {
        ...item,
        id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Date.now(),
    };
    favorites.unshift(newItem);
    localState.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('favorites-updated'));
    return newItem;
}

// Remove a favorite
export function removeFavorite(id: string): void {
    const favorites = getFavorites().filter(f => f.id !== id);
    localState.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('favorites-updated'));
}

// Check if item is favorited (by matching type + source identifiers)
export function isFavorited(type: FavoriteItem['type'], identifier: string): boolean {
    const favorites = getFavorites();
    return favorites.some(f => {
        if (f.type !== type) return false;
        if (type === 'verse' && f.surahNumber && f.ayahNumber) {
            return identifier === `${f.surahNumber}:${f.ayahNumber}`;
        }
        // Check exact ID match first
        if (f.originalId === identifier) return true;
        // Fallback
        return f.title === identifier || f.source === identifier;
    });
}

// Get favorite by identifier
export function getFavoriteByIdentifier(type: FavoriteItem['type'], identifier: string): FavoriteItem | undefined {
    const favorites = getFavorites();
    return favorites.find(f => {
        if (f.type !== type) return false;
        if (type === 'verse' && f.surahNumber && f.ayahNumber) {
            return identifier === `${f.surahNumber}:${f.ayahNumber}`;
        }
        if (f.originalId === identifier) return true;
        return f.title === identifier || f.source === identifier;
    });
}

// Update favorite note
export function updateFavoriteNote(id: string, note: string): void {
    const favorites = getFavorites();
    const index = favorites.findIndex(f => f.id === id);
    if (index !== -1) {
        favorites[index].note = note;
        localState.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('favorites-updated'));
    }
}

// Move favorite to collection
export function moveFavoriteToCollection(favoriteId: string, collectionId: string | undefined): void {
    const favorites = getFavorites();
    const index = favorites.findIndex(f => f.id === favoriteId);
    if (index !== -1) {
        favorites[index].collectionId = collectionId;
        localState.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('favorites-updated'));
    }
}

// ==================== COLLECTIONS ====================

// Get all collections
export function getCollections(): Collection[] {
    if (typeof window === 'undefined') return [];
    const stored = localState.getItem(COLLECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Create a collection
export function createCollection(name: string, emoji: string = '📁'): Collection {
    const collections = getCollections();
    const newCollection: Collection = {
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        emoji,
        createdAt: Date.now(),
        isPinned: false,
    };
    collections.push(newCollection);
    localState.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    window.dispatchEvent(new CustomEvent('collections-updated'));
    return newCollection;
}

// Delete a collection
export function deleteCollection(id: string): void {
    const collections = getCollections().filter(c => c.id !== id);
    localState.setItem(COLLECTIONS_KEY, JSON.stringify(collections));

    // Remove collection reference from favorites
    const favorites = getFavorites();
    const updatedFavorites = favorites.map(f =>
        f.collectionId === id ? { ...f, collectionId: undefined } : f
    );
    localState.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

    window.dispatchEvent(new CustomEvent('collections-updated'));
    window.dispatchEvent(new CustomEvent('favorites-updated'));
}

// Update collection
export function updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): void {
    const collections = getCollections();
    const index = collections.findIndex(c => c.id === id);
    if (index !== -1) {
        collections[index] = { ...collections[index], ...updates };
        localState.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
        window.dispatchEvent(new CustomEvent('collections-updated'));
    }
}

// Toggle pin collection
export function togglePinCollection(id: string): void {
    const collections = getCollections();
    const index = collections.findIndex(c => c.id === id);
    if (index !== -1) {
        collections[index].isPinned = !collections[index].isPinned;
        localState.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
        window.dispatchEvent(new CustomEvent('collections-updated'));
    }
}

// Get favorites in a collection
export function getFavoritesInCollection(collectionId: string | null): FavoriteItem[] {
    const favorites = getFavorites();
    if (collectionId === null) {
        return favorites.filter(f => !f.collectionId);
    }
    return favorites.filter(f => f.collectionId === collectionId);
}
