# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free lunar calendar: plain HTML, Sass-authored CSS, ES6, no framework, no package manager. Final project for a CodersLab Front-End course. The calendar's "month" is a real astronomical lunation (new moon to new moon, ~29.5 days), not a Gregorian month — see README.md for the full rationale.

## Running / testing

There is no package.json, linter, or test suite in this repo.

- Open `index.html` directly in a browser, or serve it: `python3 -m http.server 8000` then visit `http://localhost:8000`. This needs no build step — `css/styles.css` is compiled and committed, and `index.html` links that, not `scss/`.
- A Sass compile step is only needed if you edit `scss/*.scss` (see README.md "Sass" for the recompile command and the mixin/placeholder/map conventions used there).
- Verify changes manually in a browser — there is no automated test to run instead.

## Architecture

Six scripts loaded via plain `<script>` tags in `index.html`, in this exact order — **order matters**, since each file attaches its API to a `window` global and later files consume earlier globals synchronously at load/init time:

1. `js/moon.js` → `window.MoonCalc` — pure astronomy, no DOM code. Sun/Moon position (Schlyter low-precision formulas), phase/illumination/zodiac, and moonrise/moonset (Meeus threshold altitude). Also finds exact new-moon instants via Newton's method root-solving on signed Sun–Moon elongation (`getLunationBounds`), and numbers lunations per Meeus's convention (Lunation 0 = 2000-01-06 new moon).
2. `js/moondraw.js` → `window.drawMoonIcon(canvas, illumination, waxing, opts?)` — renders a moon-phase disc via a terminator ellipse; no dependency on the other modules.
3. `js/zodiac.js` → `window.ZodiacLore.getInfo(signName)` and `window.drawConstellation(canvas, signName, opts?)` — per-sign element/modality/classical-ruler/trait lookup, plus a simplified stick-figure constellation drawn on canvas (same `Object.assign(defaults, opts)` shape as `drawMoonIcon`, but colors are always passed in by the caller rather than hardcoded per-theme, since `app.js` already knows the current theme). No dependency on the other modules.
4. `js/share.js` → `window.MoonShare` — encodes/decodes `{date, lat, lon, locName}` to/from URL query params (`?y=&m=&d=&lat=&lon=&loc=`), plus Web Share API with clipboard fallback.
5. `js/calendar.js` → `window.MoonCalendar` — builds the lunation grid DOM from a passed-in state object (Monday-first weeks, 5–6 weeks depending on lunation length). Holds no state of its own; reports clicks back via an `onSelect` callback. Depends on `MoonCalc` and `drawMoonIcon`.
6. `js/app.js` — entry point and only stateful module. Owns `state` (`selectedDate`, `today`, `lat`, `lon`, `locName`), wires all DOM event listeners, and re-derives everything (grid, detail panel, URL) from `state.selectedDate` on every change. Depends on all modules above. Also owns `theme` — a separate variable, not part of `state`, since it's a display preference persisted to `localStorage` rather than part of the shareable URL.

**`applyTheme()` / TDZ gotcha**: `applyTheme()` itself never calls `renderDetail()` — it only sets the `data-theme` attribute and the toggle button's label. `renderDetail()` reads the closured `currentBounds` variable, which is declared (`let currentBounds = null;`) *after* `applyTheme(theme)`'s initial call at load time; calling `renderDetail()` from inside `applyTheme()` would hit `currentBounds` while still in its temporal dead zone and throw on every page load. The theme-toggle click handler calls `applyTheme(next)` then `renderDetail()` as two separate statements instead — safe there because the page's initial `renderAll()` has already run once by the time a click can happen. Keep this split if you touch either function.

There is no Gregorian "current month" concept anywhere — which lunation is displayed is always derived on demand from `state.selectedDate` via `MoonCalc.getLunationBounds()`. Prev/Next lunation navigation (`changeLunation` in `app.js`) walks to the neighboring lunation's calendar-day boundary rather than adding a fixed offset, because new-moon instants land at arbitrary times of day.

**Local-noon convention**: lunation membership for a given calendar day is always decided by evaluating at that day's local noon (`atNoon()` in `calendar.js`, replicated inline in `app.js`'s `renderDetail`). This keeps grid cells, the title/subtitle, and the detail panel consistent about which lunation a day near a new-moon boundary belongs to — don't introduce a second convention (e.g. midnight) in new code that touches lunation boundaries.

Astronomical formulas, accuracy notes, and sources are documented as comments at the top of `js/moon.js` itself — read them before modifying anything in that file.

**Theming**: every themeable color is a CSS custom property, defined in two identically-keyed Sass maps (`$classic-theme`, `$qabbalah-theme` in `scss/settings/_colors.scss`) that `main.scss` `@each`-loops into `:root` and `[data-theme="qabbalah"]` respectively. Switching themes is just toggling that attribute on `<html>` — no recompiling. Three places cooperate: the inline `<script>` in `index.html`'s `<head>` applies the saved theme pre-paint (avoids a flash on reload), `js/app.js` owns the toggle button and writes to `localStorage`, `scss/main.scss` + the maps own the actual colors. Add a themeable color by adding the same key to both maps — anything already written as `var(--that-key)` in the SCSS picks it up automatically.

## Repo notes

- `docs/superpowers/specs/2026-08-17-react-rewrite-qabbalah-theme-design.md` is an approved but **not yet implemented** design for a v3 rewrite (React + Sass via Vite, a richer "Qabbalah" theme, per-day journal). The *palette-swap* half of that idea (two CSS-custom-property themes) is already built in the current vanilla app — see "Theming" above; what's still unbuilt is the React/Vite rewrite itself and the journal feature. It describes a `src/` tree that doesn't exist yet — the architecture above (`js/`, plain `<script>` tags, no build step) is what's actually in the repo today. Don't treat that spec as current-state documentation; consult it only when picking up that rewrite.
- `docs/superpowers/plans/2026-08-17-react-sass-qabbalah-rewrite.md` is the step-by-step implementation plan for that same rewrite.
- The rewrite has its own git worktree: `.claude/worktrees/v3-react-sass-qabbalah` (branch `worktree-v3-react-sass-qabbalah`, locked). Do rewrite work there, not on `main` — `git worktree list` shows it. **Out of scope for the exam brief** — the exam covers modules 01–05 (Advanced HTML & CSS, Sass & RWD, JavaScript, ES6), not React; don't treat the rewrite as required or as blocking submission.
