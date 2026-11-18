"""Build Taksal's full-text search corpus from the public-domain books in tools/_work/books.json.

Output (all static, served by GitHub Pages):
  docs/corpus/books.json            one record per book: title, author, year, archive.org link, page count, exact pages or not
  docs/corpus/p/<book>/<chunk>.json page texts, 40 pages per chunk: [[leaf, printed_label, text], ...]
  docs/corpus/idx/<xx>.json         inverted index shard for words starting with xx: {word: "book:page,page;book:page"}

Exact pages come from Internet Archive's hOCR page index (searchtext + pageindex). Books without one are split into
~2,500-character parts and flagged approximate. Run tools/fetch_ia_books.py first.
"""
import gzip, json, re, sys, time, unicodedata, urllib.request, urllib.parse
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
W = ROOT / "tools" / "_work"
OUT = ROOT / "docs" / "corpus"
UA = {"User-Agent": "taksal-research/0.1 (public-domain corpus build)"}
CHUNK = 40
STOP = set("""the and that with for this from was were which have has had not but are his her their they them you your our
its into than then there these those been also when what who whom whose will would shall should could upon such only some
other more most very over under about after before being both each few many much same any all one two can may might must
out off own per she him its yet nor our ours why how where while whilst said did does doing done ever every""".split())


def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
                return r.read()
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def fold(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def words(text):
    return {w for w in re.findall(r"[a-z]{3,}", fold(text).lower()) if w not in STOP}


def pages_for(rec):
    ident = rec["identifier"]
    cache = W / "pages" / f"{ident}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8")), True
    meta = json.loads(get(f"https://archive.org/metadata/{ident}"))
    names = [f["name"] for f in meta.get("files", [])]
    pi = next((n for n in names if n.endswith("_hocr_pageindex.json.gz")), None)
    st = next((n for n in names if n.endswith("_hocr_searchtext.txt.gz")), None)
    pn = next((n for n in names if n.endswith("_page_numbers.json")), None)
    if not (pi and st):
        return None, False
    q = urllib.parse.quote
    text = gzip.decompress(get(f"https://archive.org/download/{ident}/{q(st)}")).decode("utf-8", "replace")
    index = json.loads(gzip.decompress(get(f"https://archive.org/download/{ident}/{q(pi)}")))
    labels = {}
    if pn:
        try:
            for p in json.loads(get(f"https://archive.org/download/{ident}/{q(pn)}")).get("pages", []):
                labels[int(p["leafNum"])] = str(p.get("pageNumber") or "")
        except Exception:
            pass
    pages = []
    for leaf, span in enumerate(index):
        t = re.sub(r"\s+", " ", text[span[0]:span[1]]).strip()
        if t:
            pages.append([leaf, labels.get(leaf + 1, ""), t])
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
    return pages, True


def approx_pages(rec):
    t = re.sub(r"\s+", " ", (W / "text" / f"{rec['identifier']}.txt").read_text(encoding="utf-8", errors="replace"))
    return [[None, f"part {i // 2500 + 1}", t[i:i + 2500]] for i in range(0, len(t), 2500)]


def main():
    books = [b for b in json.load(open(W / "books.json", encoding="utf-8")) if b["kind"] == "book"]
    OUT.mkdir(parents=True, exist_ok=True)
    for old in list((OUT / "p").glob("*/*.json")) + list((OUT / "idx").glob("*.json")):
        old.unlink()
    postings = defaultdict(lambda: defaultdict(list))
    manifest, total_pages = [], 0
    for bi, rec in enumerate(books):
        pages, exact = pages_for(rec)
        if not pages:
            pages, exact = approx_pages(rec), False
        d = OUT / "p" / str(bi)
        d.mkdir(parents=True, exist_ok=True)
        for c in range(0, len(pages), CHUNK):
            (d / f"{c // CHUNK}.json").write_text(json.dumps(pages[c:c + CHUNK], ensure_ascii=False), encoding="utf-8")
        for pi, (_, _, t) in enumerate(pages):
            for w in words(t):
                postings[w][bi].append(pi)
        total_pages += len(pages)
        manifest.append({"i": bi, "id": rec["identifier"], "title": rec["title"], "author": rec["author"],
                         "year": rec["year"], "url": rec["url"], "pages": len(pages), "exact": exact})
        print(f"{bi:2d} {'exact' if exact else 'approx'} {len(pages):5d} {rec['identifier']}", flush=True)
    shards = defaultdict(dict)
    for w, by in postings.items():
        shards[w[:2]][w] = ";".join(f"{b}:" + ",".join(map(str, ps)) for b, ps in by.items())
    (OUT / "idx").mkdir(exist_ok=True)
    for k, v in shards.items():
        (OUT / "idx" / f"{k}.json").write_text(json.dumps(v, separators=(",", ":")), encoding="utf-8")
    (OUT / "books.json").write_text(json.dumps({"books": manifest, "pages": total_pages, "words": len(postings),
                                                "chunk": CHUNK}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("books", len(manifest), "pages", total_pages, "words", len(postings), "shards", len(shards))


if __name__ == "__main__":
    main()
