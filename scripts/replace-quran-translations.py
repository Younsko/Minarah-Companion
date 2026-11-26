"""Replace unverified bundled translations with the selected QuranEnc editions.

Usage:
  python scripts/replace-quran-translations.py <english_saheeh.sqlite> <french_montada.sqlite>

The SQLite archives are downloaded from QuranEnc and are not committed. Translation
strings and footnotes are copied verbatim; only the surrounding AlQuranCloud-shaped
JSON records are retained for compatibility with the reader.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SURAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
    73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
    45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12,
    30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36,
    25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11,
    8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]


def load_translation(path: Path) -> dict[tuple[int, int], tuple[str, str | None]]:
    connection = sqlite3.connect(path)
    try:
        rows = connection.execute(
            "SELECT sura, aya, translation, footnotes FROM translations ORDER BY sura, aya"
        ).fetchall()
    finally:
        connection.close()

    records: dict[tuple[int, int], tuple[str, str | None]] = {}
    for surah, ayah, text, footnotes in rows:
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"Empty translation at {surah}:{ayah} in {path.name}")
        key = (int(surah), int(ayah))
        if key in records:
            raise ValueError(f"Duplicate verse {surah}:{ayah} in {path.name}")
        records[key] = (text, footnotes if isinstance(footnotes, str) and footnotes else None)

    expected = {(s, a) for s, count in enumerate(SURAH_COUNTS, start=1) for a in range(1, count + 1)}
    if records.keys() != expected:
        missing = sorted(expected - records.keys())[:5]
        extra = sorted(records.keys() - expected)[:5]
        raise ValueError(f"Verse index mismatch in {path.name}; missing={missing}, extra={extra}")
    return records


def update_edition(
    editions: list[dict[str, Any]],
    language: str,
    identifier: str,
    display_name: str,
    version: str,
    records: dict[tuple[int, int], tuple[str, str | None]],
) -> None:
    edition = {
        "identifier": identifier,
        "language": language,
        "name": display_name,
        "englishName": display_name,
        "format": "text",
        "type": "translation",
        "direction": "ltr",
        "source": "QuranEnc",
        "publisher": "Noor International Center",
        "version": version,
        "sourceUrl": "https://quranenc.com/en/home/api",
    }
    for surah in editions:
        number = surah["number"]
        surah["edition"] = edition.copy()
        for ayah in surah["ayahs"]:
            text, footnotes = records[(number, ayah["numberInSurah"])]
            ayah["text"] = text
            ayah["footnotes"] = footnotes


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    english = load_translation(Path(sys.argv[1]))
    french = load_translation(Path(sys.argv[2]))

    for number, expected_count in enumerate(SURAH_COUNTS, start=1):
        path = ROOT / "public" / "data" / "quran" / f"surah-{number}.json"
        editions = json.loads(path.read_text(encoding="utf-8-sig"))
        if len(editions) != 4 or len(editions[0]["ayahs"]) != expected_count:
            raise ValueError(f"Unexpected existing Quran data shape in {path.name}")
        update_edition(editions[1:2], "en", "english_saheeh", "English Translation - Noor International Center", "1.1.2", english)
        update_edition(editions[2:3], "fr", "french_montada", "French translation - Noor International Center", "1.0.0", french)
        path.write_text(json.dumps(editions, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
