"""Download OCR text for the curated public-domain books from Internet Archive.

Writes tools/_work/text/<identifier>.txt and tools/_work/books.json (verified metadata per item).
Only items published before 1931 (US public domain by publication date) are fetched. Each item's
metadata is read from archive.org/metadata/<id>; the OCR file is the item's own *_djvu.txt.
"""
import json, sys, time, urllib.request, urllib.parse
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
W = Path(__file__).parent / "_work"; T = W / "text"; T.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "taksal-research/0.1 (public-domain corpus build)"}
PICK = [0,1,2,21,15,38,7,9,5,8,10,11,16,17,19,22,24,30,31,64,32,33,35,104,36,39,40,50,56,58,62,70,76,77,82,84,90,91,99,37,61]
MANUSCRIPTS = [6,108]

def get(url, binary=False, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                b = r.read(); return b if binary else json.loads(b)
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(3 * (k + 1))

cands = json.load(open(W / "ia_pick.json", encoding="utf-8"))
out = []
for i in PICK + MANUSCRIPTS:
    d = cands[i]; ident = d["identifier"]
    try:
        m = get(f"https://archive.org/metadata/{ident}")
        md = m.get("metadata", {})
        year = str(md.get("date") or md.get("year") or d.get("year"))[:4]
        files = [f["name"] for f in m.get("files", [])]
        txt = next((f for f in files if f.endswith("_djvu.txt")), None)
        rec = {"identifier": ident, "title": md.get("title") if isinstance(md.get("title"), str) else d.get("title"),
               "author": md.get("creator") if isinstance(md.get("creator"), str) else ", ".join(md.get("creator") or []),
               "year": year, "language": md.get("language"), "url": f"https://archive.org/details/{ident}",
               "kind": "manuscript scan" if i in MANUSCRIPTS else "book",
               "ia_rights": md.get("rights") or md.get("licenseurl") or md.get("possible-copyright-status") or "",
               "pages": int(md.get("imagecount") or 0), "ocr_file": txt}
        if i not in MANUSCRIPTS and txt and not (T / f"{ident}.txt").exists():
            b = get(f"https://archive.org/download/{ident}/{urllib.parse.quote(txt)}", binary=True)
            (T / f"{ident}.txt").write_bytes(b)
        rec["ocr_chars"] = (T / f"{ident}.txt").stat().st_size if (T / f"{ident}.txt").exists() else 0
        out.append(rec); print("ok", year, rec["ocr_chars"], ident, "|", str(rec["title"])[:60], flush=True)
    except Exception as e:
        print("FAIL", ident, e, flush=True)
    json.dump(out, open(W / "books.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("done", len(out))
