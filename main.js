import { createCloth } from './cloth.js';

/* ================= Config — edit these ================= */
const CONFIG = {
  name: 'George Paraschos',
  email: 'george@paraschos.site',
  // Formspree (https://formspree.io) endpoint, e.g. "https://formspree.io/f/abcdwxyz".
  // Leave empty to fall back to opening the visitor's mail client.
  formEndpoint: '',
  timeZone: 'Europe/Athens',
};

const ICONS = {
  inspector: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><g opacity=".55"><rect x="14" y="14" width="64" height="64"/><path d="M30 14v64M46 14v64M62 14v64M14 30h64M14 46h64M14 62h64"/></g><rect x="46" y="46" width="16" height="16" fill="currentColor" opacity=".9"/><circle cx="68" cy="68" r="24" stroke-width="3"/><path d="M85 85l22 22" stroke-width="7" stroke-linecap="square"/></svg>`,
  camera: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 34V12h22M86 12h22v22M108 86v22H86M34 108H12V86"/><circle cx="60" cy="60" r="28"/><circle cx="60" cy="60" r="12"/><circle cx="60" cy="60" r="3" fill="currentColor"/><path d="M60 32v10M60 78v10M32 60h10M78 60h10" stroke-width="2"/><text x="14" y="104" font-family="monospace" font-size="9" fill="currentColor" stroke="none">FACE 0.98</text></svg>`,
  airline: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="60" cy="62" r="36"/><ellipse cx="60" cy="62" rx="15" ry="36" opacity=".6"/><path d="M24 62h72M30 44h60M30 80h60" opacity=".6"/><path d="M10 96C34 40 80 22 110 30" stroke-width="2.5" stroke-dasharray="5 6"/><path d="M112 30l-13-8 3 8-3 8z" fill="currentColor" stroke="none"/></svg>`,
};

const PROJECTS = [
  {
    title: 'Image Inspector',
    category: 'Desktop app',
    year: '2026',
    desc: 'Open any image and see everything about it: metadata, GPS, colour palette, privacy flags and the raw container structure. Everything runs locally — nothing is uploaded.',
    highlights: ['EXIF & GPS with a map link', 'Palette, histograms & colour stats', 'Privacy flags + MD5 / SHA hashes', 'PNG chunk / JPEG segment walk'],
    stack: ['Python', 'Tkinter', 'Pillow', 'EXIF'],
    link: 'https://github.com/paraschosg/image-inspector',
    icon: ICONS.inspector,
  },
  {
    title: 'Camera Recognition',
    category: 'Computer vision',
    year: '2026',
    desc: 'A browser app that watches through your webcam and tells you what it sees — hand gestures, mood, room light — and lets you drive the real mouse and keyboard hands-free. All inference runs on-device.',
    highlights: ['Gesture tracking for two hands', 'Emotion from 52 face blendshapes', 'Hand & head pointer control', 'No video leaves the machine'],
    stack: ['JavaScript', 'MediaPipe', 'Python', 'WebSocket'],
    link: 'https://github.com/paraschosg/Camera-recognition',
    icon: ICONS.camera,
  },
  {
    title: 'Airline Management System',
    category: 'Backend system',
    year: '2025',
    desc: 'Flight booking end to end, with a state machine that refuses to let a flight board twice. The flight lifecycle is enforced in the domain layer, not the UI.',
    highlights: ['Flight lifecycle state machine', 'REST API on Spring Boot', 'Spring Data JPA over MySQL', 'Plain JS frontend, no build step'],
    stack: ['Java', 'Spring Boot', 'JPA', 'MySQL'],
    link: 'https://github.com/paraschosg/airline-management-system',
    icon: ICONS.airline,
  },
];

const ROUTES = ['index', 'work', 'about', 'contact'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= Text scramble (decode effect) ================= */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>_';
function scramble(el, duration = 550, text) {
  if (!el) return;
  text = text ?? el.dataset.text ?? el.textContent;
  el.dataset.text = text;
  if (reduceMotion) { el.textContent = text; return; }
  cancelAnimationFrame(el._raf);
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const shown = Math.floor(p * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      out += i < shown || text[i] === ' ' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
// hover-scramble on menu items and buttons
$$('a, button').forEach((el) => {
  const target = $('[data-scramble]', el);
  if (target) el.addEventListener('mouseenter', () => scramble(target, 380));
});

/* ================= Giant titles: split into letters ================= */
$$('[data-split]').forEach((el) => {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map((ch, i) => `<span class="ch" style="--c:${i}" aria-hidden="true">${ch}</span>`).join('');
});

/* ================= About: skills ticker (built from the skill tags) ================= */
(function ticker() {
  const skills = $$('.skills .tags li').map((li) => li.textContent);
  const run = `<span>${skills.join('<i>✦</i>')}<i>✦</i></span>`;
  $('.ticker-track').innerHTML = run + run;
})();

/* ================= Work: list + preview ================= */
const plist = $('#plist');
plist.setAttribute('role', 'tablist');
plist.innerHTML = PROJECTS.map((p, i) => `
  <li role="presentation">
    <button role="tab" aria-selected="${i === 0}" data-i="${i}">
      <span class="n mono">${String(i + 1).padStart(3, '0')}</span>
      <span class="t">${p.title}</span>
      <span class="m mono"><span>${p.category}</span><span class="leader"></span><span>${p.year}</span></span>
    </button>
  </li>`).join('');

let selected = -1;
function selectProject(i, animate = true) {
  if (i === selected) return;
  selected = i;
  const p = PROJECTS[i];
  $$('button', plist).forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
  $('#screen-icon').innerHTML = p.icon;
  $('#screen-idx').textContent = `${String(i + 1).padStart(3, '0')} / ${String(PROJECTS.length).padStart(3, '0')}`;
  $('#screen-cat').textContent = p.category;
  $('#p-kicker').textContent = `Project ${String(i + 1).padStart(3, '0')}`;
  $('#p-year').textContent = p.year;
  $('#p-desc').textContent = p.desc;
  $('#p-hl').innerHTML = p.highlights.map((h) => `<li>${h}</li>`).join('');
  $('#p-stack').innerHTML = p.stack.map((s) => `<li>${s}</li>`).join('');
  $('#p-link').href = p.link;
  const title = $('#p-title');
  if (animate) {
    scramble(title, 450, p.title);
    const screen = $('#screen');
    screen.classList.remove('is-switch'); void screen.offsetWidth; screen.classList.add('is-switch');
  } else { title.textContent = p.title; title.dataset.text = p.title; }
}
$$('button', plist).forEach((b) => {
  const i = +b.dataset.i;
  b.addEventListener('mouseenter', () => selectProject(i));
  b.addEventListener('focus', () => selectProject(i));
  b.addEventListener('click', () => selectProject(i));
});
plist.addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  const n = (selected + (e.key === 'ArrowDown' ? 1 : -1) + PROJECTS.length) % PROJECTS.length;
  $$('button', plist)[n].focus();
});
selectProject(0, false);

// running VHS timecode on the preview screen
(function timecode() {
  const el = $('#tc'), t0 = performance.now();
  setInterval(() => {
    if (current !== 'work') return;
    const f = Math.floor(((performance.now() - t0) / 1000) * 25);
    const pad = (n) => String(n).padStart(2, '0');
    el.textContent = `TC ${pad(Math.floor(f / 90000) % 24)}:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`;
  }, 40);
})();

/* ================= 3D cloth (landing only) ================= */
let cloth = null;
async function initCloth() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('800 100px "Inter Tight"'),
        document.fonts.load('700 40px "Courier Prime"'),
        document.fonts.load('400 40px "Courier Prime"'),
      ]),
      wait(2500),
    ]);
  } catch { /* fall back to system fonts */ }
  cloth = createCloth($('#cloth'), { name: CONFIG.name, reduceMotion });
  if (current === 'index') cloth.start();
}
if (isTouch) $('#hint').textContent = '[ Touch & drag the fabric ]';

/* ================= Router + CRT channel-switch transition ================= */
const views = Object.fromEntries($$('[data-view]').map((v) => [v.dataset.view, v]));
const tv = $('.tv'), tvTitle = $('#tv-title');
let current = null, busy = false, pending = null;

// static noise for the TV
const noiseCtx = $('.tv-noise').getContext('2d');
const noiseImg = noiseCtx.createImageData(160, 90);
let noiseOn = false;
function noise() {
  if (!noiseOn) return;
  const d = noiseImg.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  noiseCtx.putImageData(noiseImg, 0, 0);
  requestAnimationFrame(noise);
}

function routeFromHash() {
  const r = location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(r) ? r : 'index';
}

function activate(route) {
  Object.entries(views).forEach(([k, v]) => v.classList.toggle('is-active', k === route));
  const idx = ROUTES.indexOf(route);
  $$('.nav a').forEach((a) => (a.dataset.route === route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('#page-code').textContent = `[ GP_${route.toUpperCase()} ]`;
  $('#page-num').textContent = `Page ${String(idx).padStart(2, '0')} / 03`;
  document.title = route === 'index' ? `${CONFIG.name} — Portfolio` : `${route[0].toUpperCase() + route.slice(1)} — ${CONFIG.name}`;
  if (cloth) route === 'index' ? (cloth.drop(), cloth.start()) : cloth.stop();
  current = route;
}

function enter(route) {
  const v = views[route];
  $$('.a', v).forEach((el, i) => el.style.setProperty('--i', i));
  v.classList.remove('is-entering'); void v.offsetWidth; v.classList.add('is-entering');
  $$('.head-meta .row span:not(.leader), .index-top span:not(.leader)', v).forEach((el, i) => setTimeout(() => scramble(el, 500), 150 + i * 60));
  if (route === 'work') scramble($('#p-title'), 600);
}

async function go(route, first = false) {
  if (route === current) return;
  if (busy) { pending = route; return; }
  busy = true;

  const idx = ROUTES.indexOf(route);
  $('#tv-ch').textContent = String(idx).padStart(2, '0');
  tvTitle.textContent = route.toUpperCase();

  if (reduceMotion) {
    activate(route); enter(route); busy = false; return;
  }

  tv.classList.add('on');
  noiseOn = true; noise();
  const easeIO = 'cubic-bezier(.76,0,.24,1)';

  // 1 — blue band with static opens from the centre line
  await tv.animate(
    [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(49.5% 0 49.5% 0)', offset: 0.25 }, { clipPath: 'inset(0% 0 0% 0)' }],
    { duration: first ? 700 : 480, easing: easeIO, fill: 'forwards' },
  ).finished;

  // 2 — tune in: title decodes, signal bars fill
  scramble(tvTitle, first ? 800 : 480, route.toUpperCase());
  const pct = $('#tv-pct'), sig = $('#tv-sig');
  const hold = first ? 950 : 560, t0 = performance.now();
  (function count() {
    const p = Math.min(1, (performance.now() - t0) / hold);
    pct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
    sig.textContent = `Signal ${'▮'.repeat(1 + Math.round(p * 3))}${'▯'.repeat(3 - Math.round(p * 3))}`;
    if (p < 1) requestAnimationFrame(count);
  })();
  activate(route);
  await wait(hold);

  // 3 — CRT power-off: collapse to a bright line, then to a dot
  await tv.animate(
    [{ clipPath: 'inset(0% 0 0% 0)', filter: 'brightness(1)' }, { clipPath: 'inset(49.7% 0 49.7% 0)', filter: 'brightness(2.6)' }],
    { duration: 260, easing: 'cubic-bezier(.7,0,.84,0)', fill: 'forwards' },
  ).finished;
  enter(route);
  await tv.animate(
    [{ clipPath: 'inset(49.7% 0 49.7% 0)', filter: 'brightness(2.6)' }, { clipPath: 'inset(49.7% 50% 49.7% 50%)', filter: 'brightness(4)' }],
    { duration: 220, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' },
  ).finished;

  tv.classList.remove('on');
  tv.getAnimations().forEach((a) => a.cancel());
  noiseOn = false;
  busy = false;
  if (pending && pending !== current) { const p = pending; pending = null; go(p); } else pending = null;
}

addEventListener('hashchange', () => go(routeFromHash()));
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const n = ['0', '1', '2', '3'].indexOf(e.key);
  if (n >= 0) location.hash = n === 0 ? '#/' : `#/${ROUTES[n]}`;
});

/* ================= Header clock & date ================= */
(function clock() {
  const t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.timeZone });
  const d = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: CONFIG.timeZone });
  const update = () => { $('#clock').textContent = t.format(new Date()); $('#date').textContent = d.format(new Date()); };
  update(); setInterval(update, 10000);
})();

/* ================= Contact form ================= */
(function form() {
  const f = $('#contact-form');
  const status = $('.form-status', f);
  const btn = $('button', f);
  $('#mail-link').href = `mailto:${CONFIG.email}`;
  const setStatus = (msg, cls = '') => { status.textContent = msg; status.className = `form-status mono ${cls}`; };

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    $$('.field', f).forEach((field) => {
      const input = $('input, textarea', field);
      const valid = input.checkValidity() && input.value.trim() !== '';
      field.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return setStatus('Please fill in every field.', 'err');

    const data = Object.fromEntries(new FormData(f));
    if (!CONFIG.formEndpoint) {
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Portfolio enquiry — ' + data.name)}&body=${encodeURIComponent(body)}`;
      return setStatus('Opening your email app…', 'ok');
    }
    btn.disabled = true; setStatus('Transmitting…');
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      f.reset(); setStatus('Message received. Talk soon.', 'ok');
    } catch {
      setStatus(`Signal lost — email ${CONFIG.email}`, 'err');
    } finally { btn.disabled = false; }
  });
  f.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));
})();

/* ================= Boot ================= */
go(routeFromHash(), true);
initCloth();
