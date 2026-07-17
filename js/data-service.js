/* ============================================================
   data-service.js  ·  WBFData — singleton content data service
   ============================================================

   Single source of truth for content data across the WBF site.
   Pages don't fetch or parse content themselves — they call:

       const items = await WBFData.news.all();
       WBFNewsCard.renderGrid(items, host);

   Loaded once per page via:

       <script src="../js/data-service.js"></script>

   Design notes
   ------------
   * One IIFE, no globals besides `window.WBFData`.
   * In-memory cache with a 5-minute TTL. Concurrent callers
     share a single in-flight promise — at most ONE network
     request per feed per session.
   * Feed registry: each feed (news, events, projects, …) is
     registered with `registerFeed(name, url, normalizer)` so
     additional feeds can be added without changing the core.
   * Source format is inferred from URL extension. Today only
     CSV is wired up (parsed with the same lightweight parser
     used by news.html previously). JSON support is in place
     via the same loader: `*.json` URLs are auto-detected and
     `res.json()` is called instead of CSV parsing.
   * Dev fallback: when `location.hostname` is `localhost` or
     `127.0.0.1` AND the live fetch fails, `SAMPLE_NEWS` keeps
     the page usable. In production the rejection bubbles up
     so pages can call `WBFNewsCard.renderError(host)`.

   Canonical news item schema (returned by every news.* method)
   ------------------------------------------------------------
       {
         id, title, slug, type, programme, date,
         excerpt, content,
         featuredImage,
         galleryImages: string[],   // arrays, NOT pipe-joined
         galleryVideos: string[],
         attachments:   string[],
         downloadUrl, externalUrl,
         status                     // lower-cased
       }
   ============================================================ */
(function () {
  'use strict';
  if (window.WBFData && window.WBFData._initialized) return;

  /* ──────────────────────────────────────────────────────────
     1. CONFIG  (swap URLs here when sources change)
     ────────────────────────────────────────────────────────── */
  const NEWS_FEED_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ13GJKPShUi8FZlRGKmj821e1YrCeLrnHJ0BDMdFmGTeVZa8iX0DKZJwQiKdHrW_gk0PApvqf3WhVl/pub?output=csv';

  const CACHE_TTL_MS = 5 * 60 * 1000;   // 5 minutes

  const IS_DEV = typeof location !== 'undefined' &&
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  /* ──────────────────────────────────────────────────────────
     2. DEV SAMPLE DATA
     Migrated verbatim from html/news.html so the page still
     works offline / when the sheet is unreachable.
     ────────────────────────────────────────────────────────── */
  const SAMPLE_NEWS = [
    {
      id: 'ggi-call-9-opens',
      title: 'GGI Call No. 9 opens for applications — €15,000 grants for regional cooperation',
      slug: 'ggi-call-9-opens',
      type: 'open-call',
      programme: 'GGI Grants',
      date: '2026-06-14',
      excerpt: 'The Western Balkans Fund announces the opening of the ninth call under the Good Governance and Integration scheme, supporting civil society, cultural and educational projects across WB6.',
      content: '<p>The Western Balkans Fund is pleased to announce the opening of <strong>GGI Call No. 9</strong> — the ninth call under the Good Governance and Integration grants scheme.</p><h3>Who can apply</h3><ul><li>Registered civil society organizations</li><li>Cultural institutions and museums</li><li>Universities and research institutes</li><li>Local government bodies (in partnership)</li></ul><h3>Key dates</h3><p>The call opens on <strong>14 June 2026</strong> and closes on <strong>15 September 2026</strong> at 17:00 CET.</p><p>For full eligibility criteria, partnership requirements and application guidelines, please consult the <a href="grants-how-to-apply.html">How to Apply</a> page or download the call documentation below.</p>',
      coverImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80|https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80|https://images.unsplash.com/photo-1573164574511-73c773193279?w=1200&q=80',
      galleryVideos: '',
      attachments: 'GGI-Call-9-Guidelines.pdf|Application-Form-2026.docx',
      downloadUrl: '#',
      externalUrl: 'https://ogms.westernbalkansfund.org/',
      status: 'published'
    },
    {
      id: 'visegrad-fellowship-3rd',
      title: 'Visegrad Fellowship — 3rd Edition opens to WB6 researchers',
      slug: 'visegrad-fellowship-3rd',
      type: 'announcement',
      programme: 'Visegrad Fellowship',
      date: '2026-06-10',
      excerpt: 'Doctoral students and graduates invited to apply for mobility grants in partnership with the International Visegrad Fund.',
      content: '<p>In partnership with the International Visegrad Fund, WBF is launching the third edition of the Visegrad Fellowship — supporting doctoral students and recent graduates from the Western Balkans connecting with V4 countries.</p><p>Fellows will spend up to 12 months at a host institution in the Czech Republic, Hungary, Poland, or Slovakia.</p>',
      coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
      galleryVideos: '',
      attachments: '',
      downloadUrl: '',
      externalUrl: '',
      status: 'published'
    },
    {
      id: 'cross-border-youth-network',
      title: 'How a cross-border youth network reconnected three Balkan cities',
      slug: 'cross-border-youth-network',
      type: 'story',
      programme: 'GGI Grants',
      date: '2026-06-05',
      excerpt: 'A grantee story from GGI Call No. 7 — three CSOs share lessons from a year of regional cooperation.',
      content: '<p>When three organizations from Sarajevo, Pristina and Skopje came together in 2024, none of them had collaborated across borders before. One year later, they have built a youth exchange network reaching more than 400 young people.</p><h3>Lessons learned</h3><ul><li>Start with shared values, not shared budgets</li><li>Invest in trust-building before activities</li><li>Document everything for future cohorts</li></ul>',
      coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80|https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      galleryVideos: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      attachments: '',
      downloadUrl: '',
      externalUrl: '',
      status: 'published'
    },
    {
      id: 'leadbalkans-2026-highlights',
      title: 'LeadBalkans 2026: Highlights from the regional advocacy forum',
      slug: 'leadbalkans-2026-highlights',
      type: 'event-recap',
      programme: 'LeadBalkans',
      date: '2026-05-28',
      excerpt: 'Photos, speakers and key takeaways from the third edition of the LeadBalkans platform in Tirana.',
      content: '<p>More than 200 civil society leaders, policymakers and donors gathered in Tirana for the third edition of LeadBalkans.</p><h3>Key takeaways</h3><ol><li>Regional cooperation needs predictable, multi-year funding</li><li>Youth-led organizations remain under-resourced</li><li>Donors should align reporting requirements</li></ol>',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80|https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80|https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80|https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
      galleryVideos: '',
      attachments: 'LeadBalkans-2026-Report.pdf',
      downloadUrl: '#',
      externalUrl: '',
      status: 'published'
    },
    {
      id: 'annual-report-2025',
      title: 'WBF Annual Report 2025 — Now available',
      slug: 'annual-report-2025',
      type: 'publication',
      programme: 'Institutional',
      date: '2026-05-20',
      excerpt: 'Our full account of grants disbursed, projects supported, and regional impact achieved in 2025 is now available for download.',
      content: '<p>The Western Balkans Fund Annual Report 2025 is now available. The report covers all grants disbursed, projects supported, partner activities and financial statements for the past year.</p>',
      coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
      galleryVideos: '',
      attachments: 'WBF-Annual-Report-2025.pdf|Financial-Statements-2025.pdf',
      downloadUrl: '#',
      externalUrl: '',
      status: 'published'
    },
    {
      id: 'press-eu-renewal-2026',
      title: 'Joint statement: EU renews multi-year support for WBF through IPA III',
      slug: 'press-eu-renewal-2026',
      type: 'press-release',
      programme: 'Institutional',
      date: '2026-05-12',
      excerpt: 'The European Union and the Western Balkans Fund have signed a renewed cooperation agreement under IPA III, ensuring continuity of regional grants through 2028.',
      content: '<p>Tirana — The European Union and the Western Balkans Fund today signed a renewed multi-year cooperation agreement under the Instrument for Pre-accession Assistance (IPA III), securing continuity of regional grants through 2028.</p><blockquote>This renewal is a vote of confidence in regional ownership of cooperation in the Western Balkans.</blockquote>',
      coverImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
      galleryImages: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
      galleryVideos: '',
      attachments: '',
      downloadUrl: '',
      externalUrl: 'https://ec.europa.eu/',
      status: 'published'
    }
  ];

  /* ──────────────────────────────────────────────────────────
     3. UTILITIES
     ────────────────────────────────────────────────────────── */
  function pipeSplit(value) {
    if (value == null || value === '') return [];
    if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
    return String(value).split('|').map(s => s.trim()).filter(Boolean);
  }

  function normalizeType(t) {
    if (!t) return '';
    const k = String(t).trim().toLowerCase().replace(/\s+/g, '-');
    if (k === 'call-for-applications' || k === 'opencall' || k === 'call') return 'open-call';
    return k;
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  /* CSV parser — handles quoted fields with commas / newlines.
     Same shape as the inline parser previously in news.html. */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* ignore */ }
        else { field += c; }
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).filter(r => r.some(v => v && v.trim())).map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = (r[i] || '').trim());
      return obj;
    });
  }

  /* ──────────────────────────────────────────────────────────
     4. NORMALIZATION LAYER
     Maps raw CSV/JSON rows to the canonical schema.

     Live Google Sheet columns (observed from production code
     parsing this exact sheet):
        id, title, type, programme, date, excerpt, content,
        featured, status,
        coverImage, galleryImages, galleryVideos,
        attachments, downloadUrl, externalUrl

     The sheet does NOT have a `slug` column today, so we
     fall back: slug ← id ← slugify(title).
     The sheet uses `coverImage`; we alias it to `featuredImage`
     in the canonical output.
     ────────────────────────────────────────────────────────── */
  function mapNewsRow(row) {
    const title  = (row.title || '').trim();
    const rawId  = (row.id || '').trim();
    const rawSlug = (row.slug || '').trim();   // future-proofing
    const id     = rawId || rawSlug || slugify(title);
    const slug   = rawSlug || rawId || slugify(title);

    const featuredImage = (row.featuredImage || row.coverImage || '').trim();

    return {
      id,
      title,
      slug,
      type:           normalizeType(row.type),
      programme:      (row.programme || '').trim(),
      date:           (row.date || '').trim(),
      excerpt:        (row.excerpt || '').trim(),
      content:        row.content || '',
      featuredImage,
      galleryImages:  pipeSplit(row.galleryImages),
      galleryVideos:  pipeSplit(row.galleryVideos),
      attachments:    pipeSplit(row.attachments),
      downloadUrl:    (row.downloadUrl || '').trim(),
      externalUrl:    (row.externalUrl || '').trim(),
      status:         (row.status || '').trim().toLowerCase()
    };
  }

  function normalizeNews(rawRows) {
    return rawRows
      .map(mapNewsRow)
      /* Drop drafts AND rows with blank status (per spec). */
      .filter(item => item.status && item.status !== 'draft')
      /* Sort by date desc; rows without a date sink to the bottom. */
      .sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return bd - ad;
      });
  }

  /* ──────────────────────────────────────────────────────────
     5. RAW LOADER  (CSV today, JSON-ready)
     Format dispatch is by URL extension. Anything not ending
     in .json is treated as CSV.
     ────────────────────────────────────────────────────────── */
  function isJsonUrl(url) {
    const path = String(url).split('?')[0].split('#')[0];
    return /\.json$/i.test(path);
  }

  async function loadRaw(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    if (isJsonUrl(url)) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.items || data.rows || []);
    }
    const text = await res.text();
    return parseCSV(text);
  }

  /* ──────────────────────────────────────────────────────────
     6. FEED REGISTRY  +  CACHE
     Each registered feed is an object:
        { url, normalizer, devFallback?,
          cache, cacheAt, inflight }
     The public API for a feed (`all`, `byId`, etc.) is
     generated by `buildFeedApi`. Adding events / projects is
     just another `registerFeed(...)` call.
     ────────────────────────────────────────────────────────── */
  const FEEDS = Object.create(null);

  async function fetchFeed(feed) {
    const now = Date.now();

    /* TTL hit */
    if (feed.cache && (now - feed.cacheAt) < CACHE_TTL_MS) {
      return feed.cache;
    }
    /* Coalesce concurrent callers onto a single in-flight promise */
    if (feed.inflight) return feed.inflight;

    feed.inflight = (async () => {
      try {
        const raw = await loadRaw(feed.url);
        const items = feed.normalizer(raw);
        feed.cache = items;
        feed.cacheAt = Date.now();
        return items;
      } catch (err) {
        /* Dev-only graceful degradation */
        if (IS_DEV && feed.devFallback) {
          console.warn('[WBFData] live fetch failed, using dev fallback for "' + feed.name + '":', err);
          const items = feed.normalizer(feed.devFallback);
          feed.cache = items;
          feed.cacheAt = Date.now();
          return items;
        }
        /* Production: bubble up so pages can render an error state */
        console.error('[WBFData] feed "' + feed.name + '" failed:', err);
        throw err;
      } finally {
        feed.inflight = null;
      }
    })();

    return feed.inflight;
  }

  function buildFeedApi(feed) {
    return {
      all:         () => fetchFeed(feed),
      byProgramme: async (p) => {
        const items = await fetchFeed(feed);
        const target = String(p || '').trim();
        return items.filter(i => (i.programme || '') === target);
      },
      byType:      async (t) => {
        const items = await fetchFeed(feed);
        const target = normalizeType(t);
        return items.filter(i => i.type === target);
      },
      latest:      async (n) => {
        const items = await fetchFeed(feed);
        return items.slice(0, Math.max(0, n | 0) || items.length);
      },
      byId:        async (id) => {
        const items = await fetchFeed(feed);
        const target = String(id);
        return items.find(i => String(i.id) === target || String(i.slug) === target) || null;
      },
      /* Escape hatches — useful for refresh buttons / tests */
      refresh:     () => { feed.cache = null; feed.cacheAt = 0; return fetchFeed(feed); }
    };
  }

  function registerFeed(name, url, normalizer, opts) {
    if (!name || !url || typeof normalizer !== 'function') {
      throw new Error('registerFeed(name, url, normalizer) — invalid arguments');
    }
    const feed = {
      name,
      url,
      normalizer,
      devFallback: (opts && opts.devFallback) || null,
      cache: null,
      cacheAt: 0,
      inflight: null
    };
    FEEDS[name] = feed;
    window.WBFData[name] = buildFeedApi(feed);
    return window.WBFData[name];
  }

  /* ──────────────────────────────────────────────────────────
     7. PUBLIC NAMESPACE
     ────────────────────────────────────────────────────────── */
  window.WBFData = {
    _initialized: true,
    _registerFeed: registerFeed,
    /* Exposed so future feeds can reuse shared helpers */
    _utils: { parseCSV, pipeSplit, normalizeType, slugify }
  };

  /* Register the news feed. Additional feeds (events,
     projects, …) plug in via the same mechanism:

       WBFData._registerFeed('events', EVENTS_URL, normalizeEvents);
  */
  registerFeed('news', NEWS_FEED_URL, normalizeNews, { devFallback: SAMPLE_NEWS });
})();
