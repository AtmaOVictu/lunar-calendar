# Lunar Calendar

A workable, interactive lunar calendar built in plain **HTML, CSS and vanilla ES6 JavaScript** — no frameworks, no build step, no dependencies. Final/exam project for the CodersLab Front-End course (Break 2 — individual work), covering the material from modules 01–05 (Advanced HTML & CSS, Sass & RWD, JavaScript, ES6): course home — https://lms.coderslab.si/course/ONL_FER_O_06

## Live demo

Once deployed to GitHub Pages (steps below), the working site is at:

```
https://<your-github-username>.github.io/<repo-name>/
```

Until then, open `index.html` directly in any browser — it's fully static, no server required.

## What makes this an actual *lunar* calendar

This is not a Gregorian calendar with moon icons pasted on it. The grid's "month" is a **lunation** — new moon to new moon, ~29.5 days — computed astronomically, not the 1st–30th of a Gregorian month:

- Each lunation is found by root-solving for the exact moment the Sun–Moon elongation crosses 0° (Newton's method on `js/moon.js`'s position formulas), so month boundaries land on real new moons, not approximations.
- Months are numbered as **Lunation #N**, following Jean Meeus's convention (Lunation 0 = the new moon of 2000 January 6). This is a real, citable numbering system, not invented for this project.
- Every day cell's primary number is its **day within that lunation** (1 through 29 or 30); the Gregorian date is kept as a small secondary label, because real life still runs on it.
- "Previous / Next" navigate by lunation, not by Gregorian month — the button jumps to the neighboring 29-or-30-day cycle, wherever it happens to fall.
- The lunation's title also names the zodiac sign the Sun occupies at that new moon (e.g. "New Moon in Leo") — the traditional way lunar calendars label months.

## Other features

- Click any day for a detail panel: phase name, illumination %, day-of-lunation, moon age, zodiac sign (of the Moon), distance from Earth, moonrise and moonset for a chosen location.
- Jump to any date directly, or "Today" to return to the lunation containing today.
- Location input (latitude/longitude/name) or "Use my location" via the Geolocation API — moonrise/moonset recompute for wherever you are.
- **Share this view**: builds a URL that encodes the selected date and location (`?y=&m=&d=&lat=&lon=&loc=`), uses the Web Share API on supported devices or copies the link to the clipboard otherwise. Opening a shared link reproduces the exact same view and re-derives the correct lunation from it — this is how the examiner (or anyone) can be sent a specific date/place without you being present.
- **Theme toggle**: "Classic" (cool navy) and "Qabbalah" (warm olive/gold) — every themeable color is a CSS custom property, so the toggle just flips a `data-theme` attribute on `<html>`. The choice is saved to `localStorage` and applied by a small inline script in `<head>` before first paint, so reloading never flashes the other theme.
- Fully responsive (mobile phone through desktop).

## How it works / where to look

| File | What it does |
|---|---|
| `index.html` | Page structure/markup only. |
| `scss/` | Sass source for all styling — variables, partials, nesting, mixins, placeholders (see "Sass" below). |
| `css/styles.css` | Compiled from `scss/`, and what `index.html` actually links. Custom properties, Grid layout, `clamp()` fluid type, media queries for RWD. |
| `js/moon.js` | The astronomy: Sun/Moon position, phase, illumination, zodiac sign, moonrise/moonset. Pure functions, no DOM code. Formulas and sources are documented at the top of the file (Paul Schlyter's public-domain low-precision algorithms, plus Meeus for the rise/set threshold altitude). |
| `js/moondraw.js` | Draws a moon-phase disc on a `<canvas>` from an illumination fraction — the geometry (terminator ellipse) is explained in comments. |
| `js/calendar.js` | Builds the month grid DOM from a state object. No global state of its own. |
| `js/share.js` | Encodes/decodes view state to/from the URL query string; Web Share API + clipboard fallback. |
| `js/app.js` | Entry point — owns state, wires up all the event listeners, calls the modules above. |

No build tools, no npm install needed to run it — that's deliberate, so the examiner can just open the file or the GitHub Pages URL. The compiled `css/styles.css` is committed, so this holds even though the styles are authored in Sass.

## Sass

The stylesheet is authored in Sass (`scss/`), organized the way the course taught it — `settings/` (variables), `tools/` (mixins/functions), `generic/` (reset), `elements/` (component partials), all pulled together by `main.scss`:

- **Variables & partials** — `settings/_colors.scss`, `settings/_variables.scss`, one file per UI area, `@import`ed from `main.scss`.
- **Nesting** — `&:hover`, `&.selected`, media queries nested inside the selector they affect.
- **Mixins + `@content`** — `respond-min($width)` / `respond-max($width)` in `tools/_mixins.scss` wrap a breakpoint so each call site supplies its own overrides.
- **Placeholders + `@extend`** — `%panel` in `elements/_placeholders.scss` holds the shared card look for `.calendar-wrap` and `.detail-panel`.
- **Maps + `@each`** — `$classic-theme` / `$qabbalah-theme` in `settings/_colors.scss` are identically-keyed color maps; `main.scss` `@each`es over one into `:root` and the other into `[data-theme="qabbalah"]`, so both themes come from the same loop. `$input-widths` in `settings/_variables.scss` does the same for the per-`input[type]` width rules in `elements/_controls.scss`.
- **Functions** — `spacing($multiplier)` in `tools/_mixins.scss` returns a value on the project's 4px grid.
- **Interpolation** — Sass variables/map values are written into CSS custom properties (`--#{$key}: #{$value};`) in `main.scss`, so the design tokens are both Sass-time values and runtime-swappable CSS custom properties — which is what makes the theme toggle (see "Other features") a pure attribute flip with no recompiling.

To recompile after editing `.scss` files (needs [Dart Sass](https://sass-lang.com/dart-sass/) — `npm install -g sass`, or `npx sass`):

```bash
sass --style=expanded --no-source-map scss/main.scss css/styles.css
```

## Accuracy note

The astronomical formulas are the standard "low precision" series (Schlyter / Meeus), accurate to roughly a few arc-minutes for phase/position and a few minutes of time for rise/set — correct for a calendar app, not for navigation. This is documented in the code rather than hidden.

## Running locally

No install needed. Either:

- Double-click `index.html`, or
- From this folder: `python3 -m http.server 8000` then open `http://localhost:8000`

## Deploying to GitHub Pages (so the examiner can open a live link)

Run these from inside this project folder:

```bash
git init                     # skip if already a repo
git add .
git commit -m "Lunar calendar final project"
```

1. On GitHub, create a new **empty** repository (no README/license, you already have one) — e.g. `lunar-calendar`.
2. Connect and push:

```bash
git remote add origin https://github.com/<your-username>/lunar-calendar.git
git branch -M main
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. Wait ~1 minute, then your site is live at:
   `https://<your-username>.github.io/lunar-calendar/`

Send that URL to the examiner, or use the app's own **"Share this view"** button to send a link to a specific date/location once it's live.

## License / attribution

Astronomical algorithms adapted from public-domain sources (Paul Schlyter, "How to compute planetary positions"; Jean Meeus, *Astronomical Algorithms*). All code in this repository is original.
