# Minarah

Minarah is a local-first daily companion for Quran reading, duas, and configurable prayer times. The interface supports French, English, and Arabic/RTL, with a responsive pistachio and dark theme.

## Current scope

- Quran reader backed by the repository’s local surah files. Reading position, favorites, and preferences are stored in the browser.
- A gentle daily reading rhythm on the home screen: resume the last Quran position, choose a personal 5/10/15-minute intention, and mark reading moments in a local seven-day view. It is an optional self-check, not a streak or a measure of religious practice.
- Prayer times calculated on-device with [Adhan JS](https://github.com/batoulapps/adhan-js). Address search returns coordinates; the IANA time zone is then detected locally from those coordinates with an offline lookup dataset. Users can override it, choose the calculation method and Asr madhab, set custom Fajr/Isha angles, and apply minute adjustments.
- Optional Mawaqit iframe: a user supplies an official mosque widget link and explicitly consents before it loads. Local prayer calculations remain available independently.
- Browser-only settings and progress with versioned JSON export/import. Daily prayer and reading progress follow the selected location's calendar date.
- Content sources and licenses are collected in Settings → About and content sources instead of repeated on every dua page.
- Installable PWA with an offline cache for the local Quran files.
- No account, application database, Convex, analytics, or server-side user profile.

Tafsir and the unverified hadith-of-the-day mock are excluded. The dua library bundles 262 canonical OpenDua v0.0.4 records, including their Arabic text, English translations, transliterations, titles, category tags, and references. OpenDua's CC BY 4.0 licence covers its English translation, transliteration, editorial metadata, and dataset structure; it makes no ownership claim over the underlying religious text. French is available for all 262 records: 190 use attributed IslamHouse wording (including exact Arabic duplicates), eight Quranic passages use QuranEnc Noor International Center, and 64 are clearly labelled Minarah translations of OpenDua's English meaning. Those Minarah translations are aids to understanding, not scholarly editions. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md) for sources and terms.

Quran translations use the versioned QuranEnc Noor International Center editions (English 1.1.2 and French 1.0.0), kept verbatim with their footnotes.

## Development

```bash
npm install
npm run dev
```

The production build is `npm run build`; lint is `npm run lint`.

## Privacy

Prayer calculations and coordinate-to-time-zone lookup happen in the browser. Coordinates and location labels are written to the local Minarah store. Geolocation is requested only after the user presses the GPS button. Address queries are sent to Photon (Komoot) only after the user submits the search; selected coordinates are not sent to the prayer calculation or time-zone lookup. The optional Mawaqit widget is a third-party page and loads only after the user supplies a URL and checks its consent box; the URL must use an HTTPS `mawaqit.net` host.

The static site host still serves the application code and bundled content. It does not receive Minarah settings or progress as application data. Audio playback, when used, streams from its configured audio provider.

## Licensing

The source code is MIT licensed; see [LICENSE](LICENSE). That license does not cover bundled Quran translations, dua translations, audio, images, fonts, or other third-party content. Their separate rights and attributions are tracked in [CONTENT_LICENSES.md](CONTENT_LICENSES.md).
