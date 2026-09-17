# global-monetary-systems-site

Marketing and companion website for the **Global Monetary Systems** mobile app (iOS +
Android), served via GitHub Pages. Purpose, design rationale, and what to work on next are
recorded in the app repo's own docs and in global memory — see "Related" below; this README
only covers the site's own structure and deploy mechanics.

## Structure

| Path | Page |
|------|------|
| `index.html` | Home — hero, real app screenshots, layer/Pro explainer, feature grid, glossary + signals teasers, store links |
| `explore/` | The 20-module map (mirrors the app's Explore tab), with real page titles as teasers |
| `glossary/` | All 100 glossary terms, Essentials definitions only, searchable — generated from the app's own `content/glossary.yaml` |
| `signals/` | A periodic snapshot of the same live official series (ECB/World Bank/BIS) the app fetches |
| `flows/` | **"How Money Actually Moves"** — an interactive D3 network diagram of IMF/World Bank/BIS/Treasury/Fed/central banks/SWIFT/correspondent banks/RTGS systems, with a 5-step simulation of a real cross-border payment. The site's first "larger-screen visualization" (`DESIGN.md` §21's future-direction item) — see `assets/js/flows.js` |
| `about/` | Mission, the three-layer model, Pro, sourcing policy, on-device AI |
| `privacy/` | Privacy policy (mirrors `privacy-globalmonetarysystems.html` on equalinformation.com) |
| `disclaimer/` | "Explains, never advises" — not financial/legal/investment advice |
| `support/` | Contact + FAQ + live store-status notice |
| `assets/css/style.css` | Palette and type copied literally from `nutrisize-health-site`: clinical blue + green, self-hosted Inter (`assets/fonts/`) |
| `assets/img/screens/` | Real submission screenshots, copied from `release-ops/global-monetary-systems/store-assets/screenshots-ios-phone/` |
| `assets/data/*.json` | Generated data (glossary, live-series snapshot) — see "Keeping content in sync" below |
| `scripts/` | The two sync scripts that regenerate `assets/data/*.json` from the app repo |

Plain static HTML/CSS/vanilla JS, no build step — one deliberate exception: `flows/` loads
D3.js from jsdelivr (`assets/js/flows.js`) as a plain `<script>` tag, still no bundler. Edit,
commit, push to `main`; GitHub Pages deploys automatically.

## Keeping content in sync with the app

This site is a **digital twin**, not an independent copy — its factual content (glossary
terms, live-series values) is generated from the app repo's own canonical data, not
hand-transcribed, so the two never drift silently out of sync.

```
python3 scripts/sync_glossary.py   # re-reads ../../pvt/global-monetary-systems/content/glossary.yaml
python3 scripts/sync_signals.py    # re-reads content/series/registry.yaml + snapshot.json (needs pyyaml)
```

Both scripts assume the app repo is checked out at `~/coding_common/pvt/global-monetary-systems`
(true on Bhim's machines). Only the `essentials` (free, in-app) definition of each glossary
term is ever published here — Applied/Research text is Pro-only and must never be copied to
this public site. Re-run `sync_glossary.py` whenever the app's glossary grows (currently 100
terms); re-run `sync_signals.py` after `python3 content/fetch_snapshot.py` in the app repo.

The `explore/` module teasers and the home page's stats/copy are hand-curated, not generated —
update them manually when the app's page count, module map, or store-listing status changes
materially (check the app repo's `CLAUDE.md` status line and `release-ops/global-monetary-systems/README.md`).

## One-time GitHub Pages setup

1. **GitHub → repo Settings → Pages**: Source = `main` branch, `/ (root)`. Done — Pages is
   enabled and building.
2. No dedicated custom domain yet — "Global Monetary Systems" is still a working title
   (`CLAUDE.md` in the app repo; `docs/RECIPES.md` has the rename procedure). Because this
   repo has no `CNAME` of its own, it automatically inherits `bpupadhyaya.github.io`'s
   custom domain, so it's live at
   **https://equalinformation.com/global-monetary-systems-site/** (also reachable, via
   redirect, at **https://bpupadhyaya.github.io/global-monetary-systems-site/**) — same
   pattern as `global-intelligence-site`. All internal links are relative, so a dedicated
   custom domain can be added later (a `CNAME` file + DNS, same pattern as
   `nutrisize-health-site`) without breaking anything.

## Store links

The app is submitted for review on both stores (2026-09-16/17) but not yet live, so the home
page's App Store / Google Play badges are currently **non-clickable, styled as pending** with
an explicit "in review" note — not links to store pages that don't exist yet. Once each
listing goes live, wire the badges to the real URLs (see `release-ops/global-monetary-systems/README.md`
for IDs) in `index.html`'s `.store-buttons.pending` block and drop the `pending` class/note.

## Related

- App repo (canonical docs, content, source of truth for everything on this site):
  `~/coding_common/pvt/global-monetary-systems/`
- Release ops (store status, real screenshots, signing): `~/coding_common/pvt/release-ops/global-monetary-systems/`
- Existing per-app pages on the umbrella site (store-listing URLs point here today):
  https://bpupadhyaya.github.io/privacy-globalmonetarysystems.html,
  `app-support-globalmonetarysystems.html`, `support-globalmonetarysystems.html`
- Reference site for this project's visual system and structure: `~/coding_common/os/nutrisize-health-site`
- The strategy behind this site (why it exists, what stays app-exclusive, and what's next)
  is documented in the app repo's own private docs, not here — see that repo's `CLAUDE.md`
  "Cross-repo context" section.
