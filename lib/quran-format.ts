/** Remove verse numbering and inline reference markers from a translation string. */
export function cleanVerseTranslation(translation: string): string {
  return translation
    .replace(/^\s*(?:\(\d+\)|\[\d+\]|\d+\.)\s*/, '')
    .replace(/\[\d+\]/g, '')
    .trim();
}
