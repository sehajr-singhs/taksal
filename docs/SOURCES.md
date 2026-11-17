# Sources and endpoints

Everything below was checked on 17 November 2026 while building this site. Nothing here is copied from memory.

## Design reference

The palette and font stacks were read from the owner's site at
`C:\Users\sehaj\sites\sehajr-singhs.github.io\index.html` (lines 10 to 18).

- Background `#ebe8e1`, ink `#1a1a1a`, muted `#6f6f6a`, line `#d8d5cd`.
- `--serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif`
- `--mono: "SF Mono", "JetBrains Mono", "Menlo", "Consolas", "Liberation Mono", monospace`
- Brown `#7a5230` and saffron `#c8902a` are used as the accents.

Gurmukhi uses Noto Sans Gurmukhi from Google Fonts:

- `https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;500;600&display=swap`
  Loaded in every page head. Verified the stylesheet is reachable and returns the font CSS.

## BaniDB API

Base: `https://api.banidb.com/v2`. Responses are JSON with `access-control-allow-origin: *`.
The site calls the API directly from the browser, so there is no proxy or key.

Routes were checked against the API implementation, not assumed:

- `https://raw.githubusercontent.com/KhalisFoundation/banidb-api/dev/api/routes/index.js`
  Lists `GET /search/:query`, `GET /shabads/:ShabadID`, `GET /angs/:PageNo/:SourceID?`,
  `GET /hukamnamas/:year?/:month?/:day?`, `GET /banis`, `GET /banis/:BaniID`.
- `https://raw.githubusercontent.com/KhalisFoundation/banidb-api/dev/api/controllers/shabads.js`
  Gives the search query parameters and the meaning of each `searchtype`.
- `https://raw.githubusercontent.com/KhalisFoundation/banidb-api/dev/api/lib/searchOperators.js`
  Confirms the Gurmukhi search operates on the legacy ASCII Gurmukhi field.
- `https://raw.githubusercontent.com/KhalisFoundation/banidb-api/dev/tests/e2e/__tests__/search.tests.js`
  Shows example search calls and result shapes.

### Endpoints used

| Endpoint | Used on | Checked |
| --- | --- | --- |
| `GET /v2/angs/{ang}/{source}` | Guru Granth Sahib, Dasam Granth, Vaaran readers | HTTP 200 for `/angs/1`, `/angs/8`, `/angs/1/G`, `/angs/1/D`, `/angs/1/B` |
| `GET /v2/hukamnamas/today` | Hukamnama page | HTTP 200, returned the hukamnama for 17 November 2026 |
| `GET /v2/search/{query}?searchtype=N&isGurmukhi=1&source=...&results=N` | Taksal (the model) console | HTTP 200 for Gurmukhi, romanized and English queries |
| `GET /v2/sources` | Source IDs used by the site | HTTP 200 |

### Response shapes verified

`/angs/{ang}` returns:

```
{
  "source": { "sourceId": "G", "gurmukhi": "...", "unicode": "...", "english": "Sri Guru Granth Sahib Ji", "pageNo": 1 },
  "count": 23,
  "navigation": { "previous": null, "next": 2 },
  "page": [
    {
      "verseId": 1,
      "shabadId": 1,
      "verse": { "gurmukhi": "...", "unicode": "..." },
      "larivaar": { "gurmukhi": "...", "unicode": "..." },
      "translation": { "en": { "bdb": "...", "ms": "...", "ssk": "..." }, "pu": { ... } },
      "transliteration": { "english": "...", "hindi": "...", "ipa": "...", "ur": "..." },
      "pageNo": 1,
      "lineNo": 1,
      "writer": { ... },
      "raag": { ... }
    }
  ]
}
```

The reader uses `verse.unicode` for Padchhed, `larivaar.unicode` for Larivaar,
`translation.en.bdb` for English (falling back to `ms` then `ssk`), and
`transliteration.en` or `transliteration.english` for transliteration.

`/hukamnamas/today` returns:

```
{
  "isLatest": true,
  "date": { "gregorian": { "month": 11, "date": 17, "year": 2026 } },
  "shabadIds": [2291],
  "shabads": [
    { "shabadInfo": { "shabadId": 2291, "pageNo": 604, "source": {...}, "raag": {...}, "writer": {...} },
      "count": 16, "navigation": {...}, "verses": [ ...same verse shape... ] }
  ]
}
```

`/search/{query}` returns:

```
{
  "resultsInfo": { "totalResults": 9085, "pageResults": 20,
                   "pages": { "page": 1, "resultsPerPage": 20, "totalPages": 455 } },
  "verses": [ ...verse shape, with source added... ]
}
```

### Search parameters and types

Parameters are lowercase. In testing, `searchType=2` (camel case) returned zero
results while `searchtype=2` returned the expected set, so the site sends lowercase.

- `searchtype` means:
  - 0 first letter start
  - 1 first letter anywhere
  - 2 full word, Gurmukhi
  - 3 full word, English
  - 4 full word, romanized
  - 5 ang number
  - 6 main letters
  - 7 first letters, English
  - 8 omni search
- `isGurmukhi=1` is required for a Unicode Gurmukhi query. Without it,
  `/search/ਹਰਿ` returned 0 results; with `isGurmukhi=1&searchtype=2` it returned 9085.
- `source=G|D|B` limits to a source.
- `results` sets the page size, `page` sets the page.

The console sends Gurmukhi input with `searchtype=2&isGurmukhi=1`, romanized input with
`searchtype=4`, and retries English words with `searchtype=3`.

### Sources used

From `/v2/sources`:

- `G` Sri Guru Granth Sahib Ji
- `D` Dasam Bani
- `B` Bhai Gurdas Ji Vaaran

`/angs/1/N` and `/angs/1/A` return
`{"error":true,"data":{"error":"That ang does not exist or no updates found."}}`.
The client treats that as an error and shows a message.

## Library links

Archive.org identifiers were found with the advanced search API and then checked with
`https://archive.org/metadata/{identifier}` for title, year and mediatype, and with an
HTTP request to the details page.

| Work | Link | Verification |
| --- | --- | --- |
| Mahan Kosh, 1930 | `https://archive.org/details/mahan-kosh-1930-first-edition-volume-two-by-kahn-singh-of-nabha` | metadata: title "Mahan Kosh (1930, first edition, volume two)", year 1930, mediatype texts; details HTTP 200 |
| The Sikh Religion, 1909 | `https://archive.org/details/thesikhreligioni06macauoft` | metadata: Oxford Clarendon Press, 1909, Macauliffe; details HTTP 200 |
| A History of the Sikhs, 1849 | `https://archive.org/details/historyofsikhsfr00cunn_0` | metadata: London, J. Murray, 1849, Cunningham; details HTTP 200 |
| Sicques, Tigers, or Thieves | `https://link.springer.com/book/10.1007/978-1-137-11998-8` | HTTP 200; Palgrave Macmillan, 2004. Catalog link only. |
| Sikh Rehat Maryada | `https://sgpc.net/sikh-rehat-maryada-in-english/` | HTTP 200 after redirect from `/sikh-rehat-maryada/`. Catalog link only. |

No full text link is given for Prachin Panth Prakash, Sri Gur Sobha or Zafarnama. The only
scans found were modern editions or lacked a verifiable publication date, so the entries
carry a pending note instead of a guessed URL. Vaaran Bhai Gurdas links to the site's own
reader, which reads BaniDB source `B`.

## Offline sample

`data/sample-japji-38.json` was captured from
`https://api.banidb.com/v2/angs/8` on 17 November 2026. It holds the seven lines of
Japji Sahib, Pauri 38 (Ang 8, lines 8 to 10) with Padchhed, Larivaar, English and
transliteration. The build copies it to `docs/data/sample.js` so it loads over `file://`
without a fetch.

## Known limitations

- BaniDB owns its data and asks for attribution. The site links and names BaniDB in the footer.
- Search quality depends on BaniDB. The console can only report what the API returns.
- Ang numbering for Dasam Bani and Bhai Gurdas Ji Vaaran follows BaniDB and may not match printed editions.
- The library checks were link checks, not a legal review of each edition.
