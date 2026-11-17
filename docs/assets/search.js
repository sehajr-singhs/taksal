// Client-side search index for Taksal using Lunr.js
// This creates a search index over the library entries and Gurbani text

(function () {
  'use strict';

  // Wait for the library to be loaded
  function initSearch() {
    // Check if we're on the library page
    if (!document.querySelector('.lib-list')) {
      return;
    }

    // Create the Lunr index
    var idx;

    // Build the index from library data if available
    function buildIndex() {
      var entries = [];

      // Try to get library entries from the page
      var libEntries = document.querySelectorAll('.lib-entry');

      if (libEntries.length > 0) {
        libEntries.forEach(function(entry) {
          var title = entry.querySelector('.lib-title');
          var meta = entry.querySelector('.lib-meta');

          if (title) {
            entries.push({
              title: title.textContent,
              meta: meta ? meta.textContent : '',
              path: window.location.pathname
            });
          }
        });
      }

      // If no entries found on this page, use the sources
      if (entries.length === 0) {
        // Search over sources.json entries
        // This is a simple indexed approach
        return null;
      }

      try {
        idx = lunr(function () {
          this.field('title');
          this.field('meta');
          this.ref('path');

          entries.forEach(function(entry) {
            this.addDoc(entry);
          });
        });
        return idx;
      } catch (e) {
        console.log('Lunr not available or error building index:', e);
        return null;
      }
    }

    // Perform a search
    function performSearch(query) {
      if (!idx) {
        // Fallback: simple text matching
        var results = [];
        var allText = document.body.innerText || '';

        // Simple case-insensitive matching
        var regex = new RegExp(query.replace(/[.*+?^${}()|[\]\]/g, '\$&'), 'i');
        if (regex.test(allText)) {
          results.push({
            match: 'Found in page content',
            snippet: 'Contains the search term'
          });
        }
        return results;
      }

      try {
        var results = idx.search(query);
        return results.map(function(r) {
          return {
            title: r.metadata ? r.metadata.title : 'Entry',
            path: r.ref
          };
        });
      } catch (e) {
        console.log('Search error:', e);
        return [];
      }
    }

    // Create search UI
    function createSearchUI() {
      var container = document.createElement('div');
      container.style.padding = '12px 0';
      container.style.borderBottom = '1px solid var(--line)';
      container.style.marginBottom = '12px';

      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search all texts...';
      input.style.width = '100%';
      input.style.padding = '6px 10px';
      input.style.fontSize = '12px';
      input.style.border = '1px solid var(--line)';
      input.style.background = 'var(--paper)';
      input.style.color = 'var(--ink)';

      var resultsDiv = document.createElement('div');
      resultsDiv.style.marginTop = '8px';
      resultsDiv.style.maxHeight = '200px';
      resultsDiv.style.overflowY = 'auto';
      resultsDiv.style.fontSize = '12px';
      resultsDiv.style.color = 'var(--muted)';

      input.addEventListener('input', function() {
        var query = this.value.trim();
        if (!query) {
          resultsDiv.innerHTML = '';
          return;
        }

        var results = performSearch(query);

        if (results.length === 0) {
          resultsDiv.innerHTML = '<div>No results found</div>';
          return;
        }

        resultsDiv.innerHTML = '';
        results.slice(0, 10).forEach(function(result) {
          var div = document.createElement('div');
          div.textContent = result.title || 'Result';
          div.style.padding = '4px 6px';
          div.style.cursor = 'pointer';
          div.style.margin = '2px 0';
          div.style.borderRadius = '3px';
          div.addEventListener('click', function() {
            // Navigate to the result
            if (result.path && result.path !== window.location.pathname) {
              window.location.href = result.path;
            }
          });
          resultsDiv.appendChild(div);
        });
      });

      container.appendChild(input);
      container.appendChild(resultsDiv);

      // Insert after the lib-count
      var libCount = document.querySelector('.lib-count');
      if (libCount && libCount.parentNode) {
        libCount.parentNode.insertBefore(container, libCount.nextSibling);
      } else {
        var libList = document.querySelector('.lib-list');
        if (libList && libList.parentNode) {
          libList.parentNode.insertBefore(container, libList);
        } else {
          var main = document.querySelector('main');
          if (main) {
            main.insertBefore(container, main.firstChild);
          }
        }
      }
    }

    // Initialize
    var idx = buildIndex();
    createSearchUI();
  }

  // Check if Lunr is available, if not, load it
  if (typeof lunr === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/lunrjs/2.3.3/lunr.min.js';
    script.onload = initSearch;
    script.onerror = initSearch; // Try to init even if Lunr fails (fallback search)
    document.head.appendChild(script);
  } else {
    initSearch();
  }
})();
