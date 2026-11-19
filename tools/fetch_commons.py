"""Collect openly licensed Sikh manuscript images from Wikimedia Commons (metadata + thumbnail URLs, not copies).

Writes docs/data/commons.json. Only files whose license is public domain, CC0, CC BY or CC BY-SA are kept; each record
keeps the file page, author/credit and license so the site can credit it. Images are shown from upload.wikimedia.org.
"""
import json, re, sys, time, urllib.request, urllib.parse, html
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "taksal-research/0.1 (https://github.com/sehajr-singhs/taksal)"}
CATS = ["Category:Hukamnamas", "Category:Manuscripts of the Guru Granth Sahib", "Category:Gurmukhi manuscripts",
        "Category:Manuscripts of the Dasam Granth", "Category:Janamsakhis", "Category:Sikh manuscripts",
        "Category:Mul Mantar", "Category:Nishan (Sikh)"]
OK = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? ?\d|cc-by)", re.I)

def api(p):
    for k in range(5):
        try:
            u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**p, "format": "json"})
            return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60))
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(20 * (k + 1)); continue
            raise
    return {}

def strip(s): return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()

seen, out = set(), []
for cat in CATS:
    r = api({"action": "query", "generator": "categorymembers", "gcmtitle": cat, "gcmtype": "file", "gcmlimit": 200,
             "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 600})
    pages = (r.get("query") or {}).get("pages", {})
    n0 = len(out)
    for p in pages.values():
        if p["title"] in seen or "imageinfo" not in p: continue
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        lic = strip(m.get("LicenseShortName", {}).get("value"))
        if not OK.search(lic) or not re.search(r"\.(jpe?g|png|tiff?)$", p["title"], re.I): continue
        seen.add(p["title"])
        out.append({"title": p["title"].replace("File:", ""), "category": cat.replace("Category:", ""),
                    "file_page": ii["descriptionurl"], "thumb": ii.get("thumburl"), "width": ii["width"], "height": ii["height"],
                    "license": lic, "author": strip(m.get("Artist", {}).get("value"))[:200],
                    "credit": strip(m.get("Credit", {}).get("value"))[:200],
                    "description": strip(m.get("ImageDescription", {}).get("value"))[:400],
                    "date": strip(m.get("DateTimeOriginal", {}).get("value"))[:60]})
    print(cat, len(out) - n0, flush=True)
    time.sleep(4)
(ROOT / "docs/data").mkdir(exist_ok=True)
(ROOT / "docs/data/commons.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
print("total", len(out))
