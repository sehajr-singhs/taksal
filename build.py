#!/usr/bin/env python3
"""Build the static Taksal site into docs/.

Sources:
  site/pages/*.html      page bodies
  site/assets/*          css, js, svg copied to docs/assets
  data/library.json       library catalog (also mirrored as docs/data/library.js)
  data/sample-japji-38.json  offline reader sample (mirrored as docs/data/sample.js)

Run: python build.py
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
DOCS = ROOT / "docs"

NAV = [
    ("home", "Home", "index.html"),
    ("hukamnama", "Hukamnama", "hukamnama.html"),
    ("sggs", "Sri Guru Granth Sahib", "guru-granth-sahib.html"),
    ("dasam", "Dasam Granth", "dasam-granth.html"),
    ("vaaran", "Vaaran", "vaaran.html"),
    ("pothis", "Pothis", "pothis.html"),
    ("library", "Library", "library.html"),
    ("model", "Taksal (the model)", "model.html"),
    ("about", "About", "about.html"),
]

PAGES = [
    {
        "slug": "index",
        "title": "Taksal",
        "description": "A research home for Sikh knowledge: Gurbani, Dasam Granth, Vaaran, historical texts and scholarship, searchable and citable.",
        "nav": "home",
        "crumb": [("Home", None)],
        "scripts": [],
    },
    {
        "slug": "hukamnama",
        "title": "Hukamnama · Taksal",
        "description": "Today's hukamnama from Sri Guru Granth Sahib Ji, with Padchhed, Larivaar, English and transliteration.",
        "nav": "hukamnama",
        "crumb": [("Home", "index.html"), ("Hukamnama", None)],
        "scripts": ["assets/banidb.js", "data/sample.js", "assets/reader.js"],
    },
    {
        "slug": "guru-granth-sahib",
        "title": "Sri Guru Granth Sahib · Taksal",
        "description": "Read Sri Guru Granth Sahib Ji by ang in Padchhed or Larivaar, with English, transliteration and line citations.",
        "nav": "sggs",
        "crumb": [("Home", "index.html"), ("Sri Guru Granth Sahib", None)],
        "scripts": ["assets/banidb.js", "data/sample.js", "assets/reader.js"],
    },
    {
        "slug": "dasam-granth",
        "title": "Dasam Granth · Taksal",
        "description": "Read Dasam Bani by ang in the Taksal reader, with translations, transliteration and citations to BaniDB.",
        "nav": "dasam",
        "crumb": [("Home", "index.html"), ("Dasam Granth", None)],
        "scripts": ["assets/banidb.js", "data/sample.js", "assets/reader.js"],
    },
    {
        "slug": "vaaran",
        "title": "Vaaran · Taksal",
        "description": "Read the Vaaran of Bhai Gurdas Ji by ang, with the Taksal reader and line citations.",
        "nav": "vaaran",
        "crumb": [("Home", "index.html"), ("Vaaran", None)],
        "scripts": ["assets/banidb.js", "data/sample.js", "assets/reader.js"],
    },
    {
        "slug": "pothis",
        "title": "Pothis · Taksal",
        "description": "A viewer for digitized Sikh manuscripts: scan on the left, transcription on the right. Digitized pothis are coming.",
        "nav": "pothis",
        "crumb": [("Home", "index.html"), ("Pothis", None)],
        "scripts": [],
    },
    {
        "slug": "library",
        "title": "Library · Taksal",
        "description": "A catalog of Sikh historical texts and scholarship, marked public domain or in copyright, with verified links.",
        "nav": "library",
        "crumb": [("Home", "index.html"), ("Library", None)],
        "scripts": ["data/library.js", "assets/library.js"],
    },
    {
        "slug": "model",
        "title": "Taksal (the model) · Taksal",
        "description": "A search console over BaniDB and a description of the planned cited model, Taksal (the model).",
        "nav": "model",
        "crumb": [("Home", "index.html"), ("Taksal (the model)", None)],
        "scripts": ["assets/banidb.js", "assets/model.js"],
    },
    {
        "slug": "about",
        "title": "About · Taksal",
        "description": "What Taksal is, the book that started it, and the plan for an open, cited corpus of Sikh knowledge.",
        "nav": "about",
        "crumb": [("Home", "index.html"), ("About", None)],
        "scripts": [],
    },
    {
        "slug": "signin",
        "title": "Sign in · Taksal",
        "description": "Sign in to Taksal is coming.",
        "nav": "",
        "crumb": [("Home", "index.html"), ("Sign in", None)],
        "scripts": [],
    },
]

SOCIAL = [
    (
        "Instagram",
        "https://instagram.com",
        "TODO: point this at the Taksal Instagram account when it exists.",
        '<rect x="2.5" y="2.5" width="13" height="13" rx="4"></rect>'
        '<circle cx="9" cy="9" r="3.1"></circle>'
        '<circle cx="13.1" cy="4.9" r="0.8" fill="currentColor" stroke="none"></circle>',
    ),
    (
        "X",
        "https://x.com",
        "TODO: point this at the Taksal X account when it exists.",
        '<path d="M3 3l12 12"></path><path d="M15 3L3 15"></path>',
    ),
    (
        "Facebook",
        "https://facebook.com",
        "TODO: point this at the Taksal Facebook page when it exists.",
        '<path d="M11.2 15.5V9.6h2l.3-2.3h-2.3V5.8c0-.7.2-1.1 1.2-1.1h1.2V2.6c-.2 0-.9-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.7H6.9v2.3h1.9v5.9z" fill="currentColor" stroke="none"></path>',
    ),
    (
        "YouTube",
        "https://youtube.com",
        "TODO: point this at the Taksal YouTube channel when it exists.",
        '<rect x="1.6" y="4" width="14.8" height="10" rx="2.6"></rect>'
        '<path d="M7.6 6.8l4.2 2.2-4.2 2.2z" fill="currentColor" stroke="none"></path>',
    ),
]

COIN_SVG = """<svg class="coin" viewBox="0 0 160 160" role="img" aria-label="Taksal coin mark: a silver rupee style coin with Gurmukhi text around the rim and a leaf at the centre">
  <defs>
    <path id="coinArcTop" d="M 22 80 A 58 58 0 0 1 138 80"></path>
    <path id="coinArcBottom" d="M 138 80 A 58 58 0 0 1 22 80"></path>
  </defs>
  <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
  <circle cx="80" cy="80" r="68" fill="none" stroke="#c8902a" stroke-width="1"></circle>
  <circle cx="80" cy="80" r="47" fill="none" stroke="currentColor" stroke-width="1.2"></circle>
  <circle cx="80" cy="80" r="42" fill="none" stroke="#c8902a" stroke-width="0.7" stroke-dasharray="1 4"></circle>
  <text class="coin-rim" font-size="9.2" letter-spacing="2.2" fill="currentColor">
    <textPath href="#coinArcTop" startOffset="50%" text-anchor="middle">ਟਕਸਾਲ · ਸਚੀ ਟਕਸਾਲ</textPath>
  </text>
  <text class="coin-rim" font-size="7.6" letter-spacing="3.6" fill="currentColor">
    <textPath href="#coinArcBottom" startOffset="50%" text-anchor="middle">TAKSAL</textPath>
  </text>
  <path d="M80 52 C 94 62, 98 82, 80 104 C 62 82, 66 62, 80 52 Z" fill="none" stroke="currentColor" stroke-width="1.4"></path>
  <path d="M80 57 L80 97" fill="none" stroke="currentColor" stroke-width="1"></path>
  <path d="M80 70 L72.5 76 M80 70 L87.5 76 M80 81 L71.5 87 M80 81 L88.5 87" fill="none" stroke="currentColor" stroke-width="0.8"></path>
  <circle cx="80" cy="80" r="2.1" fill="#c8902a"></circle>
  <circle cx="80" cy="14.5" r="1.6" fill="currentColor"></circle>
  <circle cx="80" cy="145.5" r="1.6" fill="currentColor"></circle>
  <circle cx="14.5" cy="80" r="1.6" fill="currentColor"></circle>
  <circle cx="145.5" cy="80" r="1.6" fill="currentColor"></circle>
</svg>"""

ASCII_COIN = r"""           _.-~^~-._
        .-~  .-~~-.  ~-.
       /   .'      '.   \
      /   /          \   \
     |   |    _/\_    |   |
     |   |   /  |  \  |   |
     |   |   \  |  /  |   |
     |   |    \_|_/    |   |
      \   \           /   /
       \   '.       .'   /
        '-. '~...~' .-'
           '~-.-.-~'"""

PERSPECTIVES = """<div class="perspectives">
  <span class="persp-label">Commentary perspectives</span>
  <div class="persp-tags" role="group" aria-label="Commentary traditions, filter only for now">
    <button type="button" class="persp-tag" aria-pressed="false">SGGS text</button>
    <button type="button" class="persp-tag" aria-pressed="false">AKJ</button>
    <button type="button" class="persp-tag" aria-pressed="false">Taksali</button>
    <button type="button" class="persp-tag" aria-pressed="false">Nihang</button>
    <button type="button" class="persp-tag" aria-pressed="false">Academic</button>
    <button type="button" class="persp-tag" aria-pressed="false">Other</button>
  </div>
  <p class="persp-note">Commentary sources are being added. These tags are UI only for now.</p>
</div>"""


def header_html(page):
    crumbs = []
    for index, (label, href) in enumerate(page["crumb"]):
        last = index == len(page["crumb"]) - 1
        if last or not href:
            crumbs.append('<span aria-current="page">%s</span>' % label)
        else:
            crumbs.append('<a href="%s">%s</a>' % (href, label))
    crumb = '<span class="sep">/</span>'.join(crumbs)

    socials = []
    for name, href, todo, icon in SOCIAL:
        socials.append(
            "<!-- %s -->\n        "
            '<a class="social" href="%s" aria-label="Taksal on %s" title="%s">'
            '<svg viewBox="0 0 18 18" width="15" height="15" fill="none" '
            'stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" '
            'stroke-linecap="round" aria-hidden="true">%s</svg></a>' % (todo, href, name, name, icon)
        )

    return (
        '<header class="site-head">\n'
        '  <div class="head-inner">\n'
        '    <div class="head-left">\n'
        '      <div class="hist">\n'
        '        <button type="button" class="hbtn" data-hist="back" aria-label="Go back" title="Back">'
        '<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" '
        'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M11.5 4.5L6 10l5.5 5.5"></path></svg></button>\n'
        '        <button type="button" class="hbtn" data-hist="forward" aria-label="Go forward" title="Forward">'
        '<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" '
        'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M8.5 4.5L14 10l-5.5 5.5"></path></svg></button>\n'
        '      </div>\n'
        '      <nav class="crumb" aria-label="Breadcrumb">%s</nav>\n'
        '    </div>\n'
        '    <div class="head-right">\n'
        '        %s\n'
        '      <a class="signin" href="signin.html">Sign in</a>\n'
        '    </div>\n'
        '  </div>\n'
        '</header>' % (crumb, "\n        ".join(socials))
    )


def nav_html(active):
    items = []
    for key, label, href in NAV:
        if key == active:
            items.append('<li><a href="%s" class="active" aria-current="page">%s</a></li>' % (href, label))
        else:
            items.append('<li><a href="%s">%s</a></li>' % (href, label))
    return (
        '<nav class="side" aria-label="Sections">\n'
        '  <span class="side-label">Sections</span>\n'
        '  <ul>\n    %s\n  </ul>\n'
        '</nav>' % ("\n    ".join(items))
    )


FOOTER = """<footer class="site-foot">
  <div class="foot-inner">
    <div class="foot-left">
      <a class="reach" href="mailto:sehajrsinghs@gmail.com?subject=Taksal">Reach out to the team</a>
    </div>
    <div class="foot-mid">
      <div>Sehaj Randhir Singh</div>
      <div class="muted">Incorporating as a 501(c)(3) nonprofit</div>
    </div>
    <div class="foot-right muted">
      <div>Not affiliated with Damdami Taksal.</div>
      <div>Powered by BaniDB, Surya OCR, open VLMs and Gemma (planned).</div>
    </div>
  </div>
</footer>"""


def page_html(page, body):
    scripts = ['<script src="assets/site.js" defer></script>']
    for src in page["scripts"]:
        scripts.append('<script src="%s" defer></script>' % src)

    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%(title)s</title>
<meta name="description" content="%(description)s">
<meta name="theme-color" content="#ebe8e1">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="%(nav)s">
<a class="skip" href="#main">Skip to content</a>
%(header)s
<div class="wrap">
  <div class="shell">
    %(navhtml)s
    <main id="main">
%(body)s
    </main>
  </div>
</div>
%(footer)s
%(scripts)s
</body>
</html>
""" % {
        "title": page["title"],
        "description": page["description"],
        "nav": page["nav"],
        "header": header_html(page),
        "navhtml": nav_html(page["nav"]),
        "body": body.rstrip(),
        "footer": FOOTER,
        "scripts": "\n".join(scripts),
    }


def write_data():
    data_dir = DOCS / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    library = json.loads((ROOT / "data" / "library.json").read_text(encoding="utf-8"))
    (data_dir / "library.json").write_text(
        json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (data_dir / "library.js").write_text(
        "/* Generated by build.py from data/library.json. Do not edit by hand. */\n"
        "window.TAKSAL_LIBRARY = "
        + json.dumps(library, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    sample = json.loads((ROOT / "data" / "sample-japji-38.json").read_text(encoding="utf-8"))
    (data_dir / "sample.js").write_text(
        "/* Generated by build.py from data/sample-japji-38.json. Bundled for offline use. */\n"
        "window.TAKSAL_SAMPLE = "
        + json.dumps(sample, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def main():
    DOCS.mkdir(exist_ok=True)
    assets = DOCS / "assets"
    if assets.exists():
        shutil.rmtree(assets)
    shutil.copytree(SITE / "assets", assets)

    for old in DOCS.glob("*.html"):
        old.unlink()

    for page in PAGES:
        body = (SITE / "pages" / (page["slug"] + ".html")).read_text(encoding="utf-8")
        body = body.replace("<!--PERSPECTIVES-->", PERSPECTIVES)
        body = body.replace("<!--COIN_SVG-->", COIN_SVG)
        body = body.replace("<!--ASCII_COIN-->", ASCII_COIN)
        (DOCS / (page["slug"] + ".html")).write_text(page_html(page, body), encoding="utf-8")

    write_data()
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    print("Built %d pages into %s" % (len(PAGES), DOCS))


if __name__ == "__main__":
    main()
