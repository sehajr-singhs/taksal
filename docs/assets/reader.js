/* The shabad reader: Padchhed or Larivaar, English and transliteration, with citations. */
(function () {
  'use strict';

  var root = document.querySelector('[data-reader]');
  var api = window.TaksalBaniDB;
  if (!root || !api) {
    return;
  }

  var kind = root.getAttribute('data-reader');
  var source = root.getAttribute('data-source') || 'G';
  var sourceName = root.getAttribute('data-source-name') || 'Sri Guru Granth Sahib Ji';
  var maxAng = parseInt(root.getAttribute('data-max-ang') || '0', 10) || 0;

  var state = {
    ang: 1,
    lines: [],
    navigation: { previous: null, next: null },
    heading: null,
    mode: 'padchhed',
    english: false,
    translit: false,
    loading: false
  };

  var els = {
    lines: root.querySelector('[data-lines]'),
    head: root.querySelector('[data-reader-head]'),
    status: root.querySelector('[data-status]'),
    notice: root.querySelector('[data-notice]'),
    angInput: root.querySelector('[data-ang-input]'),
    angTotal: root.querySelector('[data-ang-total]'),
    prev: root.querySelector('[data-ang-prev]'),
    next: root.querySelector('[data-ang-next]'),
    modes: root.querySelectorAll('[data-mode]'),
    english: root.querySelector('[data-toggle="english"]'),
    translit: root.querySelector('[data-toggle="translit"]')
  };

  function store(key, value) {
    try {
      localStorage.setItem('taksal-' + key, value);
    } catch (err) {
      /* file:// or private mode, preferences simply do not persist */
    }
  }

  function read(key) {
    try {
      return localStorage.getItem('taksal-' + key);
    } catch (err) {
      return null;
    }
  }

  function restorePrefs() {
    var mode = read('mode');
    if (mode === 'larivaar' || mode === 'padchhed') {
      state.mode = mode;
    }
    state.english = read('english') === '1';
    state.translit = read('translit') === '1';
    if (els.english) {
      els.english.checked = state.english;
    }
    if (els.translit) {
      els.translit.checked = state.translit;
    }
    setModeButtons();
  }

  function setModeButtons() {
    for (var i = 0; i < els.modes.length; i += 1) {
      var mode = els.modes[i].getAttribute('data-mode');
      els.modes[i].setAttribute('aria-pressed', mode === state.mode ? 'true' : 'false');
    }
  }

  function setStatus(text, isError) {
    if (!els.status) {
      return;
    }
    els.status.textContent = text || '';
    els.status.className = 'reader-status' + (isError ? ' is-error' : '');
  }

  function clearNotice() {
    if (els.notice) {
      els.notice.textContent = '';
    }
  }

  function showNotice(message, detail, retry) {
    if (!els.notice) {
      return;
    }
    els.notice.textContent = '';
    var box = document.createElement('div');
    box.className = 'notice';
    var strong = document.createElement('strong');
    strong.textContent = message;
    box.appendChild(strong);
    if (detail) {
      var p = document.createElement('div');
      p.textContent = detail;
      box.appendChild(p);
    }
    if (retry) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn';
      button.textContent = 'Try again';
      button.addEventListener('click', retry);
      box.appendChild(button);
    }
    els.notice.appendChild(box);
  }

  function normalize(line) {
    var translation = (line.translation && line.translation.en) || {};
    var translit = '';
    if (line.transliteration) {
      translit = line.transliteration.en || line.transliteration.english || '';
    }
    return {
      verseId: line.verseId,
      pageNo: line.pageNo || state.ang,
      lineNo: line.lineNo,
      gurmukhi: (line.verse && line.verse.unicode) || '',
      larivaar: (line.larivaar && line.larivaar.unicode) || '',
      english: translation.bdb || translation.ms || translation.ssk || '',
      translit: translit,
      writer: line.writer || null,
      raag: line.raag || null
    };
  }

  function translateLabel() {
    return 'BaniDB English translation';
  }

  function citeFor(line) {
    var url;
    try {
      url = new URL(window.location.href);
      if (kind === 'ang') {
        url.searchParams.set('ang', String(line.pageNo));
      } else {
        url.searchParams.delete('ang');
      }
      url.hash = '';
    } catch (err) {
      url = null;
    }
    return sourceName + ', Ang ' + line.pageNo + ', line ' + line.lineNo +
      '. Verse ' + line.verseId + '. ' + (url ? url.toString() : '');
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          resolve(true);
        }).catch(function () {
          resolve(fallbackCopy(text));
        });
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function render() {
    if (!els.lines) {
      return;
    }
    els.lines.textContent = '';

    if (!state.lines.length) {
      var empty = makeElement('p', 'muted', 'No lines were returned for this page.');
      empty.style.padding = '16px 0';
      els.lines.appendChild(empty);
      return;
    }

    state.lines.forEach(function (line) {
      var article = makeElement('article', 'line');

      var gurmukhiText = state.mode === 'larivaar' && line.larivaar ? line.larivaar : line.gurmukhi;
      var gurmukhi = makeElement(
        'p',
        'line-gurmukhi' + (state.mode === 'larivaar' ? ' is-larivaar' : ''),
        gurmukhiText
      );
      gurmukhi.setAttribute('lang', 'pa-Guru');
      article.appendChild(gurmukhi);

      if (state.translit && line.translit) {
        var translit = makeElement('p', 'line-translit', line.translit);
        translit.setAttribute('lang', 'en');
        article.appendChild(translit);
      }

      if (state.english && line.english) {
        var english = makeElement('p', 'line-english', line.english);
        english.setAttribute('lang', 'en');
        english.title = translateLabel();
        article.appendChild(english);
      }

      var meta = makeElement('div', 'line-meta');
      meta.appendChild(makeElement('span', '', 'Ang ' + line.pageNo + ', line ' + line.lineNo));

      var cite = makeElement('button', 'cite', 'Cite');
      cite.type = 'button';
      cite.addEventListener('click', function () {
        var text = citeFor(line);
        copyText(text).then(function (ok) {
          if (ok) {
            cite.textContent = 'Copied';
            setTimeout(function () {
              cite.textContent = 'Cite';
            }, 1600);
            setStatus('Citation copied: ' + text, false);
          } else {
            setStatus('Could not copy. Citation: ' + text, true);
          }
        });
      });
      meta.appendChild(cite);
      article.appendChild(meta);

      els.lines.appendChild(article);
    });
  }

  function renderHeading() {
    if (!els.head) {
      return;
    }
    els.head.textContent = '';
    var heading = state.heading || {};
    if (heading.date) {
      els.head.appendChild(makeElement('p', 'reader-sub', heading.date));
    }
    if (heading.raag) {
      var raag = makeElement('p', 'reader-raag', heading.raag);
      raag.setAttribute('lang', 'pa-Guru');
      els.head.appendChild(raag);
    } else if (heading.title) {
      els.head.appendChild(makeElement('p', 'reader-raag', heading.title));
    }
    if (heading.writer) {
      els.head.appendChild(makeElement('p', 'reader-sub', heading.writer));
    }
    if (heading.metaLine) {
      els.head.appendChild(makeElement('p', 'reader-sub', heading.metaLine));
    }
  }

  function updateAngControls() {
    if (els.angInput && kind === 'ang') {
      els.angInput.value = String(state.ang);
      if (maxAng) {
        els.angInput.max = String(maxAng);
      }
    }
    if (els.prev) {
      els.prev.disabled = !state.navigation.previous;
    }
    if (els.next) {
      els.next.disabled = !state.navigation.next;
    }
    if (els.angTotal) {
      els.angTotal.textContent = 'Ang ' + state.ang;
    }
  }

  function parseAng(raw) {
    var ang = parseInt(raw, 10);
    if (!ang || ang < 1) {
      return null;
    }
    if (maxAng && ang > maxAng) {
      return null;
    }
    return ang;
  }

  async function loadAng(ang, options) {
    var opts = options || {};
    if (state.loading) {
      return;
    }
    state.loading = true;
    clearNotice();
    setStatus('Loading Ang ' + ang + ' from BaniDB...', false);

    try {
      var data = await api.getAng(ang, source);
      var verses = data.page || [];
      if (!verses.length) {
        throw new Error('BaniDB returned no lines for this ang.');
      }
      state.ang = ang;
      state.lines = verses.map(normalize);
      state.navigation = data.navigation || { previous: null, next: null };
      state.heading = headingFor(verses);

      if (kind === 'ang' && !opts.skipUrl) {
        try {
          var url = new URL(window.location.href);
          url.searchParams.set('ang', String(ang));
          history.replaceState(null, '', url.toString());
        } catch (err) {
          /* file:// can refuse history updates, the reader still works */
        }
      }

      updateAngControls();
      renderHeading();
      render();
      setStatus('Live from BaniDB. ' + state.lines.length + ' lines on Ang ' + ang + '.', false);
    } catch (err) {
      handleAngFailure(ang, err);
    } finally {
      state.loading = false;
    }
  }

  function headingFor(verses) {
    var first = verses[0] || {};
    var raag = first.raag && first.raag.unicode ? first.raag.unicode : '';
    var writer = first.writer && (first.writer.english || first.writer.unicode) ? (first.writer.english || first.writer.unicode) : '';
    return {
      raag: raag,
      writer: writer,
      metaLine: (raag || writer) ? '' : ('Ang ' + (first.pageNo || state.ang))
    };
  }

  function handleAngFailure(ang, err) {
    var sample = window.TAKSAL_SAMPLE;

    if (source === 'G' && sample && sample.lines && sample.lines.length) {
      state.ang = sample.ang;
      state.lines = sample.lines.map(normalize);
      state.navigation = { previous: null, next: null };
      state.heading = {
        title: sample.title || 'Japji Sahib, Pauri 38',
        metaLine: 'Bundled offline sample. Ang ' + sample.ang + '.'
      };
      updateAngControls();
      renderHeading();
      render();
      setStatus('Showing the bundled offline sample.', false);
      showNotice(
        'Could not load Ang ' + ang + ' from BaniDB.',
        err.message + ' Showing the bundled sample instead: ' + (sample.title || 'Japji Sahib, Pauri 38') + '.',
        function () {
          loadAng(ang);
        }
      );
      return;
    }

    state.lines = [];
    state.heading = { title: 'Ang ' + ang };
    updateAngControls();
    renderHeading();
    render();
    setStatus('', false);
    showNotice(
      'Could not load Ang ' + ang + '.',
      err.message,
      function () {
        loadAng(ang);
      }
    );
  }

  function buildHukamnamaHeading(shabadInfo, date) {
    var heading = { title: 'Hukamnama', metaLine: '' };
    if (date && date.date && date.date.gregorian) {
      var g = date.date.gregorian;
      heading.date = new Date(g.year, g.month - 1, g.date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }
    if (shabadInfo) {
      heading.raag = shabadInfo.raag && shabadInfo.raag.unicode ? shabadInfo.raag.unicode : '';
      heading.writer = shabadInfo.writer && (shabadInfo.writer.english || shabadInfo.writer.unicode)
        ? (shabadInfo.writer.english || shabadInfo.writer.unicode)
        : '';
      if (shabadInfo.source && shabadInfo.source.english) {
        heading.metaLine = shabadInfo.source.english + ', Ang ' + shabadInfo.pageNo;
      }
    }
    return heading;
  }

  async function loadHukamnama() {
    clearNotice();
    setStatus('Loading today\u2019s hukamnama from BaniDB...', false);
    try {
      var data = await api.getHukamnama();
      var shabad = data.shabads && data.shabads[0];
      if (!shabad || !shabad.verses || !shabad.verses.length) {
        throw new Error('BaniDB returned no verses for today\u2019s hukamnama.');
      }
      state.lines = shabad.verses.map(normalize);
      state.heading = buildHukamnamaHeading(shabad.shabadInfo || null, data);
      state.navigation = { previous: null, next: null };
      renderHeading();
      render();
      setStatus('Live from BaniDB. Today\u2019s hukamnama.', false);
    } catch (err) {
      state.lines = [];
      renderHeading();
      render();
      setStatus('', false);
      showNotice(
        'Could not load today\u2019s hukamnama.',
        err.message + ' The reader is still available from the sidebar.',
        loadHukamnama
      );
    }
  }

  function bind() {
    for (var i = 0; i < els.modes.length; i += 1) {
      els.modes[i].addEventListener('click', function (event) {
        var mode = event.currentTarget.getAttribute('data-mode');
        state.mode = mode === 'larivaar' ? 'larivaar' : 'padchhed';
        store('mode', state.mode);
        setModeButtons();
        render();
      });
    }

    if (els.english) {
      els.english.addEventListener('change', function (event) {
        state.english = event.currentTarget.checked;
        store('english', state.english ? '1' : '0');
        render();
      });
    }

    if (els.translit) {
      els.translit.addEventListener('change', function (event) {
        state.translit = event.currentTarget.checked;
        store('translit', state.translit ? '1' : '0');
        render();
      });
    }

    if (els.prev) {
      els.prev.addEventListener('click', function () {
        if (state.navigation.previous) {
          loadAng(state.navigation.previous);
        }
      });
    }

    if (els.next) {
      els.next.addEventListener('click', function () {
        if (state.navigation.next) {
          loadAng(state.navigation.next);
        }
      });
    }

    if (els.angInput) {
      els.angInput.addEventListener('change', function (event) {
        var ang = parseAng(event.currentTarget.value);
        if (!ang) {
          setStatus('Enter an ang between 1 and ' + (maxAng || 2000) + '.', true);
          updateAngControls();
          return;
        }
        loadAng(ang);
      });
      els.angInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          els.angInput.blur();
        }
      });
    }
  }

  restorePrefs();
  bind();

  if (kind === 'hukamnama') {
    loadHukamnama();
    return;
  }

  var initial = 1;
  try {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = parseAng(params.get('ang'));
    if (fromUrl) {
      initial = fromUrl;
    }
  } catch (err) {
    initial = 1;
  }
  loadAng(initial, { skipUrl: true });
})();
