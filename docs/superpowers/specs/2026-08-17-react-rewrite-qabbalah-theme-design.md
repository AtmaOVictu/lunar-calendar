# Lunar Calendar — React/Sass rewrite + Qabbalah theme + journal — design

Status: approved by user, pending spec review sign-off
Supersedes: nothing (this is the v3 design, built on top of the working v2 lunation-based calendar already committed as `3ac9d31`)

## Goals

1. Rebuild the app's DOM/state layer in React and its stylesheet in Sass, so the project actually demonstrates the full course arc (Advanced HTML/CSS → Sass & RWD → JavaScript → ES6 → React basics), not just vanilla JS/plain CSS.
2. Add a second visual theme ("Qabbalah": green + gold, golden-ratio-informed) alongside the existing look ("Classic"), user-togglable, Qabbalah as default.
3. Add a per-day journal: free-text note, timestamped, geotagged with the app's current observer location, exportable.

Not in scope: leap-month/lunisolar calendar rules, a backend, multi-user accounts, automated tests (none exist today and none were requested).

## Toolchain

- **Vite** (React + Sass template). `npm install`, `npm run dev` for local dev, `npm run build` for the deployable `dist/`.
- Trade-off accepted explicitly by the user: the project can no longer be run by double-clicking `index.html`. `README.md` needs its "Running locally" section rewritten accordingly.
- Node 22 / npm 11 already present on the dev machine — no environment setup needed.

## What ports unchanged vs. what's rewritten

**Ports with only syntax changes** (`window.X = {...}` → `export {...}`), logic untouched:
- `js/moon.js` → `src/lib/moon.js` — astronomy engine, all formulas and the Newton's-method lunation solver stay exactly as documented today.
- `js/moondraw.js` → `src/lib/moondraw.js` — `drawMoonIcon` disc-drawing math, extended with an optional halo-ring parameter for the Qabbalah theme (see Theming).
- `js/share.js` → `src/lib/share.js` — URL encode/decode + Web Share API/clipboard logic, unchanged.

**Rewritten** (currently manual DOM building + `addEventListener` wiring in `js/app.js` + `js/calendar.js`, ~320 lines):
- Becomes the component tree below, state moves from a plain mutable `state` object to React state + hooks.

## Project structure

```
src/
  lib/
    moon.js
    moondraw.js
    share.js
    journal.js          — localStorage read/write/export for journal entries
  hooks/
    useLunarState.js     — selectedDate/today/lat/lon/locName + derived lunation
                            bounds (useMemo on MoonCalc.getLunationBounds),
                            selectDay/changeLunation/setLocation
    useShareUrl.js        — syncs state to the URL on change (replaces app.js's syncURL)
    useTheme.js            — 'classic' | 'qabbalah', persisted to localStorage,
                              applies data-theme attribute to the root element
    useJournal.js           — entries keyed by ISO date, saveEntry(date, text, location), exportAll()
  components/
    App.jsx
    Header.jsx             — title/subtitle, Share button, theme toggle button
    Controls.jsx            — prev/next, date picker, Today, lat/lon/location inputs, geolocation button
    CalendarGrid.jsx         — maps lunation days to DayCell
    DayCell.jsx               — one grid cell (day number, MoonIcon, click handler)
    DetailPanel.jsx            — stats block + MoonIcon + JournalSection
    JournalSection.jsx          — textarea, Save button, saved-metadata line, export link
    MoonIcon.jsx                 — <canvas> wrapper: useRef + useEffect calling drawMoonIcon
    Toast.jsx                     — transient status messages
  styles/
    _variables.scss              — spacing scale (φ-based), non-themed constants
    _themes.scss                  — CSS custom properties per theme, under
                                     [data-theme="classic"] / [data-theme="qabbalah"]
    _mixins.scss                   — e.g. button-base, respond($breakpoint)
    _layout.scss, _calendar.scss, _detail-panel.scss, _responsive.scss
    main.scss                       — @use entry point Vite compiles
```

## State management & data flow

`useLunarState` is the single source of truth, mirroring today's `state` object in `app.js`:

```js
const [selectedDate, setSelectedDate] = useState(initialDate);
const [today] = useState(() => atNoon(new Date()));
const [lat, setLat] = useState(initialLat);
const [lon, setLon] = useState(initialLon);
const [locName, setLocName] = useState(initialLocName);
const bounds = useMemo(() => MoonCalc.getLunationBounds(atNoon(selectedDate)), [selectedDate]);
```

- Initial values come from `MoonShare.readStateFromURL()`, read once on mount.
- `changeLunation(delta)` keeps its exact current logic (walk to the neighboring lunation's calendar-day boundary — pure date math, framework-independent).
- Derived per-render values (`getMoonData`, `getRiseSet`, per-day illumination) computed via `useMemo` in the components that need them, same as today's `renderDetail()` recomputing on every call — not hoisted into state.
- URL sync: a `useEffect` in `App` reacting to `selectedDate`/`lat`/`lon`/`locName`, replacing `app.js`'s manual `syncURL()` calls.
- All existing interactions are preserved 1:1: click a day cell, Prev/Next lunation, date picker jump, Today, lat/lon/location-name inputs, geolocation button, Share button — same behavior, now wired through React event handlers instead of `addEventListener`.

## Theming: Classic vs. Qabbalah

Two presets, toggled via a button in the header (next to Share), cycling on click, persisted to `localStorage` (`useTheme` hook), applied via `data-theme="classic"` / `data-theme="qabbalah"` on the app root. **Qabbalah is the default** for a first-time visitor (no stored preference).

Theme-dependent values are CSS custom properties (not Sass variables, since Sass variables are compile-time-only and can't respond to a runtime toggle) defined per theme in `_themes.scss`:

| Token | Classic | Qabbalah |
|---|---|---|
| `--bg` gradient | `radial-gradient(ellipse at top, #171d3a 0%, #0b0e1a 55%)` | `radial-gradient(ellipse at top, #22281a 0%, #0a0f09 55%)` |
| `--panel` / `--panel-2` | `#12162a` / `#171c33` | `#10160f` / `#151d13` |
| `--border` | `#262c4a` | `#33402b` |
| `--text` | `#eef0fb` (cool white) | `#f0ecdd` (warm white) |
| `--text-dim` | `#9aa0c3` | `#a9b89e` |
| `--accent` (primary / Share button, "selected" ring) | `#e8c766` | `#c9a13b` (Tiphareth gold) |
| `--secondary` ("today" ring, moonrise/set accents) | `#6ea8fe` (blue) | `#6a8f5c` (Netzach sage green) |

Structural tokens that do **not** vary by theme live in `_variables.scss` as real Sass variables: the spacing scale is rebuilt on powers of φ (`$space-1: 0.625rem; $space-2: 1rem; $space-3: 1.618rem; $space-4: 2.618rem;`), and the calendar-grid : detail-panel column ratio is `1.618fr 1fr`.

**Qabbalah-only decorative additions** (both non-interactive, both easy to remove independently if they read as too much once real):
- A faint golden-ratio spiral (SVG, `stroke: var(--accent)`, low opacity) behind the month title.
- A small 7-node Tree-of-Life-style diagram (SVG, gold/green/cream dots and connecting lines) as a footer flourish.

**Moon icon treatment**: `drawMoonIcon` gains an optional `haloColor` param. Classic passes none (today's plain cream/gold disc, unchanged). Qabbalah passes the resolved green secondary color, rendering a thin green ring around every disc — every calendar-grid cell and the detail-panel icon — alongside the existing gold lit-crescent. This is the one visual element shared between every rendered moon regardless of theme (only the halo's presence/color differs).

Note: `<canvas>` fill/stroke styles need literal color strings, not `var(--x)` references — a `fillStyle` of `"var(--secondary)"` silently fails. `useTheme` therefore exports both the CSS-side tokens (applied via `data-theme` for the SCSS-driven DOM) and a plain JS color-constants object for the same two themes, so `MoonIcon` reads its halo color from the hook, not from computed CSS. The two sources must be kept in sync by convention (same hex values in `_themes.scss` and `useTheme.js`) since there's no build-time link between them.

## Journal feature

**Data model** (`src/lib/journal.js`, `localStorage` key `lunar-journal-v1`):
```ts
{
  [isoDate: string]: {
    text: string,
    savedAt: number,       // Date.now() at last save
    lat: number, lon: number, locName: string,  // app's state at save time
  }
}
```

- One entry per calendar day (keyed by the day's ISO date, not by lunation).
- **Explicit Save**, not autosave — a Save button in `JournalSection`, matching the "is fine" response to the mockup that showed an explicit Save button.
- On save: `savedAt = Date.now()`, location = the app's *currently configured* `lat`/`lon`/`locName` (not a fresh device-geolocation read) — this was an explicit choice over live-geolocation-at-write-time, to avoid a second permission prompt and because it naturally pairs "this moon data" with "this configured place."
- Saving again overwrites the entry for that day (single entry per day, no history/versioning) and updates `savedAt`.
- **Export**: a link/button ("⬇ Export all entries") in `JournalSection`, not per-day-scoped — downloads the *entire* `lunar-journal-v1` object as a single JSON file (client-side `Blob` + object URL, no server). This exists specifically because `localStorage`-only storage is one browser-clear away from losing everything.
- Placement: below the existing stats `<dl>` in `DetailPanel`, separated by a divider — the space that was previously empty under the stats block.

## Migration / deployment notes

- `README.md` needs updating: toolchain section, new "Running locally" (`npm install && npm run dev`), architecture table (new file layout), and the "no build tools" framing removed since it's no longer true.
- Deployment (GitHub Pages / other) was intentionally left as a separate, later decision — the user chose "private repo, no live link" for the v2 push; revisit once this rewrite is code-complete, since a build step changes what "deploy" means (needs a build artifact or a CI step, not just "push and flip on Pages").
- No test framework is being introduced as part of this work; verification stays manual-in-browser, same as v1/v2.
