# Procurement notices

`procurement.csv` drives <https://westernbalkansfund.org/procurement.html>.
Add a row to publish a tender; the page picks it up on the next deploy.

## Columns

| Column      | Required | Notes |
|-------------|----------|-------|
| `id`        | yes | Short slug, unique. Used for the deep link `procurement.html?notice=<id>`. |
| `reference` | yes | Official tender reference, e.g. `WBF/2026/RFQ-004`. |
| `title`     | yes | Notice title, sentence case. |
| `type`      | no  | `goods`, `services`, `works` or `consultancy`. |
| `status`    | no  | `open`, `closed`, `awarded` or `cancelled`. Leave blank to derive it from the deadline. |
| `published` | no  | `YYYY-MM-DD`. |
| `deadline`  | yes | `YYYY-MM-DD` or `YYYY-MM-DD HH:MM` (Central European Time). |
| `summary`   | no  | One or two plain sentences. Wrap in double quotes if it contains a comma. |
| `fileUrl`   | no  | Dossier filename placed in this folder, e.g. `wbf-2026-rfq-004.pdf`. A full `https://` URL also works. |
| `resultUrl` | no  | Award notice or result document, same rules as `fileUrl`. |

## Two rules worth knowing

1. **The deadline wins.** A notice whose deadline has passed is shown as
   closed even if `status` still says `open`, so a forgotten row can never
   invite an offer that can no longer be accepted. Set `status` to `awarded`
   or `cancelled` when you need to override that.
2. **An empty file is fine.** With only the header row the page shows
   "No open tenders at the moment". There are deliberately no sample rows,
   so the page can never display a tender that does not exist.

## Example row

```csv
id,reference,title,type,status,published,deadline,summary,fileUrl,resultUrl
audit-2026,WBF/2026/RFQ-004,External audit of the 2026 financial statements,services,,2026-09-01,2026-09-30,"Selection of an audit firm to review the Fund's 2026 financial statements.",wbf-2026-rfq-004.pdf,
```

Put the dossier PDF in this folder and reference it by filename only.
