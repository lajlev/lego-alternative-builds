# 10698 Build Lab

A tiny webapp for engaging with alternative build instructions for the LEGO® set
**10698-1 – Large Creative Brick Box**. 62 alternative builds catalogued so far,
every one buildable from just that one box. Builds sold as paid ("PRO")
instructions on Rebrickable are excluded — everything here has free instructions
(local PDF, a Rebrickable free download, or a YouTube build video).

## Ways to engage

| View | What it does |
| --- | --- |
| **Random** | Picks one alternative model at random ("your build for today"). Shuffle again with the button or the <kbd>R</kbd> key. |
| **Browse** | Every catalogued build in a grid. Sort by name, part count, designer, type or a random order; filter by complexity, type, designer and instruction format (they combine). Click any render to view it full screen. Your last sort + filters are remembered. |
| **Christmas calendar** | *Coming soon.* A 24-door festive calendar with a live countdown to 1 December. |

## Running it

No build step, no dependencies. Either:

- **Open `index.html` directly** in a browser — works because build data is mirrored into `data.js`.
- **Or serve the folder** (needed if you want `data.json` fetched instead, or nicer URLs):
  ```
  python3 -m http.server 8712
  # then open http://localhost:8712/
  ```

## Files

```
index.html        markup + shell
styles.css        all styling (light/dark aware)
app.js            hash router + the three views
data.json         source of truth for the build catalogue (50 builds)
data.js           generated mirror of data.json (loaded by the page)
build-data.mjs    run `node build-data.mjs` after editing data.json
builds/           per-build image.(png|jpg) + optional instructions.pdf
assets/           shared images (10698-1 set box render for the footer)
```

## Adding a build

1. Drop `image.png` (and `instructions.pdf` if you have one) into `builds/10698-<slug>/`.
2. Add an entry to `data.json` (`instructions` = local PDF path or `null`;
   `instructions_url` = video / mirror / Rebrickable link).
3. `node build-data.mjs`

## Instruction PDFs

29 of 62 builds ship a local `instructions.pdf` (every BrickBrush build plus a
handful of others); the rest fall back to a link (`instructions_url` — a
Rebrickable MOC page with a free download, or a YouTube build video for two).

- **BrickBrush** builds — the designer hosts PDFs at `byteorbit.de/lego/models/`,
  so they were pulled directly with `curl` (no auth). The filename doesn't always
  match the model name (e.g. *Fall* → `graveyard.pdf`, *Pine Beach* → `pines.pdf`);
  the real target is the redirect behind the MOC page's "View Building Instructions".
- **Everyone else** — Rebrickable serves free MOC PDFs through short-lived signed
  URLs on the Cloudflare-protected domain. `curl` can't reach them (403) and the
  browser extension can't trigger or capture the download, so these can't be
  automated from here. Fetch them by hand:

  ```
  node import-downloaded-pdfs.mjs --list     # prints the MOC pages to open
  # open each, click the free "Download" button (files land in ~/Downloads
  # named MOC-<id>_<designer>_<name>.pdf) — skip any that are PRO / paid
  node import-downloaded-pdfs.mjs            # files them into builds/ + data.json
  ```

## Bulk-collecting builds from Rebrickable

The catalogue is expanded by browsing Rebrickable with the **Claude in Chrome**
extension (<https://claude.ai/chrome>) rather than scraping — the public site sits
behind Cloudflare (plain `curl` gets a 403) and there is no API key in this repo.
The extension drives the real, logged-in browser, so it sees everything you do.

Method actually used for the current 50:

1. Install the extension and sign in to claude.ai with the same account as Claude
   Code. Sign in to Rebrickable in that same Chrome profile.
2. Open the set page and its **Alt Builds** tab:
   `https://rebrickable.com/sets/10698-1/large-creative-brick-box/` → *Alt Builds*
   (`#tab_alt_builds`). That tab lists every MOC buildable from 10698 alone
   (~375). Each card gives name, designer and the MOC slug/id.
3. For each chosen MOC, a **same-origin `fetch('/mocs/MOC-<id>/')`** from the page
   context (authenticated, no Cloudflare challenge) yields the exact part count
   and the `og:description`. Rebrickable rate-limits after ~20 rapid requests
   (HTTP 429) — space them out (~1.5–2 s) and retry the stragglers.
4. Images come from the CDN, which is **not** Cloudflare-gated and works with
   plain `curl`:
   - full-res original: `https://cdn.rebrickable.com/media/mocs/moc-<id>.jpg`
   - sized thumb: `https://cdn.rebrickable.com/media/thumbs/mocs/moc-<id>.jpg/1000x800p.jpg`
   Saved as `builds/10698-<slug>/image.<png|jpg>` (the "original" keeps whatever
   format the designer uploaded, so detect it with `file` rather than assuming).
5. Entries are written with `instructions: null` and `instructions_url` = the MOC
   page (most MOC PDFs need a logged-in browser session to download, so they stay
   as links). `type` is hand-assigned from the model name
   (Building / Vehicle / Scene / Model / Animal).
6. `node build-data.mjs` refreshes `data.js`.

Notes:

- The `javascript_tool` result channel blocks output that looks like a bulk URL /
  cookie dump, so extraction code should return plain values (ids, counts, slugs)
  — never raw HTML or lists of full `href`s.
- The set-box render in the footer is `assets/10698-1.jpg`, pulled from
  `https://cdn.rebrickable.com/media/thumbs/sets/10698-1/…/1000x800p.jpg`.

Renders and instructions belong to their creators (via Rebrickable). Not affiliated
with the LEGO Group.
