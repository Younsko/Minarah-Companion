export function getFrenchDuaTranslationLabel(source?: string) {
    if (source?.startsWith('IslamHouse')) return 'Traduction française · IslamHouse';
    if (source?.startsWith('QuranEnc')) return 'Versets français · QuranEnc';
    return 'Traduction française du sens · Minarah depuis OpenDua';
}
