"""Generate every Taksal page from one template so header, nav and footer can't drift apart.

    python tools/build_site.py      -> docs/*.html

Look: copied from sehajr-singhs.github.io (mono body, serif name, one 760px column, thin rules). The coin is ASCII art
made from a real Ranjit Singh rupee (tools/coin_ascii.py). Reader pages reuse the BaniDB reader from v1
(tools/site/partials/reader-*.html + docs/assets/reader.js). No em dashes in any copy.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "docs"
COIN = html.escape((D / "assets/coin-ascii.txt").read_text(encoding="utf-8").rstrip("\n"))
P = ROOT / "tools/site/partials"

NAV = [("search.html", "Search"), ("hukamnama.html", "Hukamnama"), ("guru-granth-sahib.html", "Guru Granth Sahib"),
       ("dasam-granth.html", "Dasam Granth"), ("vaaran.html", "Vaaran"), ("library.html", "Library"),
       ("pothis.html", "Pothis"), ("model.html", "Taksal (the model)"), ("about.html", "About")]

ICONS = {
    "Instagram": '<rect x="2.5" y="2.5" width="13" height="13" rx="4"/><circle cx="9" cy="9" r="3.1"/>',
    "X": '<path d="M3.5 3.5l11 11M14.5 3.5l-11 11"/>',
    "Facebook": '<path d="M11 15.5V9.5h2l.3-2.2H11V5.9c0-.6.2-1 1.1-1h1.2V2.9c-.2 0-.9-.1-1.7-.1-1.7 0-2.9 1-2.9 2.9v1.6H6.8v2.2h1.9v6"/>',
    "YouTube": '<rect x="1.8" y="4.2" width="14.4" height="9.6" rx="2.4"/><path d="M7.7 6.9l3.9 2.1-3.9 2.1z"/>',
}
SOCIAL = {"Instagram": "https://instagram.com", "X": "https://x.com", "Facebook": "https://facebook.com",
          "YouTube": "https://youtube.com"}  # TODO: real Taksal accounts once they exist

SOURCES_USED = "BaniDB (Khalis Foundation), Internet Archive, Wikimedia Commons"


def page(name, title, path, body, scripts=(), home=False, desc=""):
    nav = "".join(f'<a href="{h}"{" class=\"active\"" if h == name else ""}>{t}</a>' for h, t in NAV)
    socials = "".join(
        f'<a href="{SOCIAL[k]}" aria-label="Taksal on {k}" title="{k}"><svg viewBox="0 0 18 18" width="14" height="14" '
        f'fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">{v}</svg></a>'
        for k, v in ICONS.items())
    crumbs = '<a href="index.html">Home</a>' + "".join(f" / {c}" for c in path)
    if home:
        head = f'''<header class="site">
  <div>
    <a class="brand" href="index.html">Taksal</a>
    <p class="brand-sub" lang="pa">ਟਕਸਾਲ <span>(ṭaksāl)</span></p>
    <p class="brand-line" lang="pa-Guru">ਘੜੀਐ ਸਬਦੁ ਸਚੀ ਟਕਸਾਲ ॥</p>
    <p class="brand-tr">In this true mint, the Word of the Shabad is forged.</p>
    <p class="brand-ref">Japji Sahib, Pauri 38</p>
  </div>
  <pre class="coin" role="img" aria-label="Taksal's mark: a rupee of Maharaja Ranjit Singh, Lahore mint, 1825 to 1826, drawn in characters">{COIN}</pre>
</header>'''
    else:
        head = f'''<header class="site compact">
  <div><a class="brand" href="index.html">Taksal</a><p class="brand-sub" lang="pa">ਟਕਸਾਲ <span>(ṭaksāl)</span></p></div>
  <pre class="coin small" role="img" aria-label="Taksal's mark, a Ranjit Singh rupee">{COIN}</pre>
</header>'''
    js = "".join(f'<script src="{s}" defer></script>' for s in ("assets/taksal.js",) + tuple(scripts))
    doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{html.escape(desc or title)}">
<meta name="theme-color" content="#ebe8e1">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/taksal.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<div class="topbar">
  <div class="left"><span class="hist"><button type="button" data-hist="back" aria-label="Back">←</button><button type="button" data-hist="forward" aria-label="Forward">→</button></span><span class="path">{crumbs}</span></div>
  <div class="right"><span class="socials" style="display:flex;gap:10px">{socials}</span><a href="signin.html">Sign in</a></div>
</div>
{head}
<nav class="main" aria-label="Sections">{nav}</nav>
<main id="main">
{body}
</main>
<footer class="site">
  <div><a class="reach" href="mailto:sehajrsinghs@gmail.com?subject=Taksal">Reach out to the team</a></div>
  <div class="mid"><b>Sehaj Randhir Singh</b>Incorporating as a 501(c)(3) nonprofit</div>
  <div class="right">Not affiliated with Damdami Taksal<br>Sources: {SOURCES_USED}</div>
</footer>
</div>
{js}
</body>
</html>
'''
    (D / name).write_text(doc, encoding="utf-8")


def persp():
    tags = "".join(f'<button type="button" class="persp-tag" aria-pressed="false">{t}</button>'
                   for t in ("Gurbani text", "AKJ", "Taksali", "Nihang", "Academic", "Other"))
    return (f'<div class="persp"><span>Commentary by tradition:</span>{tags}'
            f'<span>No commentary sources are hosted yet. These filters will show which tradition each one comes from.</span></div>')


def reader(name, title, path, intro, partial, note):
    blk = (P / f"reader-{partial}.html").read_text(encoding="utf-8").replace("@@PERSPECTIVES@@", persp())
    body = f'<h1 class="page">{title}</h1>\n<p class="note">{intro}</p>\n{blk}\n<p class="note">{note}</p>'
    page(name, f"{title} · Taksal", path, body, ("assets/banidb.js", "data/sample.js", "assets/reader.js"))


def main():
    m = json.loads((D / "corpus/books.json").read_text(encoding="utf-8"))
    nb, npg = len(m["books"]), m["pages"]

    page("index.html", "Taksal", [], f'''<div class="intro">
<p>The Sikh today has a struggle to get any in-depth research on Gurbani, history or Sikhi. Taksal is a way to make it better and easier.</p>
<p class="muted">Read Gurbani line by line, search {nb} public-domain books on Sikh history page by page ({npg:,} pages), and go straight to the original scan.</p>
</div>
<div class="sec-label">Start</div>
<div class="entry"><span class="dot gold"></span><div><div class="e-head"><span class="e-title"><a href="search.html">Search the library</a></span><span class="e-meta">{nb} books · {npg:,} pages</span></div><div class="e-body">Macauliffe, Cunningham, Malcolm, Prinsep, Trumpp, Gardner, Griffin, Teja Singh and more, every page linked to its scan.</div></div></div>
<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title"><a href="hukamnama.html">Today's Hukamnama</a></span><span class="e-meta">live from BaniDB</span></div><div class="e-body">Padchhed or Larivaar, with English and transliteration, and a citation for every line.</div></div></div>
<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title"><a href="guru-granth-sahib.html">Sri Guru Granth Sahib</a></span><span class="e-meta">1,430 angs</span></div><div class="e-body">Read by ang. Also <a href="dasam-granth.html">Dasam Granth</a> and <a href="vaaran.html">Vaaran Bhai Gurdas</a>.</div></div></div>
<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title"><a href="pothis.html">Pothis</a></span><span class="e-meta">manuscript scans</span></div><div class="e-body">A Guru Granth Sahib bir from the 1700s and the Patna Dasam Granth bir of 1765, page by page.</div></div></div>
<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title"><a href="model.html">Taksal (the model)</a></span><span class="e-meta">in development</span></div><div class="e-body">For now a console that searches the sources and prints citations. It does not write answers yet.</div></div></div>''', home=True)

    page("search.html", "Search · Taksal", ["Search"], f'''<h1 class="page">Search the library</h1>
<p class="note">Every word on {npg:,} pages of {nb} public-domain books (all published before 1931, from Internet Archive). For Gurbani, use the readers or the BaniDB search in <a href="model.html">Taksal (the model)</a>.</p>
<form id="sf" role="search" style="margin-top:22px"><input type="search" id="q" placeholder="Ranjit Singh, Zafarnama, Anandpur, misl..." aria-label="Search the library" autocomplete="off"></form>
<p class="count" id="count"></p>
<div class="results" id="res"></div>''', ("assets/corpus.js", "assets/search-page.js"))

    reader("hukamnama.html", "Hukamnama", ["Hukamnama"], "Today's hukamnama from Sri Darbar Sahib, via BaniDB.",
           "hukamnama", "Source: BaniDB <code>/v2/hukamnamas/today</code>.")
    reader("guru-granth-sahib.html", "Sri Guru Granth Sahib", ["Sri Guru Granth Sahib"],
           "Read by ang, 1 to 1,430. Padchhed splits the words, Larivaar joins them.", "guru-granth-sahib",
           "Source: BaniDB <code>/v2/angs/{ang}/G</code>.")
    reader("dasam-granth.html", "Dasam Granth", ["Dasam Granth"], "Dasam Bani by ang.", "dasam-granth",
           "Source: BaniDB <code>/v2/angs/{ang}/D</code>.")
    reader("vaaran.html", "Vaaran Bhai Gurdas", ["Vaaran"], "The Vaaran of Bhai Gurdas Ji by ang.", "vaaran",
           "Source: BaniDB <code>/v2/angs/{ang}/B</code>.")

    rows = []
    for b in m["books"]:
        rows.append(f'<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title">'
                    f'<a href="{b["url"]}">{html.escape(str(b["title"]))}</a></span><span class="e-meta">{b["year"]}</span></div>'
                    f'<div class="e-body">{html.escape(str(b["author"] or "Unknown"))} · {b["pages"]} pages · public domain, full text searchable'
                    f'{"" if b["exact"] else " (page numbers approximate)"}</div></div></div>')
    linked = [("Sicques, Tigers, or Thieves: Eyewitness Accounts of the Sikhs (1606 to 1809)", "Amandeep Singh Madra and Parmjit Singh", "2004", "Palgrave Macmillan. The book that started Taksal."),
              ("Mahan Kosh", "Bhai Kahn Singh Nabha", "1930", "Encyclopaedia of Gurbani and Sikh terms. No verified open digital copy yet."),
              ("Sikh Rehat Maryada", "Shiromani Gurdwara Parbandhak Committee", "1950", 'Official text at <a href="https://sgpc.net/sikh-rehat-maryada-in-english/">sgpc.net</a>.')]
    rows2 = "".join(f'<div class="entry"><span class="dot"></span><div><div class="e-head"><span class="e-title">{t}</span><span class="e-meta">{y}</span></div>'
                    f'<div class="e-body">{a} · in copyright or not openly licensed, catalogue only. {n}</div></div></div>' for t, a, y, n in linked)
    page("library.html", "Library · Taksal", ["Library"], f'''<h1 class="page">Library</h1>
<p class="note">Full text is hosted only for works published before 1931 (public domain in the US). Everything else is a catalogue entry with a link.</p>
<div class="sec-label">Public domain, searchable · {nb}</div>{"".join(rows)}
<div class="sec-label">Catalogue only</div>{rows2}''')

    com = json.loads((D / "data/commons.json").read_text(encoding="utf-8"))
    gal = "".join(f'<figure><a href="{c["file_page"]}"><img src="{c["thumb"]}" alt="{html.escape(c["title"])}" loading="lazy"></a>'
                  f'<figcaption>{html.escape(c["title"].rsplit(".", 1)[0][:90])}<br><span>{html.escape(c["license"])}'
                  f'{(" · " + html.escape(c["author"][:60])) if c["author"] else ""}</span></figcaption></figure>' for c in com)
    page("pothis.html", "Pothis · Taksal", ["Pothis"], f'''<h1 class="page">Pothis</h1>
<p class="note">Digitised hand-written birs, shown in Internet Archive's viewer. Both are marked public domain there.</p>
<div class="sec-label">Sri Guru Granth Sahib, 1700s bir</div>
<iframe class="viewer" src="https://archive.org/embed/puratan_guru_granth_sahib_1700s" title="1700s Guru Granth Sahib manuscript" loading="lazy" allowfullscreen></iframe>
<p class="note"><a href="https://archive.org/details/puratan_guru_granth_sahib_1700s">archive.org/details/puratan_guru_granth_sahib_1700s</a></p>
<div class="sec-label">Dasam Granth, Patna misal bir, 1765</div>
<iframe class="viewer" src="https://archive.org/embed/patna_misal_dasam_1765" title="Patna misal Dasam Granth, 1765" loading="lazy" allowfullscreen></iframe>
<p class="note"><a href="https://archive.org/details/patna_misal_dasam_1765">archive.org/details/patna_misal_dasam_1765</a></p>
<div class="sec-label">Hukamnamas and Gurmukhi manuscripts · {len(com)} images</div>
<p class="note">Openly licensed scans on Wikimedia Commons. Each links to its file page with the full credit and license.</p>
<div class="gallery">{gal}</div>
<div class="sec-label">More, link only</div>
<p class="note">The <a href="https://www.panjabdigilib.org/">Panjab Digital Library</a> holds thousands of manuscripts. Its images are not ours to host, so Taksal links to it. Help transcribing is welcome: <a href="mailto:sehajrsinghs@gmail.com?subject=Taksal%20transcription">write to us</a>.</p>''')

    page("model.html", "Taksal (the model)", ["Taksal (the model)"], f'''<h1 class="page">Taksal (the model)</h1>
<p class="note">The model is in development. This console only searches the sources and prints citations. It does not write answers.</p>
<div class="term">
<div class="log" id="log">taksal · searches the library ({nb} books) and Gurbani (BaniDB)
type a word or name, e.g. <b>Anandpur</b> or <b>Banda Singh</b>; prefix <b>g:</b> to search Gurbani by first letters, e.g. <b>g:hjkk</b>
</div>
<form class="prompt" id="tf"><span>ਟ&gt;</span><input type="text" id="tq" aria-label="Query" autocomplete="off" spellcheck="false"></form>
</div>
<div class="sec-label">What the model will be</div>
<p class="note">It answers only from sources it can cite, and says so when no source supports an answer.<br>It shows how different traditions read a passage, side by side, without picking one.<br>It never generates Gurbani; quotations come from BaniDB.<br>Old manuscripts are read with open OCR and vision models, then checked by people.</p>''',
         ("assets/banidb.js", "assets/corpus.js", "assets/console.js"))

    page("about.html", "About · Taksal", ["About"], '''<h1 class="page">About</h1>
<div class="intro">
<p>The Sikh today has a struggle to get any in-depth research on Gurbani, history or Sikhi. Taksal is a way to make it better and easier.</p>
<p>The idea came from reading <i>Sicques, Tigers, or Thieves</i>, and seeing how much of the record is scattered across old books and archives that are hard to find and harder to search.</p>
<p>The plan: an open library of sources, OCR for old manuscripts, and a model that answers only with citations.</p>
<p class="muted">Taksal is independent and not affiliated with Damdami Taksal or any jatha.</p>
</div>
<div class="sec-label">Sources</div>
<p class="note">Gurbani from <a href="https://www.banidb.com/">BaniDB</a> (Khalis Foundation). Books and pothis from <a href="https://archive.org/">Internet Archive</a>. The coin is drawn from a photograph of a Ranjit Singh rupee by the Classical Numismatic Group on <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> (CC BY-SA 2.5). Full list: <a href="https://github.com/sehajr-singhs/taksal/blob/main/docs/SOURCES.md">SOURCES.md</a>.</p>''')

    page("signin.html", "Sign in · Taksal", ["Sign in"], '''<h1 class="page">Sign in</h1>
<p class="note">Accounts are coming, for saving passages and helping with transcription. Nothing to sign in to yet.</p>''')
    print("built", len(NAV) + 2, "pages")


if __name__ == "__main__":
    main()
