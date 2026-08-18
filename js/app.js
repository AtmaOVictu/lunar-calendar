/*
 * app.js — application entry point: owns state, wires up DOM event
 * listeners, reads/writes the shareable URL.
 *
 * There is no Gregorian "current month" here on purpose: which
 * lunation (lunar month) is shown is always derived from
 * state.selectedDate via MoonCalc.getLunationBounds(). Moving to the
 * previous/next lunation just moves selectedDate into that lunation's
 * range and re-derives everything from it.
 */
(function () {
  'use strict';

  const els = {
    grid: document.getElementById('calendarGrid'),
    title: document.getElementById('monthTitle'),
    subtitle: document.getElementById('monthSubtitle'),
    datePicker: document.getElementById('datePicker'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    todayBtn: document.getElementById('todayBtn'),
    latInput: document.getElementById('latInput'),
    lonInput: document.getElementById('lonInput'),
    locName: document.getElementById('locName'),
    geoBtn: document.getElementById('geoBtn'),
    shareBtn: document.getElementById('shareBtn'),
    themeBtn: document.getElementById('themeBtn'),
    toast: document.getElementById('toast'),
    detailCanvas: document.getElementById('detailCanvas'),
    detailDate: document.getElementById('detailDate'),
    detailPhase: document.getElementById('detailPhase'),
    detailIllum: document.getElementById('detailIllum'),
    detailLunarDay: document.getElementById('detailLunarDay'),
    detailAge: document.getElementById('detailAge'),
    detailZodiac: document.getElementById('detailZodiac'),
    detailDistance: document.getElementById('detailDistance'),
    detailRise: document.getElementById('detailRise'),
    detailSet: document.getElementById('detailSet'),
    detailLocation: document.getElementById('detailLocation'),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urlState = window.MoonShare.readStateFromURL();

  const state = {
    selectedDate: urlState.date || today,
    today,
    lat: typeof urlState.lat === 'number' ? urlState.lat : parseFloat(els.latInput.value),
    lon: typeof urlState.lon === 'number' ? urlState.lon : parseFloat(els.lonInput.value),
    locName: urlState.locName || els.locName.value,
  };
  els.latInput.value = state.lat;
  els.lonInput.value = state.lon;
  els.locName.value = state.locName;

  // Theme: a display preference, not part of the shareable view state, so
  // it lives in localStorage rather than the URL (see js/share.js). The
  // actual attribute is applied pre-paint by the inline script in
  // index.html's <head> — this just keeps the button label in sync and
  // handles switching it after load.
  const THEME_KEY = 'lunar-theme';
  let theme = document.documentElement.getAttribute('data-theme') === 'qabbalah' ? 'qabbalah' : 'classic';

  function applyTheme(next) {
    theme = next;
    if (theme === 'qabbalah') {
      document.documentElement.setAttribute('data-theme', 'qabbalah');
      els.themeBtn.textContent = '☯ Qabbalah';
    } else {
      document.documentElement.removeAttribute('data-theme');
      els.themeBtn.textContent = '◐ Classic';
    }
    els.themeBtn.setAttribute('aria-pressed', String(theme === 'qabbalah'));
  }
  applyTheme(theme);

  els.themeBtn.addEventListener('click', () => {
    const next = theme === 'qabbalah' ? 'classic' : 'qabbalah';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  function showToast(msg) {
    els.toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.textContent = ''; }, 3500);
  }

  function toISODate(d) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  function syncURL() {
    const url = window.MoonShare.buildShareURL(state.selectedDate, state.lat, state.lon, state.locName);
    window.history.replaceState(null, '', url);
  }

  let currentBounds = null;

  function renderAll() {
    els.datePicker.value = toISODate(state.selectedDate);
    currentBounds = window.MoonCalendar.renderCalendar(els.grid, els.title, els.subtitle, state, selectDay);
    renderDetail();
    syncURL();
  }

  function renderDetail() {
    const d = state.selectedDate;
    const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    const data = window.MoonCalc.getMoonData(noon);
    const riseSet = window.MoonCalc.getRiseSet(d, state.lat, state.lon);
    const bounds = currentBounds || window.MoonCalc.getLunationBounds(noon);

    window.drawMoonIcon(els.detailCanvas, data.illumination, data.elongation < 180);

    els.detailDate.textContent = d.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    els.detailPhase.textContent = data.phaseName;
    els.detailIllum.textContent = `${(data.illumination * 100).toFixed(1)}%`;
    const lunarDay = Math.floor((noon - bounds.start) / 86400000) + 1;
    els.detailLunarDay.textContent = `${lunarDay} of Lunation #${bounds.number}`;
    els.detailAge.textContent = `${data.ageDays.toFixed(1)} / ${window.MoonCalc.SYNODIC_MONTH.toFixed(1)} days`;
    els.detailZodiac.textContent = data.zodiac;
    els.detailDistance.textContent = `${Math.round(data.distanceKm).toLocaleString()} km`;

    const timeFmt = (t) => (t ? t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—');
    els.detailRise.textContent = riseSet.alwaysDown ? 'does not rise' : timeFmt(riseSet.rise);
    els.detailSet.textContent = riseSet.alwaysUp ? 'does not set' : timeFmt(riseSet.set);

    els.detailLocation.textContent = `${state.locName || 'Custom location'} (${state.lat.toFixed(3)}, ${state.lon.toFixed(3)})`;
  }

  function selectDay(date) {
    state.selectedDate = date;
    renderAll();
  }

  // Move to the previous/next lunation. Rather than guessing a fixed
  // number of hours to add/subtract (fragile: new-moon instants land at
  // arbitrary times of day, and the answer depends on timezone), find
  // the exact calendar-day boundary: the last day whose local noon is
  // still before this lunation's start, or the first day whose local
  // noon is at/after its end. That's guaranteed to land in the
  // neighboring lunation regardless of timezone or new-moon time-of-day.
  function changeLunation(delta) {
    const bounds = window.MoonCalc.getLunationBounds(window.MoonCalendar.atNoon(state.selectedDate));
    let d;
    if (delta < 0) {
      d = new Date(bounds.start.getFullYear(), bounds.start.getMonth(), bounds.start.getDate());
      if (window.MoonCalendar.atNoon(d) >= bounds.start) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    } else {
      d = new Date(bounds.end.getFullYear(), bounds.end.getMonth(), bounds.end.getDate());
      if (window.MoonCalendar.atNoon(d) < bounds.end) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    state.selectedDate = d;
    renderAll();
  }

  els.prevMonth.addEventListener('click', () => changeLunation(-1));
  els.nextMonth.addEventListener('click', () => changeLunation(1));
  els.todayBtn.addEventListener('click', () => { selectDay(today); });

  els.datePicker.addEventListener('change', () => {
    const [y, m, d] = els.datePicker.value.split('-').map(Number);
    if (y && m && d) { selectDay(new Date(y, m - 1, d)); }
  });

  function applyLocationInputs() {
    const lat = parseFloat(els.latInput.value);
    const lon = parseFloat(els.lonInput.value);
    if (!Number.isNaN(lat)) state.lat = lat;
    if (!Number.isNaN(lon)) state.lon = lon;
    state.locName = els.locName.value;
    renderDetail();
    syncURL();
  }
  els.latInput.addEventListener('change', applyLocationInputs);
  els.lonInput.addEventListener('change', applyLocationInputs);
  els.locName.addEventListener('change', applyLocationInputs);

  els.geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by this browser.');
      return;
    }
    els.geoBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.lat = pos.coords.latitude;
        state.lon = pos.coords.longitude;
        state.locName = 'My location';
        els.latInput.value = state.lat.toFixed(4);
        els.lonInput.value = state.lon.toFixed(4);
        els.locName.value = state.locName;
        els.geoBtn.disabled = false;
        renderDetail();
        syncURL();
        showToast('Location updated.');
      },
      () => {
        els.geoBtn.disabled = false;
        showToast('Could not get your location.');
      }
    );
  });

  els.shareBtn.addEventListener('click', async () => {
    await window.MoonShare.shareView(state.selectedDate, state.lat, state.lon, state.locName, (result) => {
      if (result === 'shared') showToast('Shared.');
      else if (result === 'copied') showToast('Link copied to clipboard.');
      else showToast('Could not share automatically — copy the URL from the address bar.');
    });
  });

  renderAll();
})();
