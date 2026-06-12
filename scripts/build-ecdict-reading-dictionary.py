#!/usr/bin/env python3
"""Build the local ECDICT bundle used by the reader.

Input:
  python3 scripts/build-ecdict-reading-dictionary.py /path/to/ecdict.csv

The output intentionally keeps a focused subset instead of shipping the full
770k-row CSV to the browser. It includes all current passage vocabulary,
the previous bundled entries, and higher-confidence ECDICT rows marked by
Collins/Oxford/frequency/exam tags.
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTICLES_PATH = ROOT / "src" / "articles.js"
CURRENT_BUNDLE_PATH = ROOT / "assets" / "dictionaries" / "ecdict_reading.bundle.js"
OUTPUT_PATH = CURRENT_BUNDLE_PATH

EXAM_TAGS = {"ielts", "toefl", "cet6", "ky", "gre"}
MAX_BNC_RANK = 35000
MAX_FRQ_RANK = 35000


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: build-ecdict-reading-dictionary.py /path/to/ecdict.csv")

    csv_path = Path(sys.argv[1]).expanduser().resolve()
    if not csv_path.exists():
        raise SystemExit(f"ECDICT CSV not found: {csv_path}")

    article_words = load_article_terms()
    previous_words = load_previous_bundle_words()
    entries = select_entries(csv_path, article_words, previous_words)
    write_bundle(entries)
    print(
        json.dumps(
            {
                "entries": len(entries),
                "articleTerms": len(article_words),
                "previousWords": len(previous_words),
                "output": str(OUTPUT_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def load_article_terms() -> set[str]:
    text = ARTICLES_PATH.read_text(encoding="utf-8")
    payload = text.split("=", 1)[1].rsplit(";", 1)[0]
    articles = json.loads(payload)
    terms: set[str] = set()

    for article in articles:
        for paragraph in article["paragraphs"]:
            for sentence in paragraph:
                tokens = [
                    match.group(0).lower().strip("'")
                    for match in re.finditer(r"[A-Za-z]+(?:[-'][A-Za-z]+)*", sentence["text"])
                ]
                tokens = [token for token in tokens if token]
                for index, token in enumerate(tokens):
                    terms.add(token)
                    for size in range(2, 5):
                        phrase = " ".join(tokens[index : index + size])
                        if len(phrase.split()) == size:
                            terms.add(phrase)

    return terms


def load_previous_bundle_words() -> set[str]:
    if not CURRENT_BUNDLE_PATH.exists():
        return set()

    text = CURRENT_BUNDLE_PATH.read_text(encoding="utf-8")
    return {
        json.loads(f'"{match.group(1)}"')
        for match in re.finditer(r'\{"w":"((?:\\.|[^"\\])*)"', text)
    }


def select_entries(csv_path: Path, article_words: set[str], previous_words: set[str]) -> list[dict]:
    entries: list[dict] = []

    with csv_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            word = normalize_word(row.get("word", ""))
            translation = clean_translation(row.get("translation", ""))
            if not word or not translation:
                continue

            collins = to_int(row.get("collins", ""))
            oxford = to_int(row.get("oxford", ""))
            bnc = to_int(row.get("bnc", ""))
            frq = to_int(row.get("frq", ""))
            tags = set((row.get("tag") or "").lower().split())

            should_keep = (
                word in article_words
                or word in previous_words
                or collins > 0
                or oxford > 0
                or (0 < bnc <= MAX_BNC_RANK)
                or (0 < frq <= MAX_FRQ_RANK)
                or bool(tags & EXAM_TAGS)
            )
            if not should_keep:
                continue

            entry = {
                "w": word,
                "t": translation,
            }
            optional_fields = {
                "d": clean_plain_text(row.get("definition", "")),
                "p": clean_plain_text(row.get("phonetic", "")),
                "x": clean_plain_text(row.get("exchange", "")),
            }
            for key, value in optional_fields.items():
                if value:
                    entry[key] = value
            if collins:
                entry["c"] = collins
            if oxford:
                entry["o"] = oxford
            if bnc:
                entry["b"] = bnc
            if frq:
                entry["f"] = frq

            entries.append(entry)

    entries.sort(key=lambda item: item["w"])
    return entries


def clean_translation(value: str) -> str:
    lines = []
    for line in (value or "").splitlines():
        line = line.strip()
        if not line or line.startswith("[网络]"):
            continue
        line = re.sub(r"\[网络\].*$", "", line).strip()
        line = re.sub(r"\[(?:计|化|医|经|法|军|航|农|生物|物|数)\]\s*", "", line)
        if line:
            lines.append(line)

    return clean_plain_text(" ".join(lines))


def clean_plain_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def normalize_word(value: str) -> str:
    return value.lower().strip()


def to_int(value: str | None) -> int:
    try:
        return int(value or 0)
    except ValueError:
        return 0


def write_bundle(entries: list[dict]) -> None:
    source = {
        "name": "ECDICT",
        "url": "https://github.com/skywind3000/ECDICT",
        "license": "MIT",
        "derivedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "selection": (
            "Expanded IELTS reading dictionary: current passage vocabulary, "
            "previous local entries, Collins/Oxford marked entries, common BNC/FRQ entries, "
            "and IELTS/TOEFL/CET6/KY/GRE tagged entries"
        ),
    }
    payload = json.dumps(
        {"source": source, "entries": entries},
        ensure_ascii=False,
        separators=(",", ":"),
    )
    script = (
        "(function registerECDICTReadingDictionary(global){"
        '"use strict";'
        "var root=global||globalThis;"
        "var dictionaries=root.__LOCAL_DICTIONARIES__||{};"
        f"dictionaries.ecdict={payload};"
        "root.__LOCAL_DICTIONARIES__=dictionaries;"
        "})(typeof window!==\"undefined\"?window:globalThis);\n"
    )
    OUTPUT_PATH.write_text(script, encoding="utf-8")


if __name__ == "__main__":
    main()
