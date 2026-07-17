# Western Balkans Fund website

The public website for the Western Balkans Fund (WBF), live at
[westernbalkansfund.org](https://westernbalkansfund.org).

This document is written so someone new to the project can maintain it from a cold
start. Read it top to bottom once before making changes.

---

## 1. Stack (what this is, and is not)

- **Plain static HTML.** Every page is a self-contained `.html` file: markup, a
  `<style>` block, and inline `<script>`. There is **no framework, no build step, no
  bundler, no server, no database.**
- **No dependencies to install.** You do not run `npm install`. You edit HTML/CSS/JS
  files directly and push.
- **Hosting:** GitHub Pages, serving the repository root, mapped to the custom domain
  `westernbalkansfund.org`.
- **The only third-party code** in the repo is the bundled PDF.js viewer under
  `assets/js/pdfjs/`. Fonts (Inter) are loaded from Google Fonts at runtime.

Because there is no build step, **what you see in the files is exactly what ships.**

---

## 2. Folder structure

Everything sits at the repository root (this is also the deploy root, which is why all
internal paths are absolute, e.g. `/css/tokens.css`).

```
/
├── index.html, about.html, ggi.html, ...   All pages, flat at the root
├── assets/
│   ├── img/            Logos + og-default.png (social share image)
│   ├── images/         Photos, organised by section (team/, partners/, gefund/, ...)
│   ├── projects/       projects.csv (data for projects.html)
│   ├── documents/      PDFs + documents.csv (see "Large PDFs" below)
│   └── js/pdfjs/       Bundled PDF.js viewer
├── css/
│   ├── tokens.css      Design tokens (colours, type, spacing). Loaded FIRST.
│   └── site-chrome.css Shared navbar + footer styling
├── js/
│   ├── nav.js          Mobile nav drawer + dropdown/keyboard behaviour
│   └── data-service.js CSV/news helper (used by news.html)
├── components/
│   ├── _MASTER_navbar.html    Global navigation (fetched at runtime)
│   ├── _MASTER_footer.html    Global footer (fetched at runtime)
│   ├── _MASTER_head_links.html  Reference template for <head> (see note below)
│   └── news-card.html, news-modal.html  News fragments
├── favicon.svg, favicon-16.png, favicon-32.png, apple-touch-icon.png,
│   icon-192.png, icon-512.png, safari-pinned-tab.svg, site.webmanifest
├── sitemap.xml, robots.txt
├── .nojekyll           Tells GitHub Pages NOT to run Jekyll (so the _MASTER_ files serve)
└── README.md
```

> **Note on `_MASTER_head_links.html`:** this is a *copy-paste reference* for `<head>`
> boilerplate (SEO meta, JSON-LD). It is not fetched by pages. If you change it, you must
> paste the change into pages by hand. The navbar and footer components, by contrast, ARE
> fetched live (next section).

---

## 3. How the shared navbar and footer work

To avoid copying the navbar and footer into 26 pages, each page fetches them at runtime.

Every page contains:

```html
<div id="navbar-placeholder"></div>
<script>
  fetch('/components/_MASTER_navbar.html')
    .then(r => r.ok ? r.text() : '')
    .then(html => { document.getElementById('navbar-placeholder').innerHTML = html;
      var s = document.createElement('script'); s.src = '/js/nav.js'; document.body.appendChild(s); });
</script>
```

…and the same pattern for the footer with `/components/_MASTER_footer.html`.

**Consequences you must remember:**

- To change the navigation or footer **site-wide, edit the ONE component file** in
  `components/`. Do not edit nav/footer markup inside individual pages.
- The fetch uses an **absolute path** (`/components/...`), so it works from every page.
- This only works over **http/https** (i.e. a real server or GitHub Pages). Opening a page
  by double-clicking the file (`file://`) will show the page **without** nav/footer,
  because browsers block `fetch()` on `file://`. To preview locally, run a tiny static
  server from the repo root (any static server works) and open `http://localhost:...`.

---

## 4. CSV-driven content pages

Some pages render their content from a CSV instead of hard-coded HTML, so non-developers
can update them. These pages: `projects.html`, `about-team.html`,
`about-accountability.html`, `about-careers.html`, `events.html`.

Each has a `CSV_URL` constant near the top of its inline `<script>`, plus a `SAMPLE_DATA`
array used as a fallback.

- If `CSV_URL` points at a **local file** committed in the repo (e.g.
  `projects.html` → `/assets/projects/projects.csv`), edit that CSV and push.
- If `CSV_URL` is a **published Google Sheet CSV URL**, edit the sheet, no push needed.
- If `CSV_URL` is **empty (`''`)**, the page shows the built-in `SAMPLE_DATA` (placeholder
  content). Leaving it empty in production means visitors see sample data, so fill it in.

**To make a page editable via Google Sheets:**

1. Build a sheet whose header row matches the columns documented in that page's `<script>`
   comment (each CSV page lists its exact columns).
2. In Google Sheets: `File → Share → Publish to web → (select the sheet) → CSV`.
3. Paste the published URL into that page's `CSV_URL`.

> A published sheet is publicly readable. Only put publishable data in it.

---

## 5. Design system rules

The visual language lives in `css/tokens.css` (colours, type scale, spacing, shadows).
Consume tokens with `var(--token)`; do not hard-code brand values in pages.

**Brand rules (apply to all new content):**

- **Navy `#173D8F`** is the primary brand colour.
  *Maintainer note:* `tokens.css` currently defines `--navy: #1A3668`. If `#173D8F` is
  the correct brand navy, update `--navy` in `tokens.css` in one place (do not change it
  per page). This is unresolved, confirm before changing.
- **Type:** Inter for body, Poppins for display/headings.
  *Maintainer note:* the code currently uses Inter for both (`--font-sans` and
  `--font-display`). Introduce Poppins by changing `--font-display` in `tokens.css` and
  adding the font to the page `<head>` font load, in one place.
- **Sentence case** for headings, buttons, and labels (not Title Case, not ALL CAPS).
- **No em dashes anywhere.** Use commas, colons, or rewrite the sentence.
- **"Contracting Parties"** is always capitalised.
- **Kosovo** must always carry the UNSCR 1244 footnote wherever it is named as a
  territory or state.
- **No flag emojis** anywhere in content.

---

## 6. How to add a new page

1. Copy an existing simple page (e.g. `contact.html`) to `/newpage.html`.
2. Update the `<title>`, `<meta name="description">`, and the `og:`/canonical values in
   `<head>`.
3. Keep the `navbar-placeholder` and `footer-placeholder` divs and their fetch scripts.
4. Add a link to the page in `components/_MASTER_navbar.html` (and the footer if relevant).
   Use an absolute path: `href="/newpage.html"`.
5. Add the page URL to `sitemap.xml`.

All internal links and asset references must be **absolute** (`/about.html`,
`/assets/...`, `/css/...`), never relative (`../` or bare `about.html`).

---

## 7. How to update team photos

- Save each photo as `/assets/img/team/firstname-lastname.jpg` (lowercase, hyphenated).
- In the team data source (the `about-team.html` CSV, or its `SAMPLE_DATA` while the CSV
  is empty), set each member's `photo` field to
  `/assets/img/team/firstname-lastname.jpg`.
- If a member has **no photo**, leave `photo` empty: the card shows their initials.
- **Important:** the avatar image has no automatic fallback, so add the photo file and set
  the `photo` path together. A `photo` path pointing at a missing file shows a broken
  image, not initials.

Team member profiles are simple cards (name, role, email, LinkedIn). There are no
biography pop-ups.

---

## 8. How to deploy

1. Commit your changes.
2. Push to the `main` branch.
3. GitHub Pages rebuilds and serves the repository root at `westernbalkansfund.org`
   within a minute or two. There is nothing to build.

Notes:
- `.nojekyll` must stay in the repo so GitHub Pages serves the `_MASTER_*.html` component
  files (Jekyll would otherwise ignore files starting with `_`).
- **Large PDFs:** the two oversized annual reports exceed GitHub's 100 MB per-file limit
  and are kept out of git (see `.gitignore`). Compress them (or host them externally and
  point `assets/documents/documents.csv` at the external URLs) before adding them.

---

## 9. Quick reference

| I want to…                        | Edit…                                             |
|-----------------------------------|---------------------------------------------------|
| Change the menu or footer         | `components/_MASTER_navbar.html` / `_MASTER_footer.html` |
| Change a brand colour or the type | `css/tokens.css`                                  |
| Change nav/footer styling         | `css/site-chrome.css`                             |
| Update projects                   | `assets/projects/projects.csv`                    |
| Update the documents library      | `assets/documents/documents.csv`                  |
| Make events editable in a sheet   | set `CSV_URL` in `events.html`                    |
| Add/replace the social share image| `assets/img/og-default.png` (1200×630)            |
| Add a page                        | new `.html` at root + navbar link + sitemap entry |
```
