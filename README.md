# Taksal

ਟਕਸਾਲ · ਘੜੀਐ ਸਬਦੁ ਸਚੀ ਟਕਸਾਲ ॥ · In this true mint, the Word of the Shabad is forged.

The Sikh today has a struggle to get any in-depth research on Gurbani, history or Sikhi. Taksal is a way to make it better and easier.

Live: https://sehajr-singhs.github.io/taksal/

- Gurbani readers (Hukamnama, Sri Guru Granth Sahib, Dasam Granth, Vaaran) live from BaniDB.
- Full-text search over 41 public-domain books on Sikh history (13,401 pages, 1812 to 1927), every hit linked to its scan.
- Digitised pothis, and a console for Taksal (the model), which is in development.

Build: `python tools/fetch_ia_books.py && python tools/build_corpus.py && python tools/coin_ascii.py 56 && python tools/build_site.py`.
Sources and licenses: `docs/SOURCES.md` and `data/sources.json`. Independent; not affiliated with Damdami Taksal or any jatha.
