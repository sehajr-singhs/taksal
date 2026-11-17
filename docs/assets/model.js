/* Taksal (the model): a search console over BaniDB. It does not generate answers. */
(function () {
  'use strict';

  var form = document.querySelector('[data-term-form]');
  var input = document.querySelector('[data-term-input]');
  var log = document.querySelector('[data-term-log]');
  var api = window.TaksalBaniDB;
  if (!form || !input || !log || !api) {
    return;
  }

  var busy = false;
  var history = [];
  var historyIndex = -1;

  function write(text, className) {
    var p = document.createElement('p');
    p.className = className || '';
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
  }

  function writeNode(node) {
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  }

  function writeLink(text, href, suffix) {
    var p = document.createElement('p');
    p.className = 'log-link';
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    p.appendChild(a);
    if (suffix) {
      p.appendChild(document.createTextNode(' ' + suffix));
    }
    writeNode(p);
  }

  function isGurmukhi(text) {
    return /[\u0A00-\u0A7F]/.test(text);
  }

  function pickEnglish(verse) {
    var en = (verse.translation && verse.translation.en) || {};
    return en.bdb || en.ms || en.ssk || '';
  }

  function verseText(verse) {
    return (verse.verse && verse.verse.unicode) || '';
  }

  function readerHref(verse) {
    var source = (verse.source && verse.source.sourceId) || 'G';
    var page = source === 'D' ? 'dasam-granth.html' : source === 'B' ? 'vaaran.html' : 'guru-granth-sahib.html';
    return page + '?ang=' + encodeURIComponent(verse.pageNo);
  }

  function printVerse(verse) {
    var sourceName = (verse.source && verse.source.english) || 'Sri Guru Granth Sahib Ji';
    write(sourceName + ', Ang ' + verse.pageNo + ', line ' + verse.lineNo, 'log-dim');

    var gur = document.createElement('p');
    gur.className = 'log-line-gur';
    gur.lang = 'pa-Guru';
    gur.textContent = verseText(verse);
    writeNode(gur);

    var english = pickEnglish(verse);
    if (english) {
      write(english, 'log-line-en');
    }

    var citation = sourceName + ', Ang ' + verse.pageNo + ', line ' + verse.lineNo +
      '. Verse ' + verse.verseId + '. BaniDB.';
    write('cite: ' + citation, 'log-dim');
    writeLink('open reader', readerHref(verse), '');
  }

  async function runSearch(query) {
    if (busy) {
      return;
    }
    busy = true;
    var gurmukhi = isGurmukhi(query);
    write('> search ' + query, 'log-cmd');
    write('searching BaniDB...', 'log-dim');

    try {
      var type = gurmukhi ? 2 : 4;
      var data = await api.search(query, { type: type, gurmukhi: gurmukhi, results: 8 });

      if ((!data.verses || !data.verses.length) && !gurmukhi) {
        write('no romanized match, trying the English index...', 'log-dim');
        data = await api.search(query, { type: 3, results: 8 });
      }

      var verses = data.verses || [];
      var total = data.resultsInfo ? data.resultsInfo.totalResults : verses.length;

      if (!verses.length) {
        write('No matching lines in BaniDB. Try a shorter word or a different script.', 'log-dim');
        write('Nothing is generated here. The console only reports sources.', 'log-dim');
        return;
      }

      write(total + ' matching lines. Showing ' + verses.length + '.', 'log-accent');
      verses.forEach(function (verse) {
        printVerse(verse);
        write('', '');
      });
    } catch (err) {
      write('Search failed: ' + err.message, 'log-dim');
      write('The console needs a network connection to BaniDB.', 'log-dim');
    } finally {
      busy = false;
    }
  }

  async function runAng(ang) {
    if (busy) {
      return;
    }
    var parsed = parseInt(ang, 10);
    if (!parsed || parsed < 1) {
      write('Usage: ang 8', 'log-dim');
      return;
    }
    busy = true;
    write('> ang ' + parsed, 'log-cmd');
    write('fetching ang ' + parsed + '...', 'log-dim');
    try {
      var data = await api.getAng(parsed, 'G');
      var verses = (data.page || []).slice(0, 6);
      if (!verses.length) {
        write('BaniDB returned no lines for Ang ' + parsed + '.', 'log-dim');
        return;
      }
      write((data.source && data.source.english ? data.source.english : 'Sri Guru Granth Sahib Ji') +
        ', Ang ' + parsed + ', ' + data.count + ' lines. Showing ' + verses.length + '.', 'log-accent');
      verses.forEach(function (verse) {
        printVerse(verse);
        write('', '');
      });
      writeLink('open Ang ' + parsed + ' in the reader', 'guru-granth-sahib.html?ang=' + parsed, '');
    } catch (err) {
      write('Could not load Ang ' + parsed + ': ' + err.message, 'log-dim');
    } finally {
      busy = false;
    }
  }

  function help() {
    write('Commands', 'log-accent');
    write('  search <words>   exact and keyword search over BaniDB', '');
    write('  ang <number>     read the first lines of an ang', '');
    write('  clear            clear the console', '');
    write('  help             this list', '');
    write('Typing a word without a command runs search.', 'log-dim');
    write('No answers are generated. Results are sources only.', 'log-dim');
  }

  function execute(raw) {
    var value = raw.trim();
    if (!value) {
      return;
    }
    history.push(value);
    historyIndex = history.length;

    var match = value.match(/^([a-z]+)\s*(.*)$/i);
    var command = match ? match[1].toLowerCase() : '';
    var rest = match ? match[2].trim() : value;

    if (command === 'help' || command === '?') {
      help();
    } else if (command === 'clear') {
      log.textContent = '';
    } else if (command === 'ang') {
      runAng(rest);
    } else if (command === 'search') {
      if (!rest) {
        write('Usage: search <words>', 'log-dim');
      } else {
        runSearch(rest);
      }
    } else if (/^\d+$/.test(value)) {
      write('For an ang, type: ang ' + value, 'log-dim');
    } else {
      runSearch(value);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = input.value;
    input.value = '';
    execute(value);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = historyIndex === history.length ? '' : history[historyIndex];
    }
  });

  write('taksal console 0.1', 'log-accent');
  write('Source: BaniDB. Exact and keyword search only.', 'log-dim');
  write('Type help for commands.', 'log-dim');
})();
