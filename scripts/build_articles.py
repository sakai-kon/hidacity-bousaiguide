from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
OUTPUT = ARTICLES / "articles.json"

items = []
for path in sorted(ARTICLES.rglob("*.txt")):
    if path.name.startswith("_"):
        continue
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    title = path.stem
    if lines and re.match(r"^#\s+.+", lines[0]):
        title = re.sub(r"^#\s+", "", lines[0]).strip() or title
    body = "\n".join(lines[1:] if lines and re.match(r"^#\s+.+", lines[0]) else lines).strip()
    excerpt = re.sub(r"\s+", " ", body)[:120]
    items.append({
        "slug": path.stem,
        "file": path.relative_to(ARTICLES).as_posix(),
        "title": title,
        "excerpt": excerpt,
    })

OUTPUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Generated {OUTPUT} with {len(items)} article(s).")
