/*
 * share.js — encode/decode the current view (date + location) as URL
 * query params, and offer Web Share API / clipboard sharing.
 */
(function (global) {
  'use strict';

  function readStateFromURL() {
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

  function buildShareURL(date, lat, lon, locName) {
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

  async function shareView(date, lat, lon, locName, onDone) {
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

  global.MoonShare = { readStateFromURL, buildShareURL, shareView };
})(typeof window !== 'undefined' ? window : globalThis);
