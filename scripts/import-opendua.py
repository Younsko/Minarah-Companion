"""Filter an OpenDua v0.0.4 catalogue for Minarah, keeping religious source text distinct.

Usage: python scripts/import-opendua.py <catalogue.json>

The generated file includes OpenDua's licensed English translation,
transliteration, editorial title, tags and source references. It also includes
the source Arabic recitations attributed to Hisn al-Muslim / Quran and Sunnah;
OpenDua expressly does not claim rights over those underlying religious texts.
French translations are read from separately attributed source mappings. The
IslamHouse strings are copied verbatim; the QuranEnc passages are copied with
their footnotes; Minarah translations are clearly labelled adaptations of the
OpenDua English text.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
VERSION = "0.0.4"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    if source.get("dataVersion") != VERSION:
        raise ValueError(f"Expected OpenDua v{VERSION}, got {source.get('dataVersion')}")

    chapter_titles = {chapter["id"]: chapter["title"] for chapter in source["chapters"]}
    tag_titles = {tag["id"]: tag["title"] for tag in source["tags"]}
    french_source_path = ROOT / "public" / "data" / "islamhouse-fr-translations.json"
    french_source = json.loads(french_source_path.read_text(encoding="utf-8"))
    french_translations = french_source["translations"]
    minarah_source = json.loads((ROOT / "public" / "data" / "minarah-fr-translations.json").read_text(encoding="utf-8"))
    minarah_translations = minarah_source["translations"]
    quran_passages = {
        "dua-000004": [(3, 190, 200)],
        "dua-000076": [(112, 1, 4), (113, 1, 5), (114, 1, 6)],
        "dua-000077": [(2, 255, 255)],
        "dua-000081": [(2, 255, 255)],
        "dua-000082": [(112, 1, 4), (113, 1, 5), (114, 1, 6)],
        "dua-000111": [(112, 1, 4), (113, 1, 5), (114, 1, 6)],
        "dua-000112": [(2, 255, 255)],
        "dua-000113": [(2, 285, 286)],
    }

    def quranenc_translation(identifier: str) -> str:
        passages = quran_passages[identifier]
        parts: list[str] = []
        for surah_number, first_ayah, last_ayah in passages:
            surah_path = ROOT / "public" / "data" / "quran" / f"surah-{surah_number}.json"
            editions = json.loads(surah_path.read_text(encoding="utf-8"))
            edition = next(item for item in editions if item["edition"]["identifier"] == "french_montada")
            verses = edition["ayahs"][first_ayah - 1:last_ayah]
            for verse in verses:
                text = verse["text"]
                text = __import__("re").sub(r"^\s*\d+\.\s*", "", text)
                if verse.get("footnotes"):
                    text = f"{text} {verse['footnotes']}"
                parts.append(text)
        return " ".join(parts)
    contexts: dict[str, dict[str, Any]] = {}

    for entry in source["entries"]:
        steps = list(entry.get("steps", []))
        for variation in entry.get("variations", []):
            steps.extend(variation.get("steps", []))
        for step in steps:
            for item in step.get("items", []):
                dua = item.get("dua")
                if not isinstance(dua, dict) or not dua.get("id"):
                    continue
                contexts.setdefault(dua["id"], {
                    "title": entry.get("title") or chapter_titles.get(entry.get("chapterId"), "Dua"),
                    "chapter": chapter_titles.get(entry.get("chapterId")),
                    "tags": [tag for tag in entry.get("tags", []) if tag in tag_titles],
                    "sourceReference": entry.get("sourceReference"),
                    "references": list(entry.get("references", [])) + list(dua.get("references", [])),
                })

    records = []
    seen: set[str] = set()
    for dua in source["duas"]:
        identifier = dua["id"]
        if identifier in seen:
            raise ValueError(f"Duplicate OpenDua record {identifier}")
        seen.add(identifier)
        context = contexts.get(identifier, {})
        translation = dua.get("translation")
        transliteration = dua.get("transliteration")
        arabic = dua.get("arabic")
        if not isinstance(translation, str) or not translation.strip():
            raise ValueError(f"Missing English translation for {identifier}")
        if not isinstance(transliteration, str) or not transliteration.strip():
            raise ValueError(f"Missing transliteration for {identifier}")
        if not isinstance(arabic, str) or not arabic.strip():
            raise ValueError(f"Missing source Arabic for {identifier}")
        record = {
            "id": identifier,
            "title": context.get("title") or "Remembrance",
            "chapter": context.get("chapter") or "Dhikr and praise",
            "arabic": arabic,
            "translation": translation,
            "transliteration": transliteration,
            "translationLanguage": "en",
            "tags": context.get("tags") or ["dhikr-and-praise"],
            "sourceReference": context.get("sourceReference"),
            "references": context.get("references", []),
        }
        french_translation = french_translations.get(identifier)
        if not french_translation and identifier in quran_passages:
            french_translation = {
                "text": quranenc_translation(identifier),
                "source": "QuranEnc · Noor International Center, édition française v1.0.0 · versets reproduits avec leurs notes",
            }
            if identifier == "dua-000081":
                french_translation["text"] = "Je cherche refuge auprès d’Allah contre Satan le maudit. " + french_translation["text"]
                french_translation["source"] += "; formule initiale traduite par Minarah depuis OpenDua EN v0.0.4"
        if not french_translation and identifier in minarah_translations:
            french_translation = {
                "text": minarah_translations[identifier],
                "source": minarah_source["source"],
                "notice": minarah_source["notice"],
            }
        if french_translation:
            record["translations"] = {"fr": french_translation}
        records.append(record)

    # Some entries repeat an invocation already translated verbatim by IslamHouse.
    # Reuse only exact Arabic matches, preserving the source label of the text.
    french_by_arabic: dict[str, dict[str, str]] = {}
    for record in records:
        normalized_arabic = " ".join(record["arabic"].split())
        french = record.get("translations", {}).get("fr")
        if french:
            french_by_arabic.setdefault(normalized_arabic, french)
    for record in records:
        if record.get("translations", {}).get("fr"):
            continue
        normalized_arabic = " ".join(record["arabic"].split())
        if normalized_arabic in french_by_arabic:
            record["translations"] = {"fr": french_by_arabic[normalized_arabic]}

    if len(records) != 262:
        raise ValueError(f"Expected 262 licensed OpenDua canonical duas, got {len(records)}")

    output = {
        "dataset": "OpenDua",
        "version": VERSION,
        "language": "en",
        "licence": "CC-BY-4.0",
        "licenceUrl": "https://opendua.org/licence/data",
        "collection": "Hisn al-Muslim",
        "attribution": (
            "OpenDua dataset v0.0.4 (https://opendua.org), by Ihsan Labs at the Human "
            "Development Fund. Based on Hisn al-Muslim by Sa'id ibn Ali ibn Wahf al-Qahtani. "
            "OpenDua editorial text, dataset structure and the recitation by Muhammad Jumah "
            "are licensed CC BY 4.0. OpenDua makes no ownership claim over the underlying religious texts."
        ),
        "frenchTranslationSource": {
            key: french_source[key]
            for key in ("source", "terms", "edition", "redistribution")
        },
        "duas": records,
    }
    target = ROOT / "public" / "data" / "opendua-v0.0.4.json"
    target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    french_count = sum(bool(record.get("translations", {}).get("fr", {}).get("text")) for record in records)
    if french_count != 262:
        missing_ids = [record["id"] for record in records if not record.get("translations", {}).get("fr", {}).get("text")]
        raise ValueError(f"Expected French translations for all 262 records; missing {missing_ids}")
    print(f"Wrote {len(records)} Arabic, transliteration and English records; French translations cover all {french_count}.")


if __name__ == "__main__":
    main()
