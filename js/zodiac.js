/*
 * zodiac.js -> window.ZodiacLore, window.drawConstellation
 *
 * Traditional lore + a simplified constellation stick-figure for each of
 * the 12 zodiac signs already computed by moon.js (ZODIAC array in
 * moon.js, same spelling: 'Scorpio', 'Capricorn', etc.).
 *
 * Element / modality / ruling planet are real, standard Western tropical-
 * zodiac classifications (triplicities/quadruplicities), not invented for
 * this app. Rulers are the seven classical planets only, matching the
 * classical-era Sun/Moon formulas moon.js already uses -- modern astrology
 * also assigns Uranus/Neptune/Pluto to Aquarius/Pisces/Scorpio, omitted
 * here for that consistency.
 *
 * The star figures are simplified "connect-the-dots" shapes in the
 * tradition of H.A. Rey's The Stars: A New Way to See Them (1952), not
 * star-catalog-accurate RA/Dec projections -- illustrative, like the
 * app's low-precision astronomy formulas are honest about being.
 */
(function (global) {
  'use strict';

  const LORE = {
    Aries: { element: 'Fire', modality: 'Cardinal', ruler: 'Mars', glyph: '♈', trait: 'bold, energetic, pioneering' },
    Taurus: { element: 'Earth', modality: 'Fixed', ruler: 'Venus', glyph: '♉', trait: 'patient, grounded, sensual' },
    Gemini: { element: 'Air', modality: 'Mutable', ruler: 'Mercury', glyph: '♊', trait: 'curious, adaptable, communicative' },
    Cancer: { element: 'Water', modality: 'Cardinal', ruler: 'Moon', glyph: '♋', trait: 'nurturing, intuitive, protective' },
    Leo: { element: 'Fire', modality: 'Fixed', ruler: 'Sun', glyph: '♌', trait: 'bold, dramatic, warm-hearted' },
    Virgo: { element: 'Earth', modality: 'Mutable', ruler: 'Mercury', glyph: '♍', trait: 'meticulous, analytical, modest' },
    Libra: { element: 'Air', modality: 'Cardinal', ruler: 'Venus', glyph: '♎', trait: 'diplomatic, fair-minded, sociable' },
    Scorpio: { element: 'Water', modality: 'Fixed', ruler: 'Mars', glyph: '♏', trait: 'intense, resourceful, magnetic' },
    Sagittarius: { element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', glyph: '♐', trait: 'adventurous, optimistic, blunt' },
    Capricorn: { element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', glyph: '♑', trait: 'disciplined, ambitious, patient' },
    Aquarius: { element: 'Air', modality: 'Fixed', ruler: 'Saturn', glyph: '♒', trait: 'independent, inventive, idealistic' },
    Pisces: { element: 'Water', modality: 'Mutable', ruler: 'Jupiter', glyph: '♓', trait: 'dreamy, empathetic, artistic' },
  };

  // Points normalized to a 0-100 square; drawConstellation() scales them
  // to the canvas's actual pixel size. `lines` are index pairs into `stars`.
  const SHAPES = {
    Aries: { stars: [[30, 70], [50, 55], [75, 35]], lines: [[0, 1], [1, 2]] },
    Taurus: { stars: [[50, 65], [25, 35], [70, 30], [15, 15], [80, 10]], lines: [[0, 1], [0, 2], [1, 3], [2, 4]] },
    Gemini: { stars: [[35, 15], [35, 45], [35, 75], [65, 15], [65, 45], [65, 75]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [2, 5]] },
    Cancer: { stars: [[30, 25], [70, 25], [50, 45], [50, 75]], lines: [[0, 2], [1, 2], [2, 3]] },
    Leo: { stars: [[30, 20], [25, 35], [22, 50], [28, 62], [55, 45], [75, 55], [60, 65]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 3]] },
    Virgo: { stars: [[25, 20], [45, 30], [35, 45], [55, 50], [70, 65]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    Libra: { stars: [[30, 30], [70, 30], [75, 60], [25, 60]], lines: [[0, 1], [1, 2], [2, 3], [3, 0]] },
    Scorpio: { stars: [[30, 15], [40, 12], [45, 22], [42, 35], [48, 48], [58, 55], [68, 55], [75, 48], [80, 38]], lines: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
    Sagittarius: { stars: [[35, 35], [55, 32], [60, 55], [32, 58], [72, 40], [20, 45]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [0, 5]] },
    Capricorn: { stars: [[20, 30], [80, 35], [45, 65]], lines: [[0, 1], [1, 2], [2, 0]] },
    Aquarius: { stars: [[45, 20], [35, 35], [55, 35], [45, 45], [50, 60], [58, 72], [48, 82]], lines: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6]] },
    Pisces: { stars: [[25, 20], [32, 15], [38, 22], [33, 30], [25, 28], [45, 55], [65, 75], [80, 68], [78, 85]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [3, 5], [5, 6], [6, 7], [6, 8]] },
  };

  function getInfo(signName) {
    return LORE[signName] || null;
  }

  // Same shape as drawMoonIcon() in moondraw.js: plain canvas 2D, redrawn
  // from scratch each call, colors as overridable defaults rather than
  // read from CSS -- callers (app.js) pass theme-appropriate opts instead.
  function drawConstellation(canvas, signName, opts) {
    const shape = SHAPES[signName];
    if (!canvas || !shape) return;

    const options = Object.assign(
      { star: '#f4ecd8', line: 'rgba(244, 236, 216, 0.55)' },
      opts || {}
    );
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scaleX = (x) => (x / 100) * w;
    const scaleY = (y) => (y / 100) * h;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = options.line;
    ctx.lineWidth = 1.25;
    ctx.lineJoin = 'round';
    shape.lines.forEach(([a, b]) => {
      const [ax, ay] = shape.stars[a];
      const [bx, by] = shape.stars[b];
      ctx.beginPath();
      ctx.moveTo(scaleX(ax), scaleY(ay));
      ctx.lineTo(scaleX(bx), scaleY(by));
      ctx.stroke();
    });

    ctx.fillStyle = options.star;
    shape.stars.forEach(([x, y], i) => {
      const r = i === 0 ? 2.6 : 2.1; // slightly larger "lead" star
      ctx.beginPath();
      ctx.arc(scaleX(x), scaleY(y), r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  global.ZodiacLore = { getInfo };
  global.drawConstellation = drawConstellation;
})(window);
