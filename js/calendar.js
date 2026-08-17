/*
 * calendar.js — builds a LUNAR month grid: one "month" is one lunation
 * (new moon to new moon, ~29.5 days), not a Gregorian calendar month.
 * No state is kept here; app.js owns state and passes it in, this
 * module just renders and reports clicks back via a callback.
 */
(function (global) {
  'use strict';

  const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function fmtShort(date) {
    return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
  }

  // Lunation membership for a whole calendar day is decided at local
  // noon (matches every per-day moon-data lookup in this app). Bounds
  // for the *title/navigation* must use the same noon convention as the
  // grid cells, or a date near a new-moon boundary could be classified
  // into different lunations depending on which code path asks.
  function atNoon(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  }

  // Grid: Monday-first weeks, spanning from the week containing the
  // lunation's new-moon start through enough weeks to cover its end
  // (a lunation is 29-30 days, so 5 or 6 weeks of 7 = 35-42 cells).
  function buildLunationGrid(bounds) {
    const startDay = new Date(
      bounds.start.getFullYear(), bounds.start.getMonth(), bounds.start.getDate()
    );
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

  /**
   * @param {HTMLElement} gridEl
   * @param {HTMLElement} titleEl
   * @param {HTMLElement} subtitleEl
   * @param {{selectedDate:Date, today:Date}} state
   * @param {(date:Date)=>void} onSelect
   */
  function renderCalendar(gridEl, titleEl, subtitleEl, state, onSelect) {
    const { selectedDate, today } = state;
    const bounds = global.MoonCalc.getLunationBounds(atNoon(selectedDate));

    titleEl.textContent = `Lunation #${bounds.number} — New Moon in ${bounds.sunZodiac}`;
    subtitleEl.textContent = `${fmtShort(bounds.start)} → ${fmtShort(new Date(bounds.end.getTime() - 1))}, ${bounds.start.getFullYear()}`;

    const days = buildLunationGrid(bounds);
    gridEl.innerHTML = '';
    const frag = document.createDocumentFragment();

    days.forEach((date) => {
      const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      const inLunation = noon >= bounds.start && noon < bounds.end;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day-cell';
      cell.setAttribute('role', 'gridcell');
      if (!inLunation) cell.classList.add('outside');
      if (isSameDay(date, today)) cell.classList.add('today');
      if (selectedDate && isSameDay(date, selectedDate)) cell.classList.add('selected');

      const num = document.createElement('span');
      num.className = 'day-num';
      if (inLunation) {
        const lunarDay = Math.floor((noon - bounds.start) / 86400000) + 1;
        num.textContent = String(lunarDay);
      } else {
        num.textContent = '·';
      }

      const greg = document.createElement('span');
      greg.className = 'day-greg';
      greg.textContent = fmtShort(date);

      const canvas = document.createElement('canvas');
      canvas.width = 22;
      canvas.height = 22;

      cell.appendChild(num);
      cell.appendChild(canvas);
      cell.appendChild(greg);
      cell.setAttribute(
        'aria-label',
        `${date.toDateString()}${inLunation ? ', day ' + num.textContent + ' of lunation #' + bounds.number : ', outside this lunation'}`
      );
      cell.addEventListener('click', () => onSelect(date));

      frag.appendChild(cell);

      const data = global.MoonCalc.getMoonData(noon);
      global.drawMoonIcon(canvas, data.illumination, data.elongation < 180);
    });

    gridEl.appendChild(frag);
    return bounds;
  }

  global.MoonCalendar = { buildLunationGrid, renderCalendar, isSameDay, atNoon };
})(typeof window !== 'undefined' ? window : globalThis);
