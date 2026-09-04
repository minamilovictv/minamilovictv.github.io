/* ============================================================
   nav.js  ·  WBF mobile navigation + accessible dropdowns
   ============================================================

   Self-contained: injects its own CSS, builds the hamburger
   button, and upgrades the hover-only dropdowns to be click,
   touch and keyboard operable (WCAG 2.1.1 / 4.1.2).

   Loaded two ways:
   1. Pages that fetch() the navbar append this script after
      injecting the markup (see the loader snippet in each page).
   2. Pages with an inline navbar load it with <script defer>.

   Requires the _MASTER_navbar.html markup (.nb / .nav-items /
   .dropdown-wrap / .nav-right). Safe to run twice — it bails
   if already initialised.
   ============================================================ */
(function () {
  'use strict';
  if (window.__wbfNavInit) return;

  function init() {
    var nb = document.querySelector('.nb');
    if (!nb) return;                    /* navbar not on page yet */
    if (window.__wbfNavInit) return;
    window.__wbfNavInit = true;

    /* ── 1. Inject styles ──────────────────────────────────── */
    var css = [
      '.nav-toggle{display:none;background:none;border:0;cursor:pointer;padding:10px;margin-left:4px;}',
      '.nav-toggle .bar{display:block;width:22px;height:2px;background:var(--navy,#1A3668);margin:5px 0;border-radius:1px;transition:transform .25s,opacity .25s;}',
      '.nb.nav-open .nav-toggle .bar:nth-child(1){transform:translateY(7px) rotate(45deg);}',
      '.nb.nav-open .nav-toggle .bar:nth-child(2){opacity:0;}',
      '.nb.nav-open .nav-toggle .bar:nth-child(3){transform:translateY(-7px) rotate(-45deg);}',
      /* desktop: click-toggled state mirrors the hover state */
      '.dropdown-wrap.open>.dropdown{display:block!important;}',
      /* Column template MUST match .mega in css/site-chrome.css. */
      '.dropdown-wrap.open>.mega{display:grid!important;grid-template-columns:1.6fr 1fr 1.05fr;}',
      /* Breakpoint MUST match css/site-chrome.css (.nav-items collapse). */
      '@media (max-width:1240px){',
      '  .nav-toggle{display:block;}',
      /* Mobile drawer mirrors the desktop light theme: white surface,
         navy text, navy-fill hover (inherited from .nav-btn:hover). */
      '  .nb.nav-open .nav-items{display:flex!important;flex-direction:column;align-items:stretch;gap:0;transform:none;',
      '    position:fixed;top:72px;left:0;right:0;bottom:0;overflow-y:auto;-webkit-overflow-scrolling:touch;',
      '    background:#fff;padding:8px 12px 40px;z-index:998;}',
      '  .nb.nav-open .nav-items .nav-btn{width:100%;justify-content:space-between;padding:16px 12px;',
      '    font-size:18px;border-bottom:1px solid var(--line,#e2e8f0);border-radius:0;}',
      '  .nb.nav-open .dropdown-wrap{width:100%;}',
      '  .nb.nav-open .dropdown-wrap .dropdown,.nb.nav-open .dropdown-wrap .mega{',
      '    display:none;position:static;width:100%!important;min-width:0;left:auto;box-shadow:none;',
      '    border:0;border-radius:0;background:var(--surface-alt,#f8fafc);padding:4px 0 10px;margin:0;animation:none;}',
      '  .nb.nav-open .dropdown-wrap.open>.dropdown{display:block!important;}',
      '  .nb.nav-open .dropdown-wrap.open>.mega{display:block!important;grid-template-columns:1fr;}',
      '  .nb.nav-open .dd-item,.nb.nav-open .mega-item{padding:12px 14px;}',
      '  .nb.nav-open .mega-col{padding:0;border:0;}',
      /* "Our Programs" mega → clean single-column list matching the other menus */
      '  .nb.nav-open .mega-col-wide .mega-items{grid-template-columns:1fr;column-gap:0;}',
      '  .nb.nav-open .mega-item{min-height:0;border-radius:0;}',
      '  .nb.nav-open .m-title{font-size:15px;font-weight:600;}',
      '  .nb.nav-open .mega-head{padding:12px 14px 4px;margin:0;}',
      '  body.nav-locked{overflow:hidden;}',
      '}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'wbf-nav-css';
    style.textContent = css;
    document.head.appendChild(style);

    /* ── 2. Hamburger button ───────────────────────────────── */
    var right = nb.querySelector('.nav-right') || nb.querySelector('.nb-inner') || nb;
    var toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'primary-nav');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.innerHTML = '<span class="bar" aria-hidden="true"></span><span class="bar" aria-hidden="true"></span><span class="bar" aria-hidden="true"></span>';
    right.appendChild(toggle);

    function setDrawer(open) {
      nb.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-locked', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (!open) closeAllDropdowns();
    }
    toggle.addEventListener('click', function () {
      setDrawer(!nb.classList.contains('nav-open'));
    });

    /* ── 3. Click/keyboard dropdowns ───────────────────────── */
    var wraps = Array.prototype.slice.call(nb.querySelectorAll('.dropdown-wrap'));

    function closeAllDropdowns(except) {
      wraps.forEach(function (w) {
        if (w !== except) {
          w.classList.remove('open');
          var b = w.querySelector('.nav-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    }

    wraps.forEach(function (w) {
      var trigger = w.querySelector('.nav-btn');   /* <button> or <a> (e.g. "Our Programs") */
      if (!trigger) return;
      trigger.addEventListener('click', function (e) {
        /* On desktop a link trigger navigates and the menu opens on hover.
           Inside the mobile drawer there is no hover, so tapping the trigger
           expands its submenu instead of following the link. */
        var inDrawer = nb.classList.contains('nav-open');
        if (trigger.tagName === 'A' && !inDrawer) return;
        e.preventDefault();
        e.stopPropagation();
        var opening = !w.classList.contains('open');
        closeAllDropdowns(w);
        w.classList.toggle('open', opening);
        trigger.setAttribute('aria-expanded', String(opening));
      });
    });

    /* Esc closes menus, then the drawer */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var anyOpen = wraps.some(function (w) { return w.classList.contains('open'); });
      if (anyOpen) { closeAllDropdowns(); }
      else if (nb.classList.contains('nav-open')) { setDrawer(false); toggle.focus(); }
    });

    /* Click outside closes dropdowns */
    document.addEventListener('click', function (e) {
      if (!nb.contains(e.target)) closeAllDropdowns();
    });

    /* Reset drawer state if resized up to desktop */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1200 && nb.classList.contains('nav-open')) setDrawer(false);
    });

    /* ── 4. Mark the current page (aria-current) ───────────── */
    var here = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if (here === '') here = 'index';
    nb.querySelectorAll('[data-page-key]').forEach(function (el) {
      if (el.getAttribute('data-page-key') === here) el.setAttribute('aria-current', 'page');
    });

    /* ── 5. The rest of the shared chrome ──────────────────────
       Every page loads nav.js once the navbar markup is in place,
       so it is also where the other site-wide controls are pulled
       in — no page needs its own script tags for them. */
    ['/js/site-search.js', '/js/back-to-top.js'].forEach(function (src) {
      if (document.querySelector('script[src="' + src + '"]')) return;
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      document.body.appendChild(s);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
