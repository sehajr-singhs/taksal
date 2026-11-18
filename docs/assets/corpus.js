/* Full-text search over Taksal's public-domain library (docs/corpus, built by tools/build_corpus.py).
   A query loads only the index shards for its words (by first two letters) and the page chunks it shows. */
window.TaksalCorpus = (function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.dataset.base) || 'corpus/';
  var STOP = ('the and that with for this from was were which have has had not but are his her their they them you your our ' +
    'its into than then there these those been also when what who whom whose will would shall should could upon such only some ' +
    'other more most very over under about after before being both each few many much same any all one two can may might must ' +
    'out off own per she him yet nor ours why how where while whilst said did does doing done ever every').split(' ');
  var stop = {}; STOP.forEach(function (w) { stop[w] = 1; });
  var shards = {}, chunks = {}, manifest = null;

  function fold(s) { return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function terms(q) {
    var out = [], seen = {};
    (fold(q).match(/[a-z]{3,}/g) || []).forEach(function (w) { if (!stop[w] && !seen[w]) { seen[w] = 1; out.push(w); } });
    return out;
  }
  function json(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + url); return r.json(); }); }
  function books() { return manifest ? Promise.resolve(manifest) : json(BASE + 'books.json').then(function (m) { manifest = m; return m; }); }
  function shard(k) { return shards[k] || (shards[k] = json(BASE + 'idx/' + k + '.json').catch(function () { return {}; })); }
  function chunk(b, c) { var k = b + '/' + c; return chunks[k] || (chunks[k] = json(BASE + 'p/' + k + '.json')); }

  function postings(word) {
    return shard(word.slice(0, 2)).then(function (s) {
      var out = {}, raw = s[word];
      if (!raw) return out;
      raw.split(';').forEach(function (part) {
        var bp = part.split(':'), b = +bp[0];
        bp[1].split(',').forEach(function (p) { out[b + ':' + p] = 1; });
      });
      return out;
    });
  }

  function snippet(text, ws) {
    var low = fold(text), at = -1;
    for (var i = 0; i < ws.length && at < 0; i++) at = low.indexOf(ws[i]);
    var start = Math.max(0, at - 140), end = Math.min(text.length, (at < 0 ? 0 : at) + 260);
    var s = (start > 0 ? '... ' : '') + text.slice(start, end) + (end < text.length ? ' ...' : '');
    s = s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    ws.forEach(function (w) { s = s.replace(new RegExp('\\b(' + w + '\\w*)', 'gi'), '<mark>$1</mark>'); });
    return s;
  }

  function search(q, limit) {
    var ws = terms(q);
    limit = limit || 25;
    if (!ws.length) return Promise.resolve({ terms: ws, total: 0, hits: [] });
    return Promise.all([books()].concat(ws.map(postings))).then(function (all) {
      var m = all[0], lists = all.slice(1), score = {};
      lists.forEach(function (l) { for (var k in l) score[k] = (score[k] || 0) + 1; });
      var keys = Object.keys(score), full = keys.filter(function (k) { return score[k] === ws.length; });
      var pool = full.length ? full : keys;
      pool.sort(function (a, b) { return score[b] - score[a] || (+a.split(':')[0]) - (+b.split(':')[0]) || (+a.split(':')[1]) - (+b.split(':')[1]); });
      var phrase = fold(q).replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
      // spread candidates across books (up to 4 pages per book per round) so one long book can't fill the list
      var byBook = {}, order = [];
      pool.forEach(function (k) { var b = k.split(':')[0]; if (!byBook[b]) { byBook[b] = []; order.push(b); } byBook[b].push(k); });
      var top = [], want = Math.max(limit * 2, 48);
      for (var round = 0; top.length < want && round < 50; round++) {
        var added = 0;
        order.forEach(function (b) { var s2 = byBook[b].slice(round * 4, round * 4 + 4); if (s2.length && top.length < want) { top = top.concat(s2); added++; } });
        if (!added) break;
      }
      return Promise.all(top.map(function (k) {
        var b = +k.split(':')[0], p = +k.split(':')[1], C = m.chunk;
        return chunk(b, Math.floor(p / C)).then(function (rows) {
          var row = rows[p % C], book = m.books[b], text = row[2];
          var exact = phrase.indexOf(' ') > 0 && fold(text).replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').indexOf(phrase) >= 0;
          var link = book.url + (row[0] !== null ? '/page/n' + row[0] + '/mode/1up?q=' + encodeURIComponent(q) : '');
          var flat = fold(text), digits = (text.match(/\d/g) || []).length / Math.max(1, text.length);
          var near = 0;
          if (ws.length > 1) {  // words within 60 characters of each other
            var pos = ws.map(function (w) { var a = [], i = -1; while ((i = flat.indexOf(w, i + 1)) >= 0 && a.length < 50) a.push(i); return a; });
            pos[0].forEach(function (i) { if (pos.slice(1).every(function (a) { return a.some(function (j) { return Math.abs(j - i) < 60; }); })) near = 1; });
          }
          var hitsN = ws.reduce(function (n, w) { return n + (flat.split(w).length - 1); }, 0);
          var sc = score[k] + (exact ? 10 : 0) + near * 4 + Math.min(hitsN, 8) * 0.25 - (digits > 0.06 ? 3 : 0);
          return { book: book, leaf: row[0], label: row[1], page: p, exact: exact, score: sc,
                   snippet: snippet(text, ws), link: link };
        });
      })).then(function (hits) {
        hits.sort(function (a, b) { return b.score - a.score; });
        return { terms: ws, total: pool.length, all: full.length > 0, hits: hits.slice(0, limit), manifest: m };
      });
    });
  }

  function cite(h) {
    var where = h.book.exact ? (h.label ? 'p. ' + h.label : 'scan page ' + (h.leaf + 1)) : h.label + ' (approximate)';
    return h.book.author + ', ' + h.book.title + ' (' + h.book.year + '), ' + where + '. Internet Archive: ' + h.link.split('?')[0];
  }

  return { search: search, books: books, cite: cite, terms: terms };
})();
