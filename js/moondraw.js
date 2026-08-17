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
 */
(function (global) {
  'use strict';

  function drawMoonIcon(canvas, illumination, waxing, opts) {
    const options = Object.assign(
      { lit: '#f4ecd8', shadow: '#161a2b', ring: 'rgba(244,236,216,0.25)' },
      opts || {}
    );
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 1;

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
      if (k > 0.5) {
        // Gibbous: bulge lit color into the dark half.
        ctx.fillStyle = options.lit;
      } else {
        // Crescent: carve dark color out of the lit half.
        ctx.fillStyle = options.shadow;
      }
      // Only paint the half of the ellipse that's on the "other" side.
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
  }

  global.drawMoonIcon = drawMoonIcon;
})(typeof window !== 'undefined' ? window : globalThis);
