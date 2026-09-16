# Berlin Process

This folder holds only `berlin-process-logo.png`, used in the heading of the
**WBF and the Berlin Process** tab on `about/index.html` (`#berlin-process`).

## Milestone photos

The photos beside the milestone text are **not stored here**. They are
hotlinked from the WBF Flickr account, the same way `past-events` does it:

| Milestone     | Photos | Collage                                             |
|---------------|--------|-----------------------------------------------------|
| London 2025   | 3      | two landscapes stacked, one portrait beside them    |
| Sofia 2020    | none   | text only                                           |
| Poznań 2019   | 4      | small 2x2, held to the height of the text           |

To swap a photo, replace the `src=""` of its `<img>` in `about/index.html`
and update its `alt` text to describe the new picture. Use Flickr's `_c`
(800px) or `_z` (640px) size.

The layouts are built for these exact counts and shapes. The London one
expects its third photo to be a portrait (`is-tall`). Adding or removing a
photo means changing the collage's `bp-collage--three` / `bp-collage--four`
class, so ask for the layout to be adjusted rather than just adding an `<img>`.
