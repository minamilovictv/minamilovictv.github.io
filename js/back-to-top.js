/* ============================================================
   back-to-top.js  ·  WBF floating "back to top" control
   ============================================================

   Injected on every page by nav.js. Appears once the visitor has
   scrolled past roughly one screen, returns them to the top, and
   steps up out of the way when the footer comes into view so it
   never sits on top of footer content or a cookie notice.

   Styles live in css/site-chrome.css (.wbf-top).
   ============================================================ */
(function () {
  'use strict';
  if (window.__wbfTopInit) return;

  var SHOW_AFTER = 600;      /* px scrolled before the button appears */
  var GAP        = 24;       /* clearance kept above the footer      */

  function init() {
    if (window.__wbfTopInit) return;
    window.__wbfTopInit = true;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wbf-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<line x1="12" y1="19" x2="12" y2="6"/>' +
        '<polyline points="6,12 12,6 18,12"/>' +
      '</svg>';
    document.body.appendChild(btn);

    var still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
      /* Move focus somewhere sensible for keyboard and screen-reader users. */
      var target = document.querySelector('main, #main, .nb') || document.body;
      if (target) {
        var hadIndex = target.hasAttribute('tabindex');
        if (!hadIndex) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (!hadIndex) target.removeAttribute('tabindex');
      }
    });

    /* Park the button above the footer instead of over it. The footer is
       injected asynchronously on most pages, so look it up lazily. */
    var footer = null;
    function getFooter() {
      if (!footer) footer = document.querySelector('footer.footer, footer');
      return footer;
    }
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      btn.classList.toggle('is-visible', y > SHOW_AFTER);

      var lift = 0;
      var ft = getFooter();
      if (ft) {
        var top = ft.getBoundingClientRect().top;
        var overlap = window.innerHeight - top;
        if (overlap > 0) lift = overlap;
      }
      btn.style.bottom = (GAP + Math.max(0, lift)) + 'px';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
