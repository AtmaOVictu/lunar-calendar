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
 *
 * Everything is attached to a single global: MoonCalc
 */
(function (global) {
  'use strict';

  const RAD = Math.PI / 180;
  const SYNODIC_MONTH = 29.530588853; // days

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
      const dE =
        (E - (e / RAD) * sinD(E) - M) / (1 - e * cosD(E));
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
  function getMoonData(date) {
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
  function getLunationBounds(date) {
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
  function getRiseSet(localDate, lat, lon) {
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
      const jd = toJD(t);
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

  global.MoonCalc = { getMoonData, getRiseSet, getLunationBounds, SYNODIC_MONTH };
})(typeof window !== 'undefined' ? window : globalThis);
