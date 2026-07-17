# Funded Projects — how to add & edit projects

The **Funded Projects** page (`html/projects.html`) is driven entirely by one file in this
folder: **`projects.csv`**. Edit that file and the website updates — no code changes needed.

Everything lives in this folder (`assets/projects/`):

- `projects.csv` — the list of projects (one row = one project)
- image files you upload (optional — you can also use links to photos already online)

---

## How to add a new project (the whole workflow)

1. **Open `projects.csv` in Excel** (double-click it, or in Excel: File → Open).
2. **Add one new row** at the bottom. Fill in the columns (see the table below).
3. **Save it back as CSV**: File → Save As → *CSV (Comma delimited) (\*.csv)*. Keep the name
   `projects.csv`. If Excel warns "some features may be lost" — that's fine, click **Yes/Keep**.
4. **Upload photos** for the project (only if you're using your own image files — see *Images* below).
5. **Upload the updated `projects.csv` and any photos to GitHub** into this same folder.
   (On github.com: open this folder → *Add file → Upload files* → drag them in → *Commit changes*.)

That's it. The live page refreshes with the new project.

> **Tip:** copy one of the example rows and change the values — it's the safest way to keep
> the format correct.

---

## The columns

| Column | Required? | What to write |
|---|---|---|
| `id` | **Yes** | A short unique code, lowercase, words joined by hyphens. E.g. `youth-bridges-balkans`. No spaces, no punctuation. This becomes the project's link. |
| `title` | **Yes** | The project name, as it should appear. |
| `status` | **Yes** | One of exactly: `ongoing`, `completed`, `suspended`. |
| `programme` | **Yes** | Which WBF programme funded it. Use one of the names in the list below — spell it the same way every time. |
| `countries` | **Yes** | Country codes, separated by the `|` bar. Codes: `AL` Albania, `BA` Bosnia & Herzegovina, `XK` Kosovo, `MK` North Macedonia, `ME` Montenegro, `RS` Serbia. E.g. `AL|XK|MK`. |
| `startDate` | optional | Format `YYYY-MM-DD`, e.g. `2025-09-01`. |
| `endDate` | optional | Format `YYYY-MM-DD`. Leave blank if ongoing/open-ended. |
| `grantAmount` | optional | Just the number, no € sign and no thousands separators. E.g. `14800`. |
| `currency` | optional | `EUR` or `USD`. Defaults to EUR if blank. |
| `implementingOrganization` | recommended | The lead organisation's name. |
| `partners` | optional | Partner organisations, separated by `|`. E.g. `Youth Action Kosova\|Skopje Youth Forum`. |
| `shortDescription` | **Yes** | 1–2 sentences. Shown on the card and used for search. |
| `fullDescription` | optional | The long description shown in the pop-up. **Plain text only** — no HTML. For a new paragraph, press **Alt+Enter** inside the cell to make a blank line. |
| `coverImage` | recommended | The main photo — a filename or a link (see *Images*). |
| `galleryImages` | optional | Extra photos for the pop-up gallery, separated by `|`. |
| `websiteUrl` | optional | Full link to the project's own website, if any. |
| `downloadUrl` | optional | Full link to a report/PDF to download, if any. |
| `callRound` | optional | e.g. `7th Call`. |

### Programme names (use these exact spellings)

- `GGI Grants`
- `Gender Equality Fund`
- `Visegrad Fellowship`
- `Regional Academy`
- `P2P`
- `MOVE`

The programme filter buttons on the page are built automatically from whatever you type here,
so consistent spelling matters — `GGI Grants` and `GGI grants` would create two separate buttons.

---

## Images — two ways, and you can mix them

**A) Upload your own photo file**
Put the image in this folder, then write **just the file name** in the cell:

```
coverImage
youth-bridges-cover.jpg
```

The page automatically finds it in this folder. (If you'd rather keep things tidy, you can make a
sub-folder per project and write `youth-bridges/cover.jpg` — that works too.)

**B) Use a photo already online**
Paste the **full web link** (starts with `http`) into the cell:

```
coverImage
https://westernbalkansfund.org/media/some-photo.jpg
```

For `galleryImages`, list several the same way, separated by `|`:

```
photo1.jpg|photo2.jpg|https://example.org/photo3.jpg
```

Use good-sized landscape photos (around 1200px wide) for the best look.

---

## Rules of thumb / gotchas

- **Don't rename or delete the header row** (the first line with the column names).
- **Keep `id` unique** — two projects with the same `id` will clash.
- Fields that contain a comma (like a title) are automatically wrapped in quotes by Excel — leave that alone.
- To temporarily hide a project, delete its row (keep a backup) — there is no "hidden" flag yet; ask if you'd like one added.
- Always **Save As CSV**, not as `.xlsx`. The website can only read the `.csv` file.
