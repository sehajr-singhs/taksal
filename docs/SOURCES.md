# Taksal sources

Every item, its license and how it was checked is in `data/sources.json` (48 entries). Summary:

| What | Where from | License | Hosted how |
|---|---|---|---|
| 41 books on Sikh history and scripture, 1812 to 1927 | Internet Archive (identifiers in `docs/corpus/books.json`) | US public domain (published before 1931) | OCR text split by page, full-text search, every hit links to the page scan |
| Guru Granth Sahib bir (1700s), Patna misal Dasam Granth bir (1765) | Internet Archive | Public Domain Mark | Internet Archive's own embedded viewer |
| Gurbani (SGGS, Dasam Bani, Vaaran), hukamnama | BaniDB API v2, Khalis Foundation | used live | fetched in the browser, never copied |
| The coin | Rupee of Maharaja Ranjit Singh, Lahore mint, 1825-26, photo by Classical Numismatic Group on Wikimedia Commons | CC BY-SA 2.5 | ASCII derivative `docs/assets/coin-ascii.txt`, same license, made by `tools/coin_ascii.py` |
| Sicques, Tigers, or Thieves; Mahan Kosh; Sikh Rehat Maryada | publishers / SGPC | in copyright or not openly licensed | catalogue entry only |

Rebuild: `python tools/fetch_ia_books.py`, `python tools/build_corpus.py`, `python tools/coin_ascii.py 56`, `python tools/build_site.py`.
Panjab Digital Library is linked, never copied.
