/* ============================================================
   feeds.js  ·  Published-sheet URLs, in one place
   ============================================================

   The same sheet was referenced from several pages, so changing a
   source meant remembering every copy. Pages read from here instead:

       <script src="/js/feeds.js"></script>
       …
       const CSV_URL = window.WBF_FEEDS.events;

   Swapping a source is a one-line edit in this file.

   Each URL is a Google Sheet published to the web as CSV
   (File → Share → Publish to web → Comma-separated values).
   ============================================================ */
(function () {
  'use strict';
  window.WBF_FEEDS = window.WBF_FEEDS || {
    /* News and calls — also drives the homepage preview and site search.
       Read in two halves by js/data-service.js; see the column map there. */
    news:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKUcHa95JJsLTiyuu_4shdv-Oyic1Z2NhTN-PlmtL3pwhPIKIwSnavVieXd4K3894vARwnIeErF5rh/pub?output=csv',

    /* Events — events.html, the homepage's top-three strip, and site search. */
    events:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuA6RB0kC00qvfUU3kU-EMybJGoW-2OuL5DluaHBDyBlcTlK2RVJ3fQhf6wq02hlrG1iQen7jtzCJs/pub?output=csv',

    /* Awarded projects — ourgrantees.html and site search. */
    grantees: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTxr9vnfZWXwU51K1a4DhGj6LGBe9Z8mwCPjDN9zL7MWT0RGi49qPJWkd6FnaXxr6THh0gFkPrt1NC/pub?output=csv'
  };
})();
