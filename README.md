# Minarah

Minarah is a local-first daily companion for Quran reading, duas, and configurable prayer times. The interface supports French, English, and Arabic/RTL, with a responsive pistachio and dark theme.

## Current scope

- Quran reader backed by the repository’s local surah files. Reading position, favorites, and preferences are stored in the browser.
- Prayer times calculated on-device with [Adhan JS](https://github.com/batoulapps/adhan-js). The user chooses the calculation method, Fajr/Isha angles when using custom angles, Asr madhab, location, IANA time zone, and minute adjustments.
- Optional Mawaqit iframe: a user supplies an official mosque widget link and explicitly consents before it loads. Local prayer calculations remain available independently.
- Browser-only settings and progress with versioned JSON export/import.
- Installable PWA with an offline cache for the local Quran files.
- No account, application database, Convex, analytics, or server-side user profile.

Tafsir, hadith cards, and the previous dua corpus are excluded. The dua library now bundles OpenDua v0.0.4: its English translations, transliterations, titles, category tags, and references are included under CC BY 4.0. Arabic supplication text is excluded because its underlying-text rights are not granted by OpenDua. In French and Arabic interface modes, the English translation is clearly labelled. Quran translations use the versioned QuranEnc Noor International Center editions (English 1.1.2 and French 1.0.0), kept verbatim with their footnotes. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md) for the sources and terms.

## Development

```bash
npm install
npm run dev
```

The production build is `npm run build`; lint is `npm run lint`.

## Privacy

Prayer calculations happen in the browser. Coordinates and location labels are written to the local Minarah store. Geolocation is requested only after the user presses the GPS button. They are not sent to a calculation service. The optional Mawaqit widget is a third-party page and loads only after the user supplies a URL and checks its consent box; the URL must use an HTTPS `mawaqit.net` host.

The static site host still serves the application code and bundled content. It does not receive Minarah settings or progress as application data. Audio playback, when used, streams from its configured audio provider.

## Licensing

The source code is MIT licensed; see [LICENSE](LICENSE). That license does not cover bundled Quran translations, dua translations, audio, images, fonts, or other third-party content. Their separate rights and attributions are tracked in [CONTENT_LICENSES.md](CONTENT_LICENSES.md).
