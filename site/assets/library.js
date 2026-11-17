/* Renders the library catalog from window.TAKSAL_LIBRARY (data/library.json at build time). */
(function () {
  'use strict';

  var list = document.querySelector('[data-library]');
  var count = document.querySelector('[data-library-count]');
  var works = window.TAKSAL_LIBRARY || [];
  if (!list) {
    return;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  if (count) {
    count.textContent = works.length + (works.length === 1 ? ' work' : ' works');
  }

  works.forEach(function (work) {
    var entry = el('article', 'lib-entry');

    var main = el('div', 'lib-main');
    main.appendChild(el('h2', 'lib-title', work.title));

    var metaBits = [work.author, work.year, work.language, work.type].filter(Boolean);
    main.appendChild(el('p', 'lib-meta', metaBits.join(' · ')));

    if (work.note) {
      main.appendChild(el('p', 'lib-note', work.note));
    }
    entry.appendChild(main);

    var side = el('div', 'lib-side');
    var isPublic = String(work.copyright || '').toLowerCase() === 'public domain';
    side.appendChild(el('span', 'badge ' + (isPublic ? 'badge-pd' : 'badge-ic'), work.copyright || 'status unknown'));

    if (work.link) {
      var link = el('a', 'lib-link', work.linkLabel || 'Open');
      link.href = work.link;
      if (/^https?:/i.test(work.link)) {
        link.rel = 'noopener';
      }
      side.appendChild(link);
    } else {
      side.appendChild(el('span', 'lib-pending', 'Link pending (TODO)'));
    }

    entry.appendChild(side);
    list.appendChild(entry);
  });

  if (!works.length) {
    list.appendChild(el('p', 'muted', 'The catalog could not be loaded.'));
  }
})();
