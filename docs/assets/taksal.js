/* Shared page behaviour: history arrows and the commentary tag toggles. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var buttons = document.querySelectorAll('[data-hist]');
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener('click', function (event) {
        var dir = event.currentTarget.getAttribute('data-hist');
        if (dir === 'back') {
          history.back();
        } else {
          history.forward();
        }
      });
    }

    var tags = document.querySelectorAll('.persp-tag');
    for (var j = 0; j < tags.length; j += 1) {
      tags[j].addEventListener('click', function (event) {
        var tag = event.currentTarget;
        var on = tag.getAttribute('aria-pressed') === 'true';
        tag.setAttribute('aria-pressed', on ? 'false' : 'true');
      });
    }
  });
})();
