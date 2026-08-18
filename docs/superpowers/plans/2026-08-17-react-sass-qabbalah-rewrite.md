# React/Sass Rewrite + Qabbalah Theme + Journal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the vanilla-JS lunation calendar (v2, commit `3ac9d31`) as a Vite + React + Sass app (v3), adding a togglable "Qabbalah" visual theme and a per-day journal feature, so the project demonstrates the full CodersLab course arc (Advanced HTML/CSS → Sass & RWD → JavaScript → ES6 → React).

**Architecture:** All astronomy/drawing/share logic in `js/moon.js`, `js/moondraw.js`, `js/share.js` ports to `src/lib/*.js` as ES modules with only `export` syntax changes — the math is untouched. The DOM-building/state code in `js/app.js` + `js/calendar.js` (`window`-global IIFEs, manual `addEventListener` wiring) is rewritten as a React component tree driven by custom hooks. `css/styles.css` is restructured into Sass partials, with theme-dependent values as CSS custom properties (so a runtime toggle works) and structural spacing as real Sass variables on a golden-ratio (φ) scale.

**Tech Stack:** Vite 5, React 18, Sass (`sass` npm package, Vite's built-in Sass support), no other runtime dependencies. Node 22 / npm 11 (already installed).

**Spec:** `docs/superpowers/specs/2026-08-17-react-rewrite-qabbalah-theme-design.md`

## Global Constraints

- No automated test framework exists in this repo and none is being introduced (confirmed in the spec's "Not in scope"). Every task's verification step is manual: run `npm run dev`, open the printed local URL in a browser, and check the specific behavior listed.
- Qabbalah is the default theme for a first-time visitor (no stored preference) — Classic is the alternate, not the default.
- Theme colors used inside `<canvas>` (`fillStyle`/`strokeStyle`) must be literal hex strings, never `var(--x)` — canvas silently ignores CSS custom property references. `src/hooks/useTheme.js`'s `THEME_COLORS` object is the plain-JS source of truth for canvas colors; `src/styles/_themes.scss` is the CSS-side source of truth for everything else. Keep the hex values identical between the two by convention (spec explicitly calls out there is no build-time link enforcing this).
- Spacing scale is φ-based (`$space-1: 0.625rem; $space-2: 1rem; $space-3: 1.618rem; $space-4: 2.618rem;`) and the calendar-grid : detail-panel column ratio is `1.618fr 1fr` — exact values from the spec's Theming section, not approximations.
- Every existing v2 interaction must keep working identically: click a day cell, Prev/Next lunation, date picker jump, Today, lat/lon/location-name inputs, geolocation button, Share button.
- `npm run dev` must succeed with no console errors at the end of every task — later tasks only ever add to a working app, never leave it broken.

---

## Task 1: Scaffold Vite + React + Sass, remove the legacy static build

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html` (replaces the current static one — Vite owns the root `index.html` as its dev-server entry)
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/main.scss`
- Modify: `.gitignore`
- Delete: `js/app.js`, `js/calendar.js`, `js/moon.js`, `js/moondraw.js`, `js/share.js`, `css/styles.css` (the whole `js/` and `css/` directories become empty and can be removed)

**Interfaces:**
- Produces: a running Vite dev server (`npm run dev`) serving `src/main.jsx` → `src/App.jsx` into `<div id="root">`.

- [ ] **Step 1: Delete the legacy static app**

Delete the `js/` directory (all five files) and the `css/` directory (`styles.css`) entirely — their logic is ported into `src/` starting this task and continuing through Task 3. Do not delete `README.md`, `CLAUDE.md`, or `docs/`.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "lunar-calendar",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "sass": "^1.77.8",
    "vite": "^5.4.1"
  }
}
```

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 4: Create `index.html`** (replaces the old static one — same `<head>` metadata, new `<body>` that hands off to React)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lunar Calendar</title>
<meta name="description" content="An interactive lunar calendar: moon phase, illumination, zodiac sign and moonrise/moonset for any date and location." />
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23161a2b%22/><circle cx=%2265%22 cy=%2245%22 r=%2233%22 fill=%22%23f4ecd8%22/></svg>" />
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/main.scss';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Create `src/App.jsx`** (minimal shell for this task — later tasks replace its body incrementally, ending with the full component tree in Task 13)

```jsx
export default function App() {
  return (
    <div className="app">
      <h1>🌙 Lunar Calendar</h1>
      <p>Vite + React + Sass scaffold running.</p>
    </div>
  );
}
```

- [ ] **Step 7: Create `src/styles/main.scss`** (minimal base — Task 4 replaces this with the full token system)

```scss
* { box-sizing: border-box; }

html { color-scheme: dark; }

body {
  margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  background: #0b0e1a;
  color: #eef0fb;
  min-height: 100vh;
}
```

- [ ] **Step 8: Update `.gitignore`**

Add these lines if not already present:

```
node_modules/
dist/
```

- [ ] **Step 9: Install dependencies and verify**

Run: `npm install`, then `npm run dev`.

Expected: Vite prints a local URL (typically `http://localhost:5173`). Open it — confirm a dark page with the heading "🌙 Lunar Calendar" and the scaffold text, no console errors in devtools.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+Sass toolchain, remove legacy static build"
```

---

## Task 2: Port the astronomy engine (`src/lib/moon.js`)

**Files:**
- Create: `src/lib/moon.js`
- Modify: `src/App.jsx` (temporary verification render — superseded by Task 8's `CalendarGrid`)

**Interfaces:**
- Produces: `getMoonData(date)`, `getRiseSet(localDate, lat, lon)`, `getLunationBounds(date)`, `SYNODIC_MONTH` — same names and signatures as v2's `window.MoonCalc`, now as named exports.

- [ ] **Step 1: Create `src/lib/moon.js`** — logic ported unchanged from `js/moon.js`, only the `window`-global IIFE wrapper and final assignment are replaced with `export`

```js
/*
 * moon.js — self-contained lunar astronomy engine, no dependencies.
 *
 * All formulas are the standard "low precision" planetary position
 * algorithms published by Paul Schlyter, "How to compute planetary
 * positions" (Stjärnhimlen), and Jean Meeus, "Astronomical Algorithms"
 * (rise/set threshold altitude for the Moon, ch. 15). These are the
 * same public-domain formulas behind most small moon-phase/rise-set
 * widgets. Accuracy: phase/illumination within ~0.1–0.2°, position
 * within ~1', rise/set within a few minutes — more than enough for a
 * calendar app, not for navigation.
 */

const RAD = Math.PI / 180;
export const SYNODIC_MONTH = 29.530588853; // days

const norm360 = (deg) => {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
};
const sinD = (deg) => Math.sin(deg * RAD);
const cosD = (deg) => Math.cos(deg * RAD);
const atan2D = (y, x) => Math.atan2(y, x) / RAD;
const asinD = (x) => Math.asin(x) / RAD;

// Julian Date from a JS Date (UTC based, JS Date.getTime() is UTC ms).
function toJD(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Days since 2000-01-01 00:00 UT — the epoch Schlyter's formulas use.
function daysSince2000(date) {
  return toJD(date) - 2451543.5;
}

// --- Sun's position (needed for phase angle) ------------------------
function sunPosition(d) {
  const w = norm360(282.9404 + 4.70935e-5 * d); // longitude of perihelion
  const e = 0.016709 - 1.151e-9 * d; // eccentricity
  const M = norm360(356.047 + 0.9856002585 * d); // mean anomaly
  const oblecl = 23.4393 - 3.563e-7 * d; // obliquity of the ecliptic

  let E = M + (e / RAD) * sinD(M) * (1 + e * cosD(M));
  for (let i = 0; i < 3; i++) {
    const dE = (E - (e / RAD) * sinD(E) - M) / (1 - e * cosD(E));
    E -= dE;
  }
  const x = cosD(E) - e;
  const y = Math.sqrt(1 - e * e) * sinD(E);
  const r = Math.sqrt(x * x + y * y);
  const v = atan2D(y, x);
  const lonSun = norm360(v + w); // true ecliptic longitude of the Sun

  return { M, oblecl, lonSun, r };
}

// --- Moon's position (with the main perturbation terms) -------------
function moonPosition(d, sun) {
  const N = norm360(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = norm360(318.0634 + 0.1643573223 * d);
  const a = 60.2666; // Earth radii
  const e = 0.0549;
  const M = norm360(115.3654 + 13.0649929509 * d);

  let E = M + (e / RAD) * sinD(M) * (1 + e * cosD(M));
  for (let k = 0; k < 4; k++) {
    const dE = (E - (e / RAD) * sinD(E) - M) / (1 - e * cosD(E));
    E -= dE;
  }

  const xv = a * (cosD(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sinD(E));
  const v = atan2D(yv, xv);
  let r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (cosD(N) * cosD(v + w) - sinD(N) * sinD(v + w) * cosD(i));
  const yh = r * (sinD(N) * cosD(v + w) + cosD(N) * sinD(v + w) * cosD(i));
  const zh = r * (sinD(v + w) * sinD(i));

  let lon = atan2D(yh, xh);
  let lat = atan2D(zh, Math.sqrt(xh * xh + yh * yh));

  // Perturbations (Schlyter) — mean anomalies / elongation
  const Ms = sun.M;
  const Mm = M;
  const Lmoon = norm360(N + w + M); // mean longitude of the Moon
  const D = norm360(Lmoon - sun.lonSun); // mean elongation
  const F = norm360(Lmoon - N); // argument of latitude

  lon +=
    -1.274 * sinD(Mm - 2 * D) +
    0.658 * sinD(2 * D) -
    0.186 * sinD(Ms) -
    0.059 * sinD(2 * Mm - 2 * D) -
    0.057 * sinD(Mm - 2 * D + Ms) +
    0.053 * sinD(Mm + 2 * D) +
    0.046 * sinD(2 * D - Ms) +
    0.041 * sinD(Mm - Ms) -
    0.035 * sinD(D) -
    0.031 * sinD(Mm + Ms) -
    0.015 * sinD(2 * F - 2 * D) +
    0.011 * sinD(Mm - 4 * D);

  lat +=
    -0.173 * sinD(F - 2 * D) -
    0.055 * sinD(Mm - F - 2 * D) -
    0.046 * sinD(Mm + F - 2 * D) +
    0.033 * sinD(F + 2 * D) +
    0.017 * sinD(2 * Mm + F);

  r += -0.58 * cosD(Mm - 2 * D) - 0.46 * cosD(2 * D);

  lon = norm360(lon);
  return { lon, lat, r }; // r in Earth radii
}

// Ecliptic -> equatorial (RA/Dec in degrees)
function eclipticToEquatorial(lon, lat, oblecl) {
  const xeq = cosD(lon) * cosD(lat);
  const yeq = sinD(lon) * cosD(lat) * cosD(oblecl) - sinD(lat) * sinD(oblecl);
  const zeq = sinD(lon) * cosD(lat) * sinD(oblecl) + sinD(lat) * cosD(oblecl);
  const ra = norm360(atan2D(yeq, xeq));
  const dec = asinD(zeq);
  return { ra, dec };
}

// Greenwich Mean Sidereal Time in degrees
function gmst(date) {
  const d = toJD(date) - 2451545.0;
  return norm360(280.46061837 + 360.98564736629 * d);
}

// Topocentric altitude (degrees) of an equatorial position at a given
// instant, for an observer at lat/lon (degrees, lon east positive).
function altitudeAt(date, ra, dec, lat, lon) {
  const lst = norm360(gmst(date) + lon);
  let H = norm360(lst - ra);
  if (H > 180) H -= 360;
  const alt = asinD(sinD(lat) * sinD(dec) + cosD(lat) * cosD(dec) * cosD(H));
  return alt;
}

const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function phaseName(elongation) {
  const e = norm360(elongation);
  if (e < 6 || e > 354) return 'New Moon';
  if (e < 84) return 'Waxing Crescent';
  if (e < 96) return 'First Quarter';
  if (e < 174) return 'Waxing Gibbous';
  if (e < 186) return 'Full Moon';
  if (e < 264) return 'Waning Gibbous';
  if (e < 276) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Full lunar data for a given instant.
 * @param {Date} date
 * @returns {{phaseName:string, illumination:number, ageDays:number,
 *   elongation:number, zodiac:string, eclipticLon:number,
 *   distanceKm:number, ra:number, dec:number}}
 */
export function getMoonData(date) {
  const d = daysSince2000(date);
  const sun = sunPosition(d);
  const moon = moonPosition(d, sun);

  const elongation = norm360(moon.lon - sun.lonSun);
  const illumination = (1 - cosD(elongation)) / 2; // 0..1
  const ageDays = (elongation / 360) * SYNODIC_MONTH;
  const zodiacIndex = Math.floor(norm360(moon.lon) / 30);
  const distanceKm = moon.r * 6378.14;

  const eq = eclipticToEquatorial(moon.lon, moon.lat, sun.oblecl);

  return {
    phaseName: phaseName(elongation),
    illumination,
    ageDays,
    elongation,
    zodiac: ZODIAC[zodiacIndex],
    eclipticLon: moon.lon,
    distanceKm,
    ra: eq.ra,
    dec: eq.dec,
    oblecl: sun.oblecl,
  };
}

// --- Lunation (true lunar month) boundaries --------------------------
//
// A lunar calendar's "month" is one lunation: new moon to new moon. To
// find exact new-moon instants we root-find the signed elongation
// (0 at new moon, wrapped to (-180,180]) with Newton's method — the
// elongation increases ~12.19°/day, essentially monotonically near a
// new moon, so this converges in a handful of iterations to well
// under a minute of accuracy.

function elongationSigned(date) {
  const d = daysSince2000(date);
  const sun = sunPosition(d);
  const moon = moonPosition(d, sun);
  let e = norm360(moon.lon - sun.lonSun);
  if (e > 180) e -= 360;
  return e;
}

function newtonZero(startMs) {
  let t = startMs;
  for (let i = 0; i < 10; i++) {
    const g0 = elongationSigned(new Date(t));
    const hMs = 3600000; // 1 hour, for a numerical derivative
    const g1 = elongationSigned(new Date(t + hMs));
    const slope = (g1 - g0) / hMs; // degrees per ms
    if (Math.abs(slope) < 1e-15) break;
    const dt = -g0 / slope;
    t += dt;
    if (Math.abs(dt) < 1000) break; // converged to < 1 second
  }
  return new Date(t);
}

function nearestNewMoonBefore(date) {
  const age = getMoonData(date).ageDays; // ~days since the last new moon
  return newtonZero(date.getTime() - age * 86400000);
}

function nearestNewMoonAfter(date) {
  const before = nearestNewMoonBefore(date);
  let after = newtonZero(before.getTime() + SYNODIC_MONTH * 86400000);
  if (after.getTime() <= date.getTime()) {
    after = newtonZero(after.getTime() + SYNODIC_MONTH * 86400000);
  }
  return after;
}

// Lunation numbering follows Jean Meeus's convention: Lunation 0 is the
// new moon of 2000 January 6 (~18:14 UT). We refine that epoch through
// our own solver rather than hard-coding the exact minute, so the
// numbering is self-consistent with the rest of this engine.
const MEEUS_EPOCH_GUESS = Date.UTC(2000, 0, 6, 18, 14, 0);
let _epochCache = null;
function meeusEpoch() {
  if (!_epochCache) _epochCache = newtonZero(MEEUS_EPOCH_GUESS);
  return _epochCache;
}

/**
 * The lunation (true lunar month) containing `date`.
 * @returns {{start:Date, end:Date, number:number, sunZodiac:string}}
 */
export function getLunationBounds(date) {
  const start = nearestNewMoonBefore(date);
  const end = nearestNewMoonAfter(date);
  const epoch = meeusEpoch();
  const number = Math.round(
    (start.getTime() - epoch.getTime()) / (SYNODIC_MONTH * 86400000)
  );
  const sun = sunPosition(daysSince2000(start));
  const sunZodiac = ZODIAC[Math.floor(norm360(sun.lonSun) / 30)];
  return { start, end, number, sunZodiac };
}

/**
 * Moonrise/moonset for the LOCAL calendar day containing `localDate`
 * (a JS Date interpreted in the browser's local time zone), at the
 * given observer lat/lon (degrees, lon east positive).
 * Scans in 10-minute steps and linearly interpolates the crossing of
 * the standard altitude h0 = 0.125° (Meeus, mean value for the Moon).
 * @returns {{rise: Date|null, set: Date|null, alwaysUp:boolean, alwaysDown:boolean}}
 */
export function getRiseSet(localDate, lat, lon) {
  const h0 = 0.125;
  const start = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  );
  const stepMin = 10;
  const stepsPerDay = (24 * 60) / stepMin;

  let prevAlt = null;
  let prevT = null;
  let rise = null;
  let set = null;
  let maxAlt = -90;
  let minAlt = 90;

  for (let i = 0; i <= stepsPerDay; i++) {
    const t = new Date(start.getTime() + i * stepMin * 60000);
    const d = daysSince2000(t);
    const sun = sunPosition(d);
    const moon = moonPosition(d, sun);
    const eq = eclipticToEquatorial(moon.lon, moon.lat, sun.oblecl);
    const alt = altitudeAt(t, eq.ra, eq.dec, lat, lon) - h0;

    maxAlt = Math.max(maxAlt, alt);
    minAlt = Math.min(minAlt, alt);

    if (prevAlt !== null) {
      if (prevAlt < 0 && alt >= 0 && !rise) {
        const frac = prevAlt / (prevAlt - alt);
        rise = new Date(prevT.getTime() + frac * (t.getTime() - prevT.getTime()));
      }
      if (prevAlt >= 0 && alt < 0 && !set) {
        const frac = prevAlt / (prevAlt - alt);
        set = new Date(prevT.getTime() + frac * (t.getTime() - prevT.getTime()));
      }
    }
    prevAlt = alt;
    prevT = t;
  }

  return {
    rise,
    set,
    alwaysUp: maxAlt < 0 ? false : minAlt >= 0,
    alwaysDown: maxAlt < 0,
  };
}
```

- [ ] **Step 2: Temporarily verify from `src/App.jsx`**

```jsx
import { getMoonData } from './lib/moon.js';

export default function App() {
  const data = getMoonData(new Date());
  return (
    <div className="app">
      <h1>🌙 Lunar Calendar</h1>
      <p>{data.phaseName} — {(data.illumination * 100).toFixed(1)}% illuminated</p>
    </div>
  );
}
```

- [ ] **Step 3: Run `npm run dev` and verify**

Expected: the page shows today's real phase name and illumination percentage (compare against any moon-phase website — should be plausible for today's date), no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/moon.js src/App.jsx
git commit -m "feat: port astronomy engine to src/lib/moon.js as ES module"
```

---

## Task 3: Port `moondraw.js` (with Qabbalah halo support) and `share.js`

**Files:**
- Create: `src/lib/moondraw.js`
- Create: `src/lib/share.js`
- Modify: `src/App.jsx` (temporary verification render)

**Interfaces:**
- Produces: `drawMoonIcon(canvas, illumination, waxing, opts?)` where `opts` may include `{ lit, shadow, ring, haloColor }`; `readStateFromURL()`, `buildShareURL(date, lat, lon, locName)`, `shareView(date, lat, lon, locName, onDone)`.
- Consumes (Step 2 only, temporary): `getMoonData` from Task 2.

- [ ] **Step 1: Create `src/lib/moondraw.js`** — logic ported from `js/moondraw.js`, extended with an optional `haloColor`. When set, the lit disc itself shrinks slightly (`outerR * 0.76`) so two halo rings fit inside the same canvas bounds at every icon size (22px grid cells through the 140px detail-panel icon) instead of drawing outside the canvas.

```js
/*
 * moondraw.js — draws a moon-phase disc on a <canvas>, from an
 * illumination fraction (0..1) and a waxing/waning flag.
 *
 * Geometry: the terminator (day/night line) projects onto the visible
 * disc as an ellipse with semi-minor axis b = r * |2k - 1|, where k is
 * the illuminated fraction. Starting from an exact half-disc (correct
 * for k = 0.5, quarter moons) we either add a bulge (k > 0.5, gibbous)
 * or carve a bite (k < 0.5, crescent) using that ellipse. Verified at
 * the boundary cases k = 0 (new, fully dark), k = 0.5 (exact half) and
 * k = 1 (full, fully lit).
 *
 * Convention: waxing = illuminated on the right side, waning = left
 * side (standard Northern-hemisphere naked-eye depiction). This is a
 * simplification — true orientation depends on hemisphere and horizon
 * position — noted here rather than modelled, since it doesn't affect
 * the astronomical data shown alongside the icon.
 *
 * Qabbalah theme: opts.haloColor draws two concentric rings around the
 * disc (gold lit-crescent + green halo, referencing Tiphareth and
 * Netzach flanking the Moon's own sphere on the Tree of Life).
 */

export function drawMoonIcon(canvas, illumination, waxing, opts) {
  const options = Object.assign(
    { lit: '#f4ecd8', shadow: '#161a2b', ring: 'rgba(244,236,216,0.25)', haloColor: null },
    opts || {}
  );
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 1;
  const r = options.haloColor ? outerR * 0.76 : outerR;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // Clip to the disc so every subsequent fill stays inside it.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // 1. Base: whole disc dark.
  ctx.fillStyle = options.shadow;
  ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);

  // 2. Permanently-lit half (right if waxing, left if waning).
  ctx.fillStyle = options.lit;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  if (waxing) {
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); // right half
  } else {
    ctx.arc(cx, cy, r, Math.PI / 2, (3 * Math.PI) / 2); // left half
  }
  ctx.closePath();
  ctx.fill();

  // 3. Adjust with the terminator ellipse.
  const k = Math.max(0, Math.min(1, illumination));
  const b = r * Math.abs(2 * k - 1);
  if (b > 0.01) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, b, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = k > 0.5 ? options.lit : options.shadow;
    ctx.save();
    ctx.beginPath();
    ctx.rect(waxing === (k > 0.5) ? cx - r : cx, cy - r, r, 2 * r);
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(cx, cy, b, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Thin outline so new-moon icons remain visible on dark backgrounds.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = options.ring;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (options.haloColor) {
    ctx.beginPath();
    ctx.arc(cx, cy, (r + outerR) / 2, 0, Math.PI * 2);
    ctx.strokeStyle = options.haloColor;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1, outerR * 0.09);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
```

- [ ] **Step 2: Create `src/lib/share.js`** — logic ported unchanged from `js/share.js`

```js
/*
 * share.js — encode/decode the current view (date + location) as URL
 * query params, and offer Web Share API / clipboard sharing.
 */

export function readStateFromURL() {
  const p = new URLSearchParams(window.location.search);
  const y = parseInt(p.get('y'), 10);
  const m = parseInt(p.get('m'), 10); // 1-12
  const d = parseInt(p.get('d'), 10);
  const lat = parseFloat(p.get('lat'));
  const lon = parseFloat(p.get('lon'));
  const loc = p.get('loc');

  const state = {};
  if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
    state.date = new Date(y, m - 1, d);
  }
  if (!Number.isNaN(lat)) state.lat = lat;
  if (!Number.isNaN(lon)) state.lon = lon;
  if (loc) state.locName = loc;
  return state;
}

export function buildShareURL(date, lat, lon, locName) {
  const p = new URLSearchParams();
  p.set('y', date.getFullYear());
  p.set('m', date.getMonth() + 1);
  p.set('d', date.getDate());
  p.set('lat', lat);
  p.set('lon', lon);
  if (locName) p.set('loc', locName);
  const url = new URL(window.location.href);
  url.search = p.toString();
  return url.toString();
}

export async function shareView(date, lat, lon, locName, onDone) {
  const url = buildShareURL(date, lat, lon, locName);
  const dateStr = date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const text = `Moon phase for ${dateStr}${locName ? ' — ' + locName : ''}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Lunar Calendar', text, url });
      onDone && onDone('shared');
      return;
    } catch (err) {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    onDone && onDone('copied');
  } catch (err) {
    onDone && onDone('failed', url);
  }
}
```

- [ ] **Step 3: Temporarily verify from `src/App.jsx`**

```jsx
import { useRef, useEffect } from 'react';
import { getMoonData } from './lib/moon.js';
import { drawMoonIcon } from './lib/moondraw.js';

export default function App() {
  const data = getMoonData(new Date());
  const canvasRef = useRef(null);
  const haloCanvasRef = useRef(null);

  useEffect(() => {
    drawMoonIcon(canvasRef.current, data.illumination, data.elongation < 180);
    drawMoonIcon(haloCanvasRef.current, data.illumination, data.elongation < 180, { haloColor: '#6a8f5c' });
  });

  return (
    <div className="app">
      <h1>🌙 Lunar Calendar</h1>
      <p>{data.phaseName} — {(data.illumination * 100).toFixed(1)}% illuminated</p>
      <canvas ref={canvasRef} width={100} height={100} />
      <canvas ref={haloCanvasRef} width={100} height={100} />
    </div>
  );
}
```

- [ ] **Step 4: Run `npm run dev` and verify**

Expected: two moon discs render side by side, both showing today's correct phase shape; the second one has a visible green ring around it (the halo) and the disc itself is slightly smaller than the first, still fully inside the canvas.

- [ ] **Step 5: Commit**

```bash
git add src/lib/moondraw.js src/lib/share.js src/App.jsx
git commit -m "feat: port moondraw.js (with Qabbalah halo) and share.js as ES modules"
```

---

## Task 4: Sass token foundation — variables, themes, mixins

**Files:**
- Create: `src/styles/_variables.scss`
- Create: `src/styles/_themes.scss`
- Create: `src/styles/_mixins.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/App.jsx` (temporary verification render)

**Interfaces:**
- Produces: Sass variables `$space-1..4`, `$radius`, `$radius-sm`, `$shadow`, `$gap`, `$grid-cols` (from `_variables.scss`); CSS custom properties `--bg-gradient`, `--bg`, `--panel`, `--panel-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--secondary` per `[data-theme='classic']` / `[data-theme='qabbalah']` (from `_themes.scss`); mixins `button-base` and `respond($breakpoint)` (from `_mixins.scss`).

- [ ] **Step 1: Create `src/styles/_variables.scss`**

```scss
// Structural constants — do not vary by theme, so plain Sass variables
// (compile-time) rather than CSS custom properties. Spacing scale is
// built on powers of the golden ratio φ ≈ 1.618.
$space-1: 0.625rem;
$space-2: 1rem;
$space-3: 1.618rem;
$space-4: 2.618rem;

$radius: 14px;
$radius-sm: 8px;
$shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
$gap: clamp(0.5rem, 1.5vw, 1rem);

// Calendar-grid : detail-panel column ratio, φ:1.
$grid-cols: 1.618fr 1fr;
```

- [ ] **Step 2: Create `src/styles/_themes.scss`** — exact hex values from the spec's Theming table

```scss
:root,
[data-theme='classic'] {
  --bg-gradient: radial-gradient(ellipse at top, #171d3a 0%, #0b0e1a 55%);
  --bg: #0b0e1a;
  --panel: #12162a;
  --panel-2: #171c33;
  --border: #262c4a;
  --text: #eef0fb;
  --text-dim: #9aa0c3;
  --accent: #e8c766;
  --secondary: #6ea8fe;
}

[data-theme='qabbalah'] {
  --bg-gradient: radial-gradient(ellipse at top, #22281a 0%, #0a0f09 55%);
  --bg: #0a0f09;
  --panel: #10160f;
  --panel-2: #151d13;
  --border: #33402b;
  --text: #f0ecdd;
  --text-dim: #a9b89e;
  --accent: #c9a13b;
  --secondary: #6a8f5c;
}
```

- [ ] **Step 3: Create `src/styles/_mixins.scss`**

```scss
@mixin button-base {
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.1s ease, background 0.15s ease, border-color 0.15s ease;
  &:active { transform: translateY(1px); }
}

@mixin respond($breakpoint) {
  @if $breakpoint == 'tablet' {
    @media (min-width: 860px) { @content; }
  } @else if $breakpoint == 'mobile' {
    @media (max-width: 560px) { @content; }
  } @else if $breakpoint == 'small' {
    @media (max-width: 480px) { @content; }
  }
}
```

- [ ] **Step 4: Replace `src/styles/main.scss`**

```scss
@use 'variables' as vars;
@use 'themes';

* { box-sizing: border-box; }

html { color-scheme: dark; }

body {
  margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  background: var(--bg-gradient), var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: vars.$space-3;
}
```

- [ ] **Step 5: Temporarily verify theme tokens from `src/App.jsx`**

```jsx
export default function App() {
  return (
    <div className="app" data-theme="qabbalah">
      <h1>🌙 Lunar Calendar</h1>
      <p>Qabbalah theme tokens applied.</p>
    </div>
  );
}
```

- [ ] **Step 6: Run `npm run dev` and verify**

Expected: warm, dark olive/bronze background (`#0a0f09`-ish), warm off-white text. Change `data-theme="qabbalah"` to `data-theme="classic"` in the file, save, and confirm the background switches to cool navy-black (`#0b0e1a`) with cool white text (Vite hot-reloads on save).

- [ ] **Step 7: Commit**

```bash
git add src/styles src/App.jsx
git commit -m "feat: add Sass token foundation (variables, themes, mixins)"
```

---

## Task 5: `useLunarState` + `useShareUrl` hooks

**Files:**
- Create: `src/hooks/useLunarState.js`
- Create: `src/hooks/useShareUrl.js`
- Modify: `src/App.jsx` (temporary verification render — superseded by Task 8/9)

**Interfaces:**
- Consumes: `getLunationBounds` (Task 2), `readStateFromURL` (Task 3).
- Produces: `atNoon(date)` (also used by `DayCell`, `CalendarGrid`, `DetailPanel` in later tasks); `useLunarState()` returning `{ selectedDate, today, lat, lon, locName, bounds, selectDay, changeLunation, setLocation, setLat, setLon, setLocName }`; `useShareUrl(selectedDate, lat, lon, locName)`.

- [ ] **Step 1: Create `src/hooks/useLunarState.js`**

```js
import { useState, useMemo, useCallback } from 'react';
import { getLunationBounds } from '../lib/moon.js';
import { readStateFromURL } from '../lib/share.js';

// Lunation membership for a whole calendar day is decided at local
// noon — keeps grid cells, the title/subtitle, and the detail panel
// consistent about which lunation a day near a new-moon boundary
// belongs to. Mirrors v2's calendar.js atNoon().
export function atNoon(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

const DEFAULT_LAT = 46.0569;
const DEFAULT_LON = 14.5058;
const DEFAULT_LOC_NAME = 'Ljubljana, SI';

function todayAtMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useLunarState() {
  const urlState = useMemo(() => readStateFromURL(), []);
  const [today] = useState(todayAtMidnight);
  const [selectedDate, setSelectedDate] = useState(() => urlState.date || todayAtMidnight());
  const [lat, setLat] = useState(() => (typeof urlState.lat === 'number' ? urlState.lat : DEFAULT_LAT));
  const [lon, setLon] = useState(() => (typeof urlState.lon === 'number' ? urlState.lon : DEFAULT_LON));
  const [locName, setLocName] = useState(() => urlState.locName || DEFAULT_LOC_NAME);

  const bounds = useMemo(() => getLunationBounds(atNoon(selectedDate)), [selectedDate]);

  const selectDay = useCallback((date) => setSelectedDate(date), []);

  // Move to the previous/next lunation by walking to the neighboring
  // lunation's calendar-day boundary — new-moon instants land at
  // arbitrary times of day, so a fixed offset would drift. Same
  // approach as v2's app.js changeLunation().
  const changeLunation = useCallback((delta) => {
    setSelectedDate((current) => {
      const b = getLunationBounds(atNoon(current));
      let d;
      if (delta < 0) {
        d = new Date(b.start.getFullYear(), b.start.getMonth(), b.start.getDate());
        if (atNoon(d) >= b.start) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
      } else {
        d = new Date(b.end.getFullYear(), b.end.getMonth(), b.end.getDate());
        if (atNoon(d) < b.end) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
      return d;
    });
  }, []);

  const setLocation = useCallback((nextLat, nextLon, nextLocName) => {
    setLat(nextLat);
    setLon(nextLon);
    setLocName(nextLocName);
  }, []);

  return {
    selectedDate, today, lat, lon, locName, bounds,
    selectDay, changeLunation, setLocation, setLat, setLon, setLocName,
  };
}
```

- [ ] **Step 2: Create `src/hooks/useShareUrl.js`**

```js
import { useEffect } from 'react';
import { buildShareURL } from '../lib/share.js';

// Syncs the current view (date + location) to the URL on every change,
// via history.replaceState — mirrors v2's app.js syncURL(), now called
// from a passive effect instead of after every event handler.
export function useShareUrl(selectedDate, lat, lon, locName) {
  useEffect(() => {
    const url = buildShareURL(selectedDate, lat, lon, locName);
    window.history.replaceState(null, '', url);
  }, [selectedDate, lat, lon, locName]);
}
```

- [ ] **Step 3: Temporarily verify from `src/App.jsx`**

```jsx
import { useLunarState } from './hooks/useLunarState.js';
import { useShareUrl } from './hooks/useShareUrl.js';

export default function App() {
  const { selectedDate, lat, lon, locName, bounds, changeLunation } = useLunarState();
  useShareUrl(selectedDate, lat, lon, locName);

  return (
    <div className="app" data-theme="qabbalah">
      <h1>🌙 Lunar Calendar</h1>
      <p>Lunation #{bounds.number} — selected {selectedDate.toDateString()}</p>
      <button type="button" onClick={() => changeLunation(-1)}>← Prev lunation</button>
      <button type="button" onClick={() => changeLunation(1)}>Next lunation →</button>
    </div>
  );
}
```

- [ ] **Step 4: Run `npm run dev` and verify**

Expected: page shows today's lunation number and date. Click "Next lunation →" — the lunation number increases by 1 and the displayed date jumps into the next lunation; the browser's address bar URL updates with `?y=&m=&d=&lat=&lon=&loc=` matching the new date. Click "← Prev lunation" twice — confirm it steps back correctly, including back across the boundary into the original lunation.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLunarState.js src/hooks/useShareUrl.js src/App.jsx
git commit -m "feat: add useLunarState and useShareUrl hooks"
```

---

## Task 6: `useTheme` hook, `Toast`, and `Header` (theme toggle + Share button)

**Files:**
- Create: `src/hooks/useTheme.js`
- Create: `src/components/Toast.jsx`
- Create: `src/components/Header.jsx`
- Create: `src/styles/_layout.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `shareView` (Task 3), `useLunarState`/`useShareUrl` (Task 5).
- Produces: `useTheme()` returning `{ theme, toggleTheme, colors }`; `THEME_COLORS` (plain-JS canvas color mirror of `_themes.scss`, consumed by `MoonIcon` in Task 7); `<Toast message>`; `<Header theme onToggleTheme onShare>`.

- [ ] **Step 1: Create `src/hooks/useTheme.js`**

```js
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'lunar-theme';

// Plain-JS mirror of the two themes' halo/secondary colors in
// _themes.scss — <canvas> fillStyle/strokeStyle need literal color
// strings, not var(--x) references, so MoonIcon reads its halo color
// from here rather than from computed CSS. Keep these hex values in
// sync with _themes.scss by convention; there's no build-time link.
export const THEME_COLORS = {
  classic: { lit: '#f4ecd8', shadow: '#161a2b', ring: 'rgba(244,236,216,0.25)', halo: null },
  qabbalah: { lit: '#f4ecd8', shadow: '#161a2b', ring: 'rgba(244,236,216,0.25)', halo: '#6a8f5c' },
};

function readStoredTheme() {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return stored === 'classic' || stored === 'qabbalah' ? stored : 'qabbalah'; // Qabbalah is the default
}

export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'classic' ? 'qabbalah' : 'classic'));
  }, []);

  return { theme, toggleTheme, colors: THEME_COLORS[theme] };
}
```

- [ ] **Step 2: Create `src/components/Toast.jsx`**

```jsx
export default function Toast({ message }) {
  return <p className="toast" role="status" aria-live="polite">{message}</p>;
}
```

- [ ] **Step 3: Create `src/components/Header.jsx`**

```jsx
export default function Header({ theme, onToggleTheme, onShare }) {
  return (
    <header className="app-header">
      <div className="title-block">
        <h1>🌙 Lunar Calendar</h1>
        <p className="subtitle">Moon phase, illumination, zodiac sign and moonrise/moonset — for any day, any place.</p>
      </div>
      <div className="header-actions">
        <button type="button" className="btn" onClick={onToggleTheme}>
          {theme === 'classic' ? '◐ Classic' : '☯ Qabbalah'}
        </button>
        <button type="button" className="btn btn-accent" onClick={onShare}>Share this view</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create `src/styles/_layout.scss`** — header/button/toast rules ported from `css/styles.css`

```scss
@use 'variables' as vars;
@use 'mixins' as mix;

.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.app-header h1 {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  letter-spacing: 0.01em;
}
.subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-dim);
  font-size: 0.95rem;
  max-width: 46ch;
}
.header-actions { display: flex; gap: 0.5rem; }

.btn {
  @include mix.button-base;
  background: var(--panel-2);
  padding: 0.5rem 0.9rem;
}
.btn:hover { background: color-mix(in srgb, var(--panel-2) 80%, white 20%); border-color: var(--accent); }
.btn-icon { padding: 0.5rem 0.75rem; font-size: 1rem; line-height: 1; }
.btn-accent {
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, white 30%));
  color: #1a1200;
  border: none;
  font-weight: 600;
}
.btn-accent:hover { filter: brightness(1.05); }

input[type='number'],
input[type='text'],
input[type='date'] {
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: vars.$gap;
  justify-content: space-between;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
}
.control-group { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.location-group label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-dim);
}
.location-group input[type='number'] { width: 6.5rem; }
.location-group input[type='text'] { width: 10rem; }

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: vars.$space-3;
}

.app-footer {
  border-top: 1px solid var(--border);
  padding-top: 0.85rem;
  color: var(--text-dim);
  font-size: 0.78rem;
  line-height: 1.5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.app-footer code { color: var(--accent); }

.toast {
  min-height: 1.1em;
  margin: 0;
  color: var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 5: Add the new partial to `src/styles/main.scss`**

```scss
@use 'variables' as vars;
@use 'themes';
@use 'layout';

* { box-sizing: border-box; }

html { color-scheme: dark; }

body {
  margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  background: var(--bg-gradient), var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: vars.$space-3;
}
```

- [ ] **Step 6: Replace `src/App.jsx`**

```jsx
import { useState, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import { useLunarState } from './hooks/useLunarState.js';
import { useShareUrl } from './hooks/useShareUrl.js';
import { useTheme } from './hooks/useTheme.js';
import { shareView } from './lib/share.js';

export default function App() {
  const { selectedDate, lat, lon, locName, bounds, changeLunation } = useLunarState();
  useShareUrl(selectedDate, lat, lon, locName);
  const { theme, toggleTheme } = useTheme();

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3500);
  }, []);

  const handleShare = async () => {
    await shareView(selectedDate, lat, lon, locName, (result) => {
      if (result === 'shared') showToast('Shared.');
      else if (result === 'copied') showToast('Link copied to clipboard.');
      else showToast('Could not share automatically — copy the URL from the address bar.');
    });
  };

  return (
    <div className="app" data-theme={theme}>
      <Header theme={theme} onToggleTheme={toggleTheme} onShare={handleShare} />
      <p>Lunation #{bounds.number} — selected {selectedDate.toDateString()}</p>
      <button type="button" className="btn" onClick={() => changeLunation(-1)}>← Prev lunation</button>
      <button type="button" className="btn" onClick={() => changeLunation(1)}>Next lunation →</button>
      <Toast message={toastMsg} />
    </div>
  );
}
```

- [ ] **Step 7: Run `npm run dev` and verify**

Expected: header shows the title/subtitle, a theme-toggle button (starts on "☯ Qabbalah" since it's the default), and a gold "Share this view" button. Click the toggle — background/text/button colors switch between Classic and Qabbalah palettes. Reload the page — the last-chosen theme persists. Click "Share this view" — a toast appears saying either "Shared." or "Link copied to clipboard." (behavior depends on browser support for the Web Share API).

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useTheme.js src/components/Toast.jsx src/components/Header.jsx src/styles src/App.jsx
git commit -m "feat: add useTheme hook, Toast, and Header with theme toggle + share"
```

---

## Task 7: `MoonIcon` component

**Files:**
- Create: `src/components/MoonIcon.jsx`

**Interfaces:**
- Consumes: `drawMoonIcon` (Task 3).
- Produces: `<MoonIcon illumination waxing size? haloColor?>` — used by `DayCell` (Task 8) and `DetailPanel` (Task 9).

- [ ] **Step 1: Create `src/components/MoonIcon.jsx`**

```jsx
import { useEffect, useRef } from 'react';
import { drawMoonIcon } from '../lib/moondraw.js';

export default function MoonIcon({ illumination, waxing, size = 22, haloColor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawMoonIcon(canvasRef.current, illumination, waxing, haloColor ? { haloColor } : undefined);
  }, [illumination, waxing, haloColor]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
```

- [ ] **Step 2: Temporarily verify from `src/App.jsx`** — add this import and line inside the returned JSX, just above `<Toast .../>`, using data already available from `useLunarState`/`useTheme` in the file:

```jsx
import { getMoonData } from './lib/moon.js';
import MoonIcon from './components/MoonIcon.jsx';
import { atNoon } from './hooks/useLunarState.js';
```

```jsx
<MoonIcon
  illumination={getMoonData(atNoon(selectedDate)).illumination}
  waxing={getMoonData(atNoon(selectedDate)).elongation < 180}
  size={80}
  haloColor={theme === 'qabbalah' ? '#6a8f5c' : null}
/>
```

- [ ] **Step 3: Run `npm run dev` and verify**

Expected: an 80px moon-phase disc renders for the currently selected date. Toggle the theme — the green halo ring appears in Qabbalah and disappears in Classic.

- [ ] **Step 4: Commit**

```bash
git add src/components/MoonIcon.jsx src/App.jsx
git commit -m "feat: add MoonIcon canvas component"
```

---

## Task 8: `CalendarGrid` + `DayCell` + `_calendar.scss`

**Files:**
- Create: `src/components/DayCell.jsx`
- Create: `src/components/CalendarGrid.jsx`
- Create: `src/styles/_calendar.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/App.jsx` (replaces the temporary lunation text/buttons/MoonIcon from Tasks 5–7)

**Interfaces:**
- Consumes: `getMoonData` (Task 2), `atNoon` (Task 5), `MoonIcon` (Task 7).
- Produces: `<CalendarGrid bounds today selectedDate haloColor theme onSelect>`.

- [ ] **Step 1: Create `src/components/DayCell.jsx`**

```jsx
import MoonIcon from './MoonIcon.jsx';
import { getMoonData } from '../lib/moon.js';
import { atNoon } from '../hooks/useLunarState.js';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtShort(date) {
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
}

export default function DayCell({ date, bounds, today, selectedDate, haloColor, onSelect }) {
  const noon = atNoon(date);
  const inLunation = noon >= bounds.start && noon < bounds.end;
  const lunarDay = inLunation ? Math.floor((noon - bounds.start) / 86400000) + 1 : null;
  const data = getMoonData(noon);

  const classes = ['day-cell'];
  if (!inLunation) classes.push('outside');
  if (isSameDay(date, today)) classes.push('today');
  if (selectedDate && isSameDay(date, selectedDate)) classes.push('selected');

  const label = `${date.toDateString()}${inLunation ? ', day ' + lunarDay + ' of lunation #' + bounds.number : ', outside this lunation'}`;

  return (
    <button
      type="button"
      className={classes.join(' ')}
      role="gridcell"
      aria-label={label}
      onClick={() => onSelect(date)}
    >
      <span className="day-num">{inLunation ? lunarDay : '·'}</span>
      <MoonIcon illumination={data.illumination} waxing={data.elongation < 180} haloColor={haloColor} />
      <span className="day-greg">{fmtShort(date)}</span>
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/CalendarGrid.jsx`**

```jsx
import DayCell from './DayCell.jsx';

// Monday-first weeks, spanning the week containing the lunation's
// new-moon start through enough weeks to cover its end (a lunation is
// 29-30 days, so 5 or 6 weeks of 7 = 35-42 cells) — same logic as v2's
// calendar.js buildLunationGrid().
function buildLunationGrid(bounds) {
  const startDay = new Date(bounds.start.getFullYear(), bounds.start.getMonth(), bounds.start.getDate());
  const firstWeekday = (startDay.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const gridStart = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() - firstWeekday);

  const endDay = new Date(bounds.end.getFullYear(), bounds.end.getMonth(), bounds.end.getDate());
  const totalDaysInLunation = Math.round((endDay - startDay) / 86400000) + 1;
  const weeksNeeded = Math.ceil((firstWeekday + totalDaysInLunation) / 7);
  const cellCount = weeksNeeded * 7;

  const days = [];
  for (let i = 0; i < cellCount; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtShort(date) {
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
}

export default function CalendarGrid({ bounds, today, selectedDate, haloColor, theme, onSelect }) {
  const days = buildLunationGrid(bounds);

  return (
    <section className="calendar-wrap" aria-label="Calendar grid">
      <div className="title-flourish-wrap">
        {theme === 'qabbalah' && (
          <svg className="spiral-flourish" width="200" height="150" viewBox="0 0 200 150" aria-hidden="true">
            <path
              d="M180,75 A22,22 0 0 1 136,75 A35,35 0 0 1 66,75 A57,57 0 0 1 -48,75"
              fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.3"
            />
          </svg>
        )}
        <h2 className="month-title">Lunation #{bounds.number} — New Moon in {bounds.sunZodiac}</h2>
        <p className="month-subtitle">
          {fmtShort(bounds.start)} → {fmtShort(new Date(bounds.end.getTime() - 1))}, {bounds.start.getFullYear()}
        </p>
      </div>
      <div className="weekday-row">
        {WEEKDAY_LABELS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="calendar-grid" role="grid">
        {days.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            bounds={bounds}
            today={today}
            selectedDate={selectedDate}
            haloColor={haloColor}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/styles/_calendar.scss`** — ported from `css/styles.css`'s calendar section, plus the spiral flourish

```scss
@use 'mixins' as mix;

.calendar-wrap {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.title-flourish-wrap { position: relative; }
.spiral-flourish { position: absolute; top: -20px; right: -10px; pointer-events: none; z-index: 0; }
.month-title, .month-subtitle { position: relative; z-index: 1; }
.month-title {
  margin: 0 0 0.15rem;
  text-align: center;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
}
.month-subtitle {
  margin: 0 0 0.75rem;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.85rem;
}
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: var(--text-dim);
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}
.day-cell {
  @include mix.button-base;
  aspect-ratio: 1 / 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  background: var(--panel-2);
  font-size: clamp(0.65rem, 1.4vw, 0.85rem);
  padding: 2px;
  overflow: hidden;
}
.day-cell:hover { border-color: var(--accent); }
.day-cell.outside { opacity: 0.35; }
.day-cell.today { box-shadow: inset 0 0 0 2px var(--secondary); }
.day-cell.selected { background: color-mix(in srgb, var(--panel-2) 70%, var(--accent) 30%); border-color: var(--accent); }
.day-cell canvas {
  display: block;
  width: min(22px, 32%);
  height: min(22px, 32%);
  flex-shrink: 0;
}
.day-num { line-height: 1; font-weight: 600; flex-shrink: 0; }
.day-greg {
  font-size: 0.6rem;
  color: var(--text-dim);
  line-height: 1;
  flex-shrink: 0;
  white-space: nowrap;
}
```

- [ ] **Step 4: Add the new partial to `src/styles/main.scss`** — insert `@use 'calendar';` after `@use 'layout';`

- [ ] **Step 5: Replace `src/App.jsx`** — swap the temporary lunation text/buttons/MoonIcon for the real grid inside a `<main className="layout">`

```jsx
import { useState, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import Toast from './components/Toast.jsx';
import { useLunarState } from './hooks/useLunarState.js';
import { useShareUrl } from './hooks/useShareUrl.js';
import { useTheme } from './hooks/useTheme.js';
import { shareView } from './lib/share.js';

export default function App() {
  const { selectedDate, today, lat, lon, locName, bounds, selectDay, changeLunation } = useLunarState();
  useShareUrl(selectedDate, lat, lon, locName);
  const { theme, toggleTheme, colors } = useTheme();

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3500);
  }, []);

  const handleShare = async () => {
    await shareView(selectedDate, lat, lon, locName, (result) => {
      if (result === 'shared') showToast('Shared.');
      else if (result === 'copied') showToast('Link copied to clipboard.');
      else showToast('Could not share automatically — copy the URL from the address bar.');
    });
  };

  return (
    <div className="app" data-theme={theme}>
      <Header theme={theme} onToggleTheme={toggleTheme} onShare={handleShare} />
      <div className="control-group nav-group">
        <button type="button" className="btn btn-icon" aria-label="Previous lunation" onClick={() => changeLunation(-1)}>&#8592;</button>
        <button type="button" className="btn btn-icon" aria-label="Next lunation" onClick={() => changeLunation(1)}>&#8594;</button>
      </div>
      <main className="layout">
        <CalendarGrid
          bounds={bounds}
          today={today}
          selectedDate={selectedDate}
          haloColor={colors.halo}
          theme={theme}
          onSelect={selectDay}
        />
      </main>
      <Toast message={toastMsg} />
    </div>
  );
}
```

- [ ] **Step 6: Run `npm run dev` and verify**

Expected: a full 5-6-week grid of moon-phase discs renders below the header, weekday labels above it. In Qabbalah theme, every disc has a green halo ring and a faint golden spiral is visible behind the month title. Click any day cell — it gets a highlighted border/background (`.selected`). Click the ← / → buttons — the whole grid re-renders for the neighboring lunation with the correct title and date range.

- [ ] **Step 7: Commit**

```bash
git add src/components/DayCell.jsx src/components/CalendarGrid.jsx src/styles src/App.jsx
git commit -m "feat: add CalendarGrid and DayCell components"
```

---

## Task 9: `Controls` component

**Files:**
- Create: `src/components/Controls.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useLunarState`'s `setLat`/`setLon`/`setLocName`/`setLocation`.
- Produces: `<Controls selectedDate lat lon locName onPrev onNext onToday onPickDate onLatChange onLonChange onLocNameChange onUseMyLocation geoBusy>`.

- [ ] **Step 1: Create `src/components/Controls.jsx`**

```jsx
function toISODate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Controls({
  selectedDate, lat, lon, locName,
  onPrev, onNext, onToday, onPickDate,
  onLatChange, onLonChange, onLocNameChange, onUseMyLocation, geoBusy,
}) {
  return (
    <section className="controls" aria-label="Calendar controls">
      <div className="control-group nav-group">
        <button type="button" className="btn btn-icon" aria-label="Previous lunation" onClick={onPrev}>&#8592;</button>
        <input
          type="date"
          aria-label="Jump to date"
          value={toISODate(selectedDate)}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (y && m && d) onPickDate(new Date(y, m - 1, d));
          }}
        />
        <button type="button" className="btn btn-icon" aria-label="Next lunation" onClick={onNext}>&#8594;</button>
        <button type="button" className="btn" onClick={onToday}>Today</button>
      </div>

      <div className="control-group location-group">
        <label>
          Lat
          <input type="number" step="0.0001" min="-90" max="90" value={lat}
            onChange={(e) => onLatChange(parseFloat(e.target.value))} />
        </label>
        <label>
          Lon
          <input type="number" step="0.0001" min="-180" max="180" value={lon}
            onChange={(e) => onLonChange(parseFloat(e.target.value))} />
        </label>
        <input type="text" placeholder="Location name" value={locName}
          onChange={(e) => onLocNameChange(e.target.value)} />
        <button type="button" className="btn" title="Use my current location" onClick={onUseMyLocation} disabled={geoBusy}>
          📍 Use my location
        </button>
      </div>
    </section>
  );
}
```

Note: lat/lon/location-name inputs update on every keystroke (`onChange`) rather than only on blur (v2 used the `change` DOM event) — a deliberate, minor modernization consistent with React's controlled-input convention, not a regression: partial numeric input like `"14."` still parses safely via `parseFloat`.

- [ ] **Step 2: Replace `src/App.jsx`** — remove the temporary `<div className="control-group nav-group">` buttons from Task 8, use `<Controls>` instead, add geolocation handling

```jsx
import { useState, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import Controls from './components/Controls.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import Toast from './components/Toast.jsx';
import { useLunarState } from './hooks/useLunarState.js';
import { useShareUrl } from './hooks/useShareUrl.js';
import { useTheme } from './hooks/useTheme.js';
import { shareView } from './lib/share.js';

export default function App() {
  const {
    selectedDate, today, lat, lon, locName, bounds,
    selectDay, changeLunation, setLocation, setLat, setLon, setLocName,
  } = useLunarState();
  useShareUrl(selectedDate, lat, lon, locName);
  const { theme, toggleTheme, colors } = useTheme();

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3500);
  }, []);

  const [geoBusy, setGeoBusy] = useState(false);
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by this browser.');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude, 'My location');
        setGeoBusy(false);
        showToast('Location updated.');
      },
      () => {
        setGeoBusy(false);
        showToast('Could not get your location.');
      }
    );
  };

  const handleShare = async () => {
    await shareView(selectedDate, lat, lon, locName, (result) => {
      if (result === 'shared') showToast('Shared.');
      else if (result === 'copied') showToast('Link copied to clipboard.');
      else showToast('Could not share automatically — copy the URL from the address bar.');
    });
  };

  return (
    <div className="app" data-theme={theme}>
      <Header theme={theme} onToggleTheme={toggleTheme} onShare={handleShare} />

      <Controls
        selectedDate={selectedDate}
        lat={lat}
        lon={lon}
        locName={locName}
        onPrev={() => changeLunation(-1)}
        onNext={() => changeLunation(1)}
        onToday={() => selectDay(today)}
        onPickDate={selectDay}
        onLatChange={setLat}
        onLonChange={setLon}
        onLocNameChange={setLocName}
        onUseMyLocation={handleUseMyLocation}
        geoBusy={geoBusy}
      />

      <main className="layout">
        <CalendarGrid
          bounds={bounds}
          today={today}
          selectedDate={selectedDate}
          haloColor={colors.halo}
          theme={theme}
          onSelect={selectDay}
        />
      </main>
      <Toast message={toastMsg} />
    </div>
  );
}
```

- [ ] **Step 3: Run `npm run dev` and verify**

Expected: a controls bar with ← / date-picker / → / Today, and Lat/Lon/location-name inputs plus a "📍 Use my location" button. Change the date picker — the grid jumps to that date's lunation. Click "Today" — returns to today's lunation. Edit the Lat/Lon fields — no visible effect yet (detail panel arrives in Task 10) but no console errors. Click "Use my location" — browser prompts for permission; on allow, the button briefly disables and a "Location updated." toast appears; on deny, "Could not get your location." appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/Controls.jsx src/App.jsx
git commit -m "feat: add Controls component (navigation, date picker, location)"
```

---

## Task 10: `DetailPanel` + `_detail-panel.scss`

**Files:**
- Create: `src/components/DetailPanel.jsx`
- Create: `src/styles/_detail-panel.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `getMoonData`, `getRiseSet`, `SYNODIC_MONTH` (Task 2), `atNoon` (Task 5), `MoonIcon` (Task 7).
- Produces: `<DetailPanel selectedDate lat lon locName bounds haloColor journal>` — `journal` prop shape is defined in Task 11 (`{ entry, save, exportAll }`); this task passes a stub `{ entry: null, save: () => {}, exportAll: () => {} }` until Task 11 wires the real hook.

- [ ] **Step 1: Create `src/components/DetailPanel.jsx`**

```jsx
import MoonIcon from './MoonIcon.jsx';
import { getMoonData, getRiseSet, SYNODIC_MONTH } from '../lib/moon.js';
import { atNoon } from '../hooks/useLunarState.js';

function timeFmt(t) {
  return t ? t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
}

export default function DetailPanel({ selectedDate, lat, lon, locName, bounds, haloColor }) {
  const noon = atNoon(selectedDate);
  const data = getMoonData(noon);
  const riseSet = getRiseSet(selectedDate, lat, lon);
  const lunarDay = Math.floor((noon - bounds.start) / 86400000) + 1;

  return (
    <aside className="detail-panel" aria-live="polite">
      <div className="detail-moon">
        <MoonIcon illumination={data.illumination} waxing={data.elongation < 180} size={140} haloColor={haloColor} />
      </div>
      <h3>
        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </h3>
      <dl className="detail-list">
        <div><dt>Phase</dt><dd>{data.phaseName}</dd></div>
        <div><dt>Illumination</dt><dd>{(data.illumination * 100).toFixed(1)}%</dd></div>
        <div><dt>Lunar day</dt><dd>{lunarDay} of Lunation #{bounds.number}</dd></div>
        <div><dt>Moon age</dt><dd>{data.ageDays.toFixed(1)} / {SYNODIC_MONTH.toFixed(1)} days</dd></div>
        <div><dt>Zodiac sign</dt><dd>{data.zodiac}</dd></div>
        <div><dt>Distance</dt><dd>{Math.round(data.distanceKm).toLocaleString()} km</dd></div>
        <div><dt>Moonrise</dt><dd>{riseSet.alwaysDown ? 'does not rise' : timeFmt(riseSet.rise)}</dd></div>
        <div><dt>Moonset</dt><dd>{riseSet.alwaysUp ? 'does not set' : timeFmt(riseSet.set)}</dd></div>
      </dl>
      <p className="detail-location">{locName || 'Custom location'} ({lat.toFixed(3)}, {lon.toFixed(3)})</p>
    </aside>
  );
}
```

- [ ] **Step 2: Create `src/styles/_detail-panel.scss`**

```scss
.detail-panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}
.detail-moon canvas { display: block; margin: 0 auto 0.25rem; }
.detail-panel h3 { margin: 0; font-size: 1.1rem; }
.detail-list {
  width: 100%;
  margin: 0.5rem 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 0.5rem;
  text-align: left;
}
.detail-list div { display: contents; }
.detail-list dt { color: var(--text-dim); font-size: 0.78rem; grid-column: 1; }
.detail-list dd { margin: 0; font-size: 0.85rem; grid-column: 2; text-align: right; }
.detail-location { color: var(--text-dim); font-size: 0.78rem; margin: 0.5rem 0 0; }
```

- [ ] **Step 3: Add the new partial to `src/styles/main.scss`** — insert `@use 'detail-panel';` after `@use 'calendar';`

- [ ] **Step 4: Modify `src/App.jsx`** — import `DetailPanel`, render it inside `<main className="layout">` next to `<CalendarGrid>`

```jsx
import DetailPanel from './components/DetailPanel.jsx';
```

```jsx
<main className="layout">
  <CalendarGrid
    bounds={bounds}
    today={today}
    selectedDate={selectedDate}
    haloColor={colors.halo}
    theme={theme}
    onSelect={selectDay}
  />
  <DetailPanel
    selectedDate={selectedDate}
    lat={lat}
    lon={lon}
    locName={locName}
    bounds={bounds}
    haloColor={colors.halo}
  />
</main>
```

- [ ] **Step 5: Run `npm run dev` and verify**

Expected: a stats panel appears beside the calendar grid (below it on narrow viewports), showing a 140px moon icon and Phase/Illumination/Lunar day/Moon age/Zodiac sign/Distance/Moonrise/Moonset/Location. Click a different day cell in the grid — every value in the panel updates to match that day. Edit the Lat/Lon inputs from Task 9 and click elsewhere — Moonrise/Moonset and the location line update accordingly.

- [ ] **Step 6: Commit**

```bash
git add src/components/DetailPanel.jsx src/styles src/App.jsx
git commit -m "feat: add DetailPanel component with moon stats"
```

---

## Task 11: Journal feature — `journal.js`, `useJournal`, `JournalSection`

**Files:**
- Create: `src/lib/journal.js`
- Create: `src/hooks/useJournal.js`
- Create: `src/components/JournalSection.jsx`
- Modify: `src/components/DetailPanel.jsx`
- Modify: `src/styles/_detail-panel.scss`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `getEntry(date)`, `saveEntry(date, text, lat, lon, locName)`, `exportAll()` (from `journal.js`); `useJournal(selectedDate)` returning `{ entry, save, exportAll }`; `<JournalSection entry lat lon locName onSave onExport>`.

- [ ] **Step 1: Create `src/lib/journal.js`** — data model per spec: `localStorage` key `lunar-journal-v1`, one entry per calendar day keyed by ISO date, explicit Save (no autosave), location = the app's currently-configured lat/lon/locName at save time (not a fresh geolocation read)

```js
const STORAGE_KEY = 'lunar-journal-v1';

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(entries) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function toISODate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function getEntry(date) {
  const entries = readAll();
  return entries[toISODate(date)] || null;
}

// Overwrites any existing entry for this day (single entry per day, no
// history/versioning) and updates savedAt.
export function saveEntry(date, text, lat, lon, locName) {
  const entries = readAll();
  const key = toISODate(date);
  entries[key] = { text, savedAt: Date.now(), lat, lon, locName };
  writeAll(entries);
  return entries[key];
}

// Downloads the entire journal as one JSON file — localStorage-only
// storage is one browser-clear away from losing everything, so this
// exists specifically as a way out of that.
export function exportAll() {
  const entries = readAll();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lunar-journal-export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Create `src/hooks/useJournal.js`**

```js
import { useState, useEffect, useCallback } from 'react';
import { getEntry, saveEntry, exportAll } from '../lib/journal.js';

export function useJournal(selectedDate) {
  const [entry, setEntry] = useState(() => getEntry(selectedDate));

  useEffect(() => {
    setEntry(getEntry(selectedDate));
  }, [selectedDate]);

  const save = useCallback((text, lat, lon, locName) => {
    const saved = saveEntry(selectedDate, text, lat, lon, locName);
    setEntry(saved);
    return saved;
  }, [selectedDate]);

  return { entry, save, exportAll };
}
```

- [ ] **Step 3: Create `src/components/JournalSection.jsx`**

```jsx
import { useState, useEffect } from 'react';

function fmtSavedAt(ms) {
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function JournalSection({ entry, lat, lon, locName, onSave, onExport }) {
  const [text, setText] = useState(entry ? entry.text : '');

  useEffect(() => {
    setText(entry ? entry.text : '');
  }, [entry]);

  return (
    <div className="journal-section">
      <h4 className="journal-heading">Journal</h4>
      <textarea
        className="journal-textarea"
        rows={4}
        placeholder="Notes for this day…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="journal-actions">
        <button type="button" className="btn" onClick={() => onSave(text, lat, lon, locName)}>Save</button>
        <button type="button" className="btn btn-icon" onClick={onExport} title="Download all journal entries as JSON">⬇ Export all entries</button>
      </div>
      {entry && (
        <p className="journal-meta">
          Saved {fmtSavedAt(entry.savedAt)} · {entry.locName || 'Custom location'} ({entry.lat.toFixed(3)}, {entry.lon.toFixed(3)})
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Modify `src/components/DetailPanel.jsx`** — add `JournalSection` below the existing stats, separated by a divider (placed in the empty space that was previously below the stats block)

```jsx
import MoonIcon from './MoonIcon.jsx';
import JournalSection from './JournalSection.jsx';
import { getMoonData, getRiseSet, SYNODIC_MONTH } from '../lib/moon.js';
import { atNoon } from '../hooks/useLunarState.js';
```

Add a `journal` prop to the function signature: `export default function DetailPanel({ selectedDate, lat, lon, locName, bounds, haloColor, journal }) {`

Add, immediately after the existing `<p className="detail-location">...</p>` line, before the closing `</aside>`:

```jsx
      <JournalSection
        entry={journal.entry}
        lat={lat}
        lon={lon}
        locName={locName}
        onSave={(text, jLat, jLon, jLocName) => journal.save(text, jLat, jLon, jLocName)}
        onExport={journal.exportAll}
      />
```

- [ ] **Step 5: Add journal styles to `src/styles/_detail-panel.scss`** — append:

```scss
.journal-section {
  width: 100%;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  text-align: left;
}
.journal-heading { margin: 0 0 0.4rem; font-size: 0.9rem; color: var(--text-dim); }
.journal-textarea {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 0.5rem;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
}
.journal-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.journal-meta { margin: 0.5rem 0 0; font-size: 0.72rem; color: var(--text-dim); }
```

- [ ] **Step 6: Modify `src/App.jsx`** — import and call `useJournal`, pass it to `DetailPanel`

```jsx
import { useJournal } from './hooks/useJournal.js';
```

```jsx
const journal = useJournal(selectedDate);
```

```jsx
<DetailPanel
  selectedDate={selectedDate}
  lat={lat}
  lon={lon}
  locName={locName}
  bounds={bounds}
  haloColor={colors.halo}
  journal={journal}
/>
```

- [ ] **Step 7: Run `npm run dev` and verify**

Expected: a "Journal" section appears below the stats/location line in the detail panel, with a textarea and Save/Export buttons. Type a note, click Save — a "Saved <date/time> · <location> (<lat>, <lon>)" line appears below the buttons matching the app's current location inputs. Reload the page — the note is still there for that day (persisted via `localStorage`). Select a different day — the textarea clears (no entry yet); go back to the original day — the note reappears. Click "⬇ Export all entries" — a `lunar-journal-export.json` file downloads containing the saved entry keyed by ISO date.

- [ ] **Step 8: Commit**

```bash
git add src/lib/journal.js src/hooks/useJournal.js src/components/JournalSection.jsx src/components/DetailPanel.jsx src/styles/_detail-panel.scss src/App.jsx
git commit -m "feat: add per-day journal (timestamped, geotagged, exportable)"
```

---

## Task 12: Tree-of-Life footer flourish + `_responsive.scss`

**Files:**
- Modify: `src/App.jsx` (add footer with credits text + Qabbalah-only tree flourish)
- Create: `src/styles/_responsive.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: none new.

- [ ] **Step 1: Modify `src/App.jsx`** — add a `<footer className="app-footer">` immediately before `<Toast message={toastMsg} />`, containing the credits paragraph and (Qabbalah-only) the 7-node Tree-of-Life SVG

```jsx
<footer className="app-footer">
  <p>
    Final project — CodersLab Front-End course, built with React, Sass and vanilla ES6 JavaScript.
    Astronomical formulas: Paul Schlyter, <em>&ldquo;How to compute planetary positions.&rdquo;</em> See{' '}
    <code>src/lib/moon.js</code> for full derivation and sources.
  </p>
  {theme === 'qabbalah' && (
    <svg className="tree-flourish" width="100" height="70" viewBox="0 0 100 70" aria-hidden="true">
      <g stroke="var(--secondary)" strokeWidth="1" opacity="0.7">
        <line x1="50" y1="6" x2="32" y2="24" /><line x1="50" y1="6" x2="68" y2="24" />
        <line x1="32" y1="24" x2="68" y2="24" />
        <line x1="32" y1="24" x2="50" y2="42" /><line x1="68" y1="24" x2="50" y2="42" />
        <line x1="50" y1="42" x2="32" y2="60" /><line x1="50" y1="42" x2="68" y2="60" />
        <line x1="32" y1="60" x2="68" y2="60" />
      </g>
      <circle cx="50" cy="6" r="2.5" fill="var(--accent)" />
      <circle cx="32" cy="24" r="2.5" fill="var(--secondary)" /><circle cx="68" cy="24" r="2.5" fill="var(--accent)" />
      <circle cx="50" cy="42" r="3.5" fill="var(--text)" />
      <circle cx="32" cy="60" r="2.5" fill="var(--accent)" /><circle cx="68" cy="60" r="2.5" fill="var(--secondary)" />
    </svg>
  )}
</footer>
```

- [ ] **Step 2: Create `src/styles/_responsive.scss`** — media queries ported from `css/styles.css`, plus the desktop φ-ratio grid split from the spec

```scss
@use 'variables' as vars;
@use 'mixins' as mix;

@include mix.respond('tablet') {
  .layout { grid-template-columns: vars.$grid-cols; align-items: start; }
}

@include mix.respond('mobile') {
  .day-greg { font-size: 0.52rem; }
}

@include mix.respond('small') {
  .day-num { font-size: 0.7rem; }
  .control-group { justify-content: center; width: 100%; }
  .location-group input[type='text'] { width: 100%; }
}
```

- [ ] **Step 3: Add the new partial to `src/styles/main.scss`** — insert `@use 'responsive';` last, after `@use 'detail-panel';` (must be last so its media queries win in the cascade over the mobile-first base rules)

- [ ] **Step 4: Run `npm run dev` and verify at three widths**

Using the browser devtools device toolbar (or manual window resize):
- **≥860px**: calendar grid and detail panel sit side by side, calendar column visibly wider than the detail panel (roughly 62%/38%, the φ:1 split).
- **560–859px**: calendar and detail panel stack vertically (single column).
- **≤480px**: control groups center themselves and the location-name input spans the full width; day-cell numbers shrink slightly.

In Qabbalah theme, confirm the tree-of-life flourish renders in the footer, to the right of the credits paragraph, and disappears when toggled to Classic.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/styles/_responsive.scss src/styles/main.scss
git commit -m "feat: add Tree-of-Life footer flourish and responsive breakpoints"
```

---

## Task 13: Update docs, remove now-empty legacy directories, final QA pass

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-08-17-react-rewrite-qabbalah-theme-design.md` (status line only)

**Interfaces:** none — documentation only.

- [ ] **Step 1: Confirm `js/` and `css/` directories are gone**

They were deleted in Task 1; if `git status` still shows them as empty directories, remove them (empty directories aren't tracked by git, so this is likely already a no-op).

- [ ] **Step 2: Update `README.md`**

Replace the "How it works / where to look" table and "Running locally" section to describe the new `src/` layout and Vite workflow. Specifically:
- Replace the file table's rows with the `src/lib`, `src/hooks`, `src/components`, `src/styles` breakdown from this plan's Architecture section.
- Replace "Running locally" with:
  ```markdown
  ## Running locally

  Requires Node.js (v22+ recommended) and npm.

  ```bash
  npm install
  npm run dev
  ```

  Then open the printed local URL (typically `http://localhost:5173`). For a production build: `npm run build` (outputs to `dist/`), previewed with `npm run preview`.
  ```
- Remove the "No build tools, no npm install needed" sentence and the "Double-click index.html" bullet — no longer true as of v3.
- Add a short "Themes" section describing the Classic/Qabbalah toggle and the golden-ratio/Tree-of-Life motifs, and a "Journal" section describing the per-day notes feature (timestamped, geotagged, exportable, `localStorage`-only).

- [ ] **Step 3: Update `CLAUDE.md`**

Replace the "Architecture" section (the five-`<script>`-tag description) with the `src/` component-tree/hooks/lib breakdown from this plan, and replace "Running / testing" with the `npm install && npm run dev` workflow. Keep the "Local-noon convention" and lunation-numbering notes — they still apply unchanged (ported logic, not rewritten). Update "Repo notes" to remove the now-resolved pointer to the design spec as "not yet implemented" — replace it with a pointer to this plan file instead, noting the rewrite is complete.

- [ ] **Step 4: Update the design spec's status line**

Change line 3 of `docs/superpowers/specs/2026-08-17-react-rewrite-qabbalah-theme-design.md` from:
```
Status: approved by user, pending spec review sign-off
```
to:
```
Status: implemented — see docs/superpowers/plans/2026-08-17-react-sass-qabbalah-rewrite.md
```

- [ ] **Step 5: Full manual QA pass**

Run `npm run dev` and walk through, in both themes (toggle partway through):
1. Grid renders correctly for the current lunation; Prev/Next navigate correctly across a lunation boundary.
2. Date picker jump and Today button both work.
3. Click several day cells — detail panel updates every field correctly each time.
4. Lat/Lon/location-name edits change Moonrise/Moonset and the location line.
5. Geolocation button works (or shows the correct denial toast).
6. Share button copies/shares the current URL; opening that URL in a fresh tab reproduces the same date/location.
7. Journal: save a note on one day, navigate away and back, confirm it persisted; export downloads valid JSON.
8. Resize to mobile width — layout stacks correctly, no horizontal scrollbar, no overlapping elements.
9. No console errors or warnings at any point above.

- [ ] **Step 6: Run a production build**

Run: `npm run build`

Expected: completes with no errors, produces a `dist/` directory. Run `npm run preview` and spot-check the built app loads and the grid renders (confirms the build isn't broken even though it's not the dev server).

- [ ] **Step 7: Commit**

```bash
git add README.md CLAUDE.md docs/superpowers/specs/2026-08-17-react-rewrite-qabbalah-theme-design.md
git commit -m "docs: update README and CLAUDE.md for v3 React/Sass architecture"
```
