/* Thin client for the BaniDB v2 API. Endpoint shapes are documented in SOURCES.md. */
window.TaksalBaniDB = (function () {
  'use strict';

  var BASE = 'https://api.banidb.com/v2';
  var DEFAULT_TIMEOUT = 15000;

  function errorMessage(data) {
    if (!data) {
      return '';
    }
    if (typeof data.data === 'string') {
      return data.data;
    }
    if (data.data && typeof data.data.error === 'string') {
      return data.data.error;
    }
    if (typeof data.error === 'string') {
      return data.error;
    }
    return data.message || '';
  }

  async function get(path, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || DEFAULT_TIMEOUT);

    var response;
    try {
      response = await fetch(BASE + path, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') {
        throw new Error('BaniDB did not answer in time.');
      }
      throw new Error('Could not reach BaniDB. Check your connection.');
    }
    clearTimeout(timer);

    var data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('BaniDB returned a response that is not JSON (HTTP ' + response.status + ').');
    }

    if (!response.ok) {
      throw new Error(errorMessage(data) || 'BaniDB returned HTTP ' + response.status + '.');
    }
    if (data && data.error) {
      throw new Error(errorMessage(data) || 'BaniDB returned an error.');
    }
    return data;
  }

  return {
    base: BASE,

    getAng: function (ang, source) {
      var path = '/angs/' + encodeURIComponent(ang);
      if (source) {
        path += '/' + encodeURIComponent(source);
      }
      return get(path);
    },

    getHukamnama: function () {
      return get('/hukamnamas/today');
    },

    getSources: function () {
      return get('/sources');
    },

    /**
     * opts: { type, gurmukhi, source, page, results }
     * searchtype: 0 first letter start, 1 first letter anywhere,
     * 2 full word Gurmukhi, 3 full word English, 4 romanized,
     * 5 ang, 6 main letters, 7 first letters English, 8 omni.
     */
    search: function (query, opts) {
      var options = opts || {};
      var params = [];
      if (options.type !== undefined && options.type !== null) {
        params.push('searchtype=' + encodeURIComponent(options.type));
      }
      if (options.gurmukhi) {
        params.push('isGurmukhi=1');
      }
      if (options.source) {
        params.push('source=' + encodeURIComponent(options.source));
      }
      if (options.page) {
        params.push('page=' + encodeURIComponent(options.page));
      }
      if (options.results) {
        params.push('results=' + encodeURIComponent(options.results));
      }
      var path = '/search/' + encodeURIComponent(query);
      if (params.length) {
        path += '?' + params.join('&');
      }
      return get(path);
    }
  };
})();
