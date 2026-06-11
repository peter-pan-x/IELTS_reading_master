import json
import os
import re
from pathlib import Path

import pdfplumber


TARGET_FILE = Path(__file__).resolve().parents[1] / "src" / "synonyms.js"

BASIC_TERMS = {
    "a",
    "an",
    "about",
    "according to",
    "almost",
    "and",
    "are",
    "around",
    "as",
    "as a result",
    "because",
    "because of this",
    "bad",
    "be",
    "been",
    "being",
    "but",
    "by",
    "came",
    "come",
    "common",
    "customer",
    "did",
    "do",
    "does",
    "effect",
    "even",
    "for",
    "from",
    "get",
    "given that",
    "give",
    "go",
    "good",
    "got",
    "had",
    "hardly",
    "has",
    "have",
    "helpful",
    "hold",
    "if",
    "in",
    "is",
    "it",
    "key",
    "made",
    "make",
    "many",
    "more and more",
    "most",
    "nearly",
    "of",
    "only",
    "on",
    "or",
    "people",
    "persons",
    "roughly",
    "said",
    "say",
    "several",
    "so",
    "some",
    "slowly",
    "that",
    "the",
    "these",
    "they",
    "thing",
    "think",
    "though",
    "this",
    "those",
    "to",
    "very",
    "want",
    "was",
    "were",
    "whether",
    "with",
}

CATEGORY_RE = re.compile(r"^(形容词|动词|名词|短语|逻辑关系)[：:]?$")
NUMBERED_RE = re.compile(r"^\s*\d+[.、]?\s+")
RANK_RE = re.compile(r"^\d+$")
PART_OF_SPEECH_RE = re.compile(r"^(adj\.|adv\.|v\.|n\.|conj\.|pron\.)", re.I)


def clean(value):
    value = (value or "").replace("\u3000", " ").replace("…", "...")
    return re.sub(r"\s+", " ", value.replace("\n", " ")).strip()


def normalize_term(term):
    term = clean(term).lower()
    term = term.replace("’", "'").replace("／", "/")
    term = re.sub(r"\s*/\s*", "/", term)
    term = re.sub(r"\s+", " ", term)
    term = re.sub(r"^[^a-z]+|[^a-z]+$", "", term)
    return term


def display_term(term):
    term = clean(term)
    term = re.sub(r"^[=(（(\s]+|[=)）.\s]+$", "", term)
    term = re.sub(r"\s*/\s*", " / ", term)
    return term.strip()


def is_english_term(term):
    normalized = normalize_term(term)
    if not normalized or normalized in BASIC_TERMS:
        return False
    if len(normalized) < 4 and " " not in normalized:
        return False
    if re.search(r"[\u4e00-\u9fff]", term):
        return False
    return bool(re.match(r"^[a-z][a-z\s'./-]*[a-z]$", normalized))


def split_terms(value):
    value = (value or "").replace("\n", ",")
    value = clean(value)
    value = value.replace("understand know", "understand, know")
    value = value.replace("notwithstanding though", "notwithstanding, though")
    value = value.replace("baneful evil", "baneful, evil")
    value = value.replace("humane race", "human race")
    value = value.replace("demension", "dimension")
    value = value.replace("quiet a few", "quite a few")
    value = re.sub(r"\*.*$", "", value)
    value = value.replace("，", ",").replace("；", ",").replace(";", ",")
    value = value.replace("=", ",").replace("//", ",")
    parts = re.split(r",|\s+\|\s+", value)
    terms = []

    for part in parts:
        item = display_term(part)
        if not item:
            continue

        slash_items = [display_term(piece) for piece in item.split("/") if display_term(piece)]
        candidates = slash_items if len(slash_items) > 1 else [item]

        for candidate in candidates:
            if is_english_term(candidate):
                terms.append(candidate)

    return unique_terms(terms)


def unique_terms(terms):
    seen = set()
    result = []

    for term in terms:
        normalized = normalize_term(term)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(display_term(term))

    return result


def parse_part_of_speech(meaning):
    match = PART_OF_SPEECH_RE.match(clean(meaning))
    return match.group(1) if match else ""


def parse_meaning_zh(meaning):
    return PART_OF_SPEECH_RE.sub("", clean(meaning)).strip()


def make_group(terms, meaning_zh="", part_of_speech=""):
    filtered = unique_terms([term for term in terms if is_english_term(term)])
    if len(filtered) < 2:
        return None

    return {
        "headword": filtered[0],
        "partOfSpeech": part_of_speech,
        "meaningZh": clean(meaning_zh),
        "substitutions": filtered[1:],
    }


def extract_table_groups(path):
    groups = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table:
                    cells = [clean(cell) for cell in row or []]
                    rank_index = next((index for index, cell in enumerate(cells) if RANK_RE.match(cell)), None)
                    if rank_index is None or len(cells) < 3:
                        continue

                    tail = cells[-3:]
                    if len(tail) < 3:
                        continue

                    headword, meaning, substitutions = tail
                    if "*" in headword:
                        continue
                    headword = headword.strip()
                    if not is_english_term(headword):
                        continue

                    group = make_group(
                        [headword, *split_terms(substitutions)],
                        meaning_zh=parse_meaning_zh(meaning),
                        part_of_speech=parse_part_of_speech(meaning),
                    )
                    if group:
                        groups.append(group)

    return groups


def extract_numbered_lines(path):
    entries = []
    current = ""
    ignore_rest = False

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            for raw_line in text.splitlines():
                line = clean(raw_line)
                if not line:
                    continue
                if CATEGORY_RE.match(line):
                    if line.startswith("逻辑关系"):
                        ignore_rest = True
                    continue
                if ignore_rest:
                    continue
                if NUMBERED_RE.match(line):
                    if current:
                        entries.append(current)
                    current = line
                elif current:
                    current = f"{current} {line}"

    if current:
        entries.append(current)

    return entries


def parse_numbered_group(entry):
    entry = NUMBERED_RE.sub("", clean(entry), count=1)
    entry = re.sub(r"\bEg\..*$", "", entry).strip()

    replace_match = re.search(r"(.+?)\s*(?:替换|代)\s*\(?\s*([A-Za-z][A-Za-z\s,./'-]+?)\s*\)?(?:[。。，，].*)?$", entry)
    if replace_match:
        alternatives = split_terms(replace_match.group(1))
        bases = split_terms(replace_match.group(2))
        return make_group([*bases, *alternatives])

    if "：" in entry or ":" in entry:
        label, terms_value = re.split(r"[：:]", entry, maxsplit=1)
        if re.search(r"[\u4e00-\u9fff]", label):
            return make_group(split_terms(terms_value), meaning_zh=label)

    if "=" in entry and re.search(r"[\u4e00-\u9fff]", entry):
        _, terms_value = re.split(r"[：:]", entry, maxsplit=1) if re.search(r"[：:]", entry) else ("", entry)
        return make_group(split_terms(terms_value))

    return None


def extract_text_groups(path):
    groups = []
    for entry in extract_numbered_lines(path):
        group = parse_numbered_group(entry)
        if group:
            groups.append(group)
    return groups


def dedupe_groups(groups):
    seen_groups = set()
    used_terms = set()
    result = []

    for group in groups:
        terms = unique_terms([group["headword"], *group["substitutions"]])
        available_terms = []

        for term in terms:
            normalized = normalize_term(term)
            if normalized in used_terms:
                continue
            available_terms.append(term)

        if len(available_terms) < 2:
            continue

        signature = tuple(sorted(normalize_term(term) for term in available_terms))
        if signature in seen_groups:
            continue

        seen_groups.add(signature)
        used_terms.update(normalize_term(term) for term in available_terms)
        result.append(
            {
                "id": f"syn-{len(result) + 1:03d}",
                "rank": len(result) + 1,
                "headword": available_terms[0],
                "partOfSpeech": group.get("partOfSpeech", ""),
                "meaningZh": group.get("meaningZh", ""),
                "substitutions": available_terms[1:],
                "difficulty": "exam-synonym",
                "tags": ["exam-synonym"],
            }
        )

    return result


def read_source_paths():
    raw = os.environ.get("SYNONYM_SOURCE_PDFS", "")
    paths = [Path(item).expanduser() for item in raw.split(os.pathsep) if item.strip()]
    if not paths:
        raise SystemExit("Set SYNONYM_SOURCE_PDFS to one or more local PDF paths.")

    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        raise SystemExit(f"Missing PDF paths: {missing}")

    return paths


def main():
    groups = []
    for path in read_source_paths():
        groups.extend(extract_table_groups(path))
        groups.extend(extract_text_groups(path))

    rows = dedupe_groups(groups)
    content = (
        "// Generated by scripts/import-synonym-library.py from local synonym source files.\n"
        "// Do not edit this file by hand when refreshing the imported synonym set.\n\n"
        f"export const synonymLibrary = {json.dumps(rows, ensure_ascii=False, indent=2)};\n"
    )
    TARGET_FILE.write_text(content, encoding="utf-8")
    print(json.dumps({"entries": len(rows), "target": str(TARGET_FILE)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
