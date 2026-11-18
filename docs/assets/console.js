/* Taksal (the model) console: a search console, not a generator. Prints sources with citations only. */
(function () {
  'use strict';
  var log = document.getElementById('log'), form = document.getElementById('tf'), input = document.getElementById('tq');
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function out(h) { log.insertAdjacentHTML('beforeend', h + '\n'); window.scrollTo(0, document.body.scrollHeight); }
  function gurbani(q, type) {
    return TaksalBaniDB.search(q, { type: type, results: 8 }).then(function (r) {
      var v = (r && (r.verses || r.results)) || [];
      if (!v.length) { out('  no Gurbani lines found'); return; }
      v.slice(0, 8).forEach(function (x) {
        var g = (x.verse && (x.verse.unicode || x.verse.gurmukhi)) || x.gurmukhi || '';
        var en = (x.translation && x.translation.en && (x.translation.en.bdb || x.translation.en.ms || x.translation.en.ssk)) || '';
        var src = (x.source && (x.source.english || x.source.sourceId)) || '';
        out('  <span lang="pa-Guru" style="font-family:var(--guru);font-size:16px">' + esc(g) + '</span>' +
            (en ? '\n    ' + esc(en) : '') + '\n    <span class="muted">' + esc(src) + ', ang ' + esc(x.pageNo || '?') + ' · BaniDB</span>');
      });
    });
  }
  function library(q) {
    return TaksalCorpus.search(q, 5).then(function (r) {
      if (!r.hits.length) { out('  nothing in the library for that'); return; }
      out('  ' + r.total + ' pages in the library. Top ' + r.hits.length + ':');
      r.hits.forEach(function (h) {
        out('  <a href="' + esc(h.link) + '">' + esc(TaksalCorpus.cite(h)) + '</a>\n    <span class="muted">' + h.snippet + '</span>');
      });
    });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim(); input.value = '';
    if (!q) return;
    out('<span style="color:var(--gold)">ਟ&gt;</span> ' + esc(q));
    var job;
    if (/^g:/i.test(q)) job = gurbani(q.slice(2).trim(), 7);
    else if (/[\u0A00-\u0A7F]/.test(q)) job = gurbani(q, 2);
    else job = library(q);
    job.catch(function (err) { out('  error: ' + esc(err.message || err)); });
  });
})();
