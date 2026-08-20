from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
ARTICLES_INDEX = ARTICLES / "articles.json"
SEARCH_DIR = ROOT / "search"
SEARCH_INDEX = SEARCH_DIR / "site-search.json"

STATIC_SEARCH_ITEMS = [
    {
        "title": "避難場所・ハザードマップ",
        "description": "飛騨市の土砂災害警戒区域などを地図で確認します。",
        "url": "/hidacity-bousaiguide/hazard/",
        "type": "hazard",
        "typeLabel": "ハザードマップ",
        "keywords": ["ハザードマップ", "土砂災害", "警戒区域", "特別警戒区域", "避難", "危険区域"],
    },
    {
        "title": "持ち物チェックリスト",
        "description": "非常時に備えて必要な持ち物をチェックできます。",
        "url": "/hidacity-bousaiguide/bag/",
        "type": "bag",
        "typeLabel": "持ち物",
        "keywords": ["持ち物", "非常持ち出し袋", "備え", "チェックリスト"],
    },
    {
        "title": "防災知識",
        "description": "災害が起きたときの行動や防災について学べます。",
        "url": "/hidacity-bousaiguide/knowledge/",
        "type": "knowledge",
        "typeLabel": "防災知識",
        "keywords": ["防災", "知識", "避難", "地震", "洪水", "土砂災害", "雪災害"],
    },
    {
        "title": "防災クイズ",
        "description": "クイズで防災知識を確認できます。",
        "url": "/hidacity-bousaiguide/quiz/",
        "type": "quiz",
        "typeLabel": "防災クイズ",
        "keywords": ["クイズ", "防災", "知識", "避難"],
    },
    {
        "title": "防災記事",
        "description": "防災について調べたことを記事として読めます。",
        "url": "/hidacity-bousaiguide/articles/",
        "type": "articles",
        "typeLabel": "防災記事",
        "keywords": ["記事", "読み物", "防災"],
    },
]

META_KEYS = {"title", "category", "date", "description", "keywords"}


def parse_front_matter(lines: list[str]) -> tuple[dict[str, str], int]:
    if not lines or lines[0].strip() != "---":
        return {}, 0
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, 0
    meta: dict[str, str] = {}
    for line in lines[1:end]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        if key in META_KEYS:
            meta[key] = value.strip()
    return meta, end + 1


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).strip()
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[\\/]+", "-", value)
    return value or "article"


def extract_title(body_lines: list[str], fallback: str) -> tuple[str, int]:
    if body_lines and re.match(r"^#\s+.+", body_lines[0]):
        return re.sub(r"^#\s+", "", body_lines[0]).strip() or fallback, 1
    return fallback, 0


def parse_date(raw: str) -> str:
    if not raw:
        return ""
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date().isoformat()
    except ValueError:
        return ""


def parse_article(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    meta, start = parse_front_matter(lines)
    body_lines = lines[start:]
    fallback = path.stem
    title_from_body, title_index = extract_title(body_lines, fallback)
    title = meta.get("title") or title_from_body
    content_lines = body_lines[title_index:] if title_index else body_lines
    body = "\n".join(content_lines).strip()
    clean = re.sub(r"(^|\n)#{1,6}\s*", " ", body)
    clean = re.sub(r"(^|\n)\s*[-*]\s+", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    description = meta.get("description") or clean[:150]
    keywords = [x.strip() for x in meta.get("keywords", "").split(",") if x.strip()]
    category = meta.get("category") or "防災"
    published = parse_date(meta.get("date", ""))
    chars = len(re.sub(r"\s", "", clean))
    reading_minutes = max(1, round(chars / 500))
    slug = slugify(path.stem)
    return {
        "slug": slug,
        "file": path.relative_to(ARTICLES).as_posix(),
        "title": title,
        "excerpt": description,
        "description": description,
        "category": category,
        "date": published,
        "keywords": keywords,
        "readingMinutes": reading_minutes,
        "searchText": clean[:4000],
    }


def build() -> None:
    articles = []
    for path in sorted(ARTICLES.rglob("*.txt")):
        if path.name.startswith("_"):
            continue
        articles.append(parse_article(path))

    articles.sort(key=lambda item: (item["date"] or "0000-00-00", item["title"]), reverse=True)
    ARTICLES_INDEX.write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    search_items = []
    for item in STATIC_SEARCH_ITEMS:
        search_items.append(item)
    for item in articles:
        search_items.append({
            "title": item["title"],
            "description": item["description"],
            "url": f"/hidacity-bousaiguide/articles/view.html?slug={item['slug']}",
            "type": "article",
            "typeLabel": "防災記事",
            "category": item["category"],
            "date": item["date"],
            "keywords": item["keywords"],
            "searchText": item["searchText"],
        })
    SEARCH_DIR.mkdir(parents=True, exist_ok=True)
    SEARCH_INDEX.write_text(json.dumps(search_items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {ARTICLES_INDEX} with {len(articles)} article(s).")
    print(f"Generated {SEARCH_INDEX} with {len(search_items)} searchable item(s).")


if __name__ == "__main__":
    build()
