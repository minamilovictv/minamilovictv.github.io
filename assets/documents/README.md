# WBF Important Documents — depository folder

This is the folder that feeds the **WBF Important Documents** page
(`wbfdocuments.html`). Everything on that page is driven by
one file in here: **`documents.csv`**.

There are two things in this folder:

1. **The document files themselves** — the PDFs (and any Word/Excel files).
2. **`documents.csv`** — the list that tells the website which documents
   exist, what to call them, and which file to link to.

---

## How to add a new document

1. **Drop the file into this folder.**
   Put the PDF here, e.g. `annual-report-2024.pdf`.
   Tips for file names: use lowercase letters, dashes instead of spaces,
   and no accents (`annual-report-2024.pdf`, not `Annual Report 2024.pdf`).

2. **Open `documents.csv`** (double-click — it opens in Excel).

3. **Fill in the row** for that document (or add a new row at the bottom).
   Put **just the file name** in the `fileUrl` column — for example
   `annual-report-2024.pdf`. You do **not** need the full web address.

4. **Save the file** (in Excel: keep the format as **CSV UTF-8**).

5. Upload/commit the folder. The document now appears on the page with a
   **Download** button. Until you fill in `fileUrl`, the document shows on
   the page as **"Coming Soon"** — so you can list it before the file is ready.

---

## The columns in `documents.csv`

| Column        | What to put                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `id`          | A short unique code, no spaces (e.g. `annual-2024`). Just keep it unique.    |
| `title`       | The name shown on the page (e.g. `Annual Report 2024`).                      |
| `category`    | One of the categories listed below. Controls the coloured label + filter.   |
| `year`        | The year (e.g. `2024`). Leave blank if not year-specific. Used for sorting.  |
| `fileType`    | Usually `PDF`. Could be `DOCX`, `XLSX`, etc.                                 |
| `fileSize`    | Optional, e.g. `2.1 MB`. Shown as a small detail. Fine to leave blank.       |
| `fileUrl`     | **The file name in this folder** (e.g. `statute.pdf`). Blank = "Coming Soon".|
| `externalUrl` | Use instead of `fileUrl` if the document lives on another website.          |
| `summary`     | One sentence describing the document. If it contains a comma, wrap it in "…".|
| `status`      | `published` to show it. `draft` to hide it from the page.                    |

### Allowed `category` values

- `founding` — Founding & Legal (establishment agreement, seat agreement)
- `governance` — Statute, Rules of Procedure, Financial Regulations
- `strategy` — Strategic plans, annual work programmes
- `annual-report` — Annual reports
- `financial-statement` — Audited financial statements
- `audit-report` — External / independent audit reports
- `joint-action` — EU / WBF joint action reports
- `policy` — Anti-fraud, code of conduct, data protection, procurement
- `guidelines` — Call guidelines, application forms, reporting templates
- `other` — Anything that doesn't fit above

---

## Notes

- To **remove** a document from the page, either delete its row from
  `documents.csv` or set its `status` to `draft`.
- The page already contains a built-in copy of this list as a safety net,
  so it still looks complete even if the CSV can't be read.
- Don't rename `documents.csv` or move it out of this folder — the page
  looks for it here (`assets/documents/documents.csv`).
