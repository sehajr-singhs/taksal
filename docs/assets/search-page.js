/* Search page: query the library corpus and list pages with snippets, scan links and a citation. */
(function () {
  'use strict';
  var form = document.getElementById('sf'), q = document.getElementById('q');
  var res = document.getElementById('res'), count = document.getElementById('count');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function run(text) {
    if (!text.trim()) return;
    history.replaceState(null, '', '?q=' + encodeURIComponent(text));
    count.textContent = 'searching...'; res.textContent = '';
    TaksalCorpus.search(text, 30).then(function (r) {
      if (!r.terms.length) { count.textContent = 'Type a word of three letters or more.'; return; }
      count.textContent = r.total ? r.total.toLocaleString() + ' pages' + (r.all ? '' : ' (no page has every word; showing pages with some)') + '. Top ' + r.hits.length + ':' : 'No pages found.';
      res.innerHTML = r.hits.map(function (h, i) {
        var where = h.book.exact ? (h.label ? 'p. ' + esc(h.label) : 'scan page ' + (h.leaf + 1)) : esc(h.label) + ' (approx.)';
        return '<div class="entry"><div><div class="e-head"><span class="e-title"><a href="' + esc(h.link) + '">' + esc(h.book.title) +
          '</a></span><span class="e-meta">' + esc(h.book.year) + ' · ' + where + '</span></div>' +
          '<div class="e-meta">' + esc(h.book.author || '') + '</div><p class="snip">' + h.snippet + '</p>' +
          '<div class="e-links"><a href="' + esc(h.link) + '">Open scan</a><a href="#" data-cite="' + i + '">Copy citation</a></div></div></div>';
      }).join('');
      res.querySelectorAll('[data-cite]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var c = TaksalCorpus.cite(r.hits[+a.dataset.cite]);
          (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { a.textContent = 'Copied'; }, function () { window.prompt('Citation', c); });
        });
      });
    }).catch(function (e) { count.textContent = 'Search failed: ' + e.message; });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); run(q.value); });
  var init = new URLSearchParams(location.search).get('q');
  if (init) { q.value = init; run(init); }
})();
