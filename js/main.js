import { Stage } from './stage.js';
import { makeGeorge, makeDuo } from './avatar.js';
import { makeCartridge, makeKeyboard, makeChest, makeEnvelope, makeFloppy, makeInspector, makeWebcam, makePlane } from './props.js';
import { CONFIG, PROJECTS, STAT_LABELS, PLAYER, STORY, SKILLS, QUESTS, TICKER } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
const pad = n => String(n).padStart(2, '0');
const wait = ms => new Promise(r => setTimeout(r, ms));

const screen = $('#screen');
const pagesEl = $('#pages');
const pages = Object.fromEntries($$('.page').map(p => [p.dataset.page, p]));

/* ---------------- sound (tiny WebAudio blips) ---------------- */
const Sound = {
  ctx: null,
  on: (() => { try { return localStorage.getItem('gp-snd') !== 'off'; } catch { return true; } })(),
  init() { if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } },
  tone(freq, dur = 0.06, type = 'square', vol = 0.035, delay = 0, slideTo = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  move() { this.tone(880, 0.035, 'square', 0.02); },
  select() { this.tone(523, 0.06); this.tone(784, 0.09, 'square', 0.035, 0.06); },
  back() { this.tone(494, 0.05); this.tone(330, 0.08, 'square', 0.035, 0.05); },
  jump() { this.tone(300, 0.16, 'square', 0.035, 0, 900); },
  meow() { this.tone(700, 0.12, 'triangle', 0.05, 0.12, 1100); this.tone(1100, 0.22, 'triangle', 0.045, 0.24, 520); },
  start() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.035, i * 0.08)); },
};
const sndBtn = $('#snd');
const paintSnd = () => { sndBtn.setAttribute('aria-pressed', Sound.on); sndBtn.querySelector('b').textContent = Sound.on ? 'ON' : 'OFF'; };
paintSnd();
sndBtn.addEventListener('click', () => {
  Sound.on = !Sound.on;
  try { localStorage.setItem('gp-snd', Sound.on ? 'on' : 'off'); } catch { /* private mode */ }
  paintSnd();
  Sound.init(); Sound.select();
});

/* ---------------- static content ---------------- */
function buildContent() {
  $('#game-grid').innerHTML = PROJECTS.map((p, i) => `
    <a class="game-card" href="#work/${p.id}" data-nav>
      <span class="num px">GAME ${pad(i + 1)}</span>
      <div class="view" data-project="${p.id}"></div>
      <p class="name">${p.title}</p>
      <p class="pill px">${p.kind.toUpperCase()} · ${p.year}</p>
      <p class="play px">▶ PRESS TO PLAY</p>
    </a>`).join('');

  $('#player-card').innerHTML = PLAYER.map(([k, v]) => `<dt>${k}</dt><dd${k === 'STATUS' ? ' class="ok"' : ''}>${v}</dd>`).join('');

  $('#inventory').innerHTML = SKILLS.map(g => `
    <div class="inv-group">
      <h3 class="px">${g.group}<small>${pad(g.items.length)} ITEMS</small></h3>
      <ul class="slots">${g.items.map(s => `<li class="slot" tabindex="0" data-nav><i></i>${s}</li>`).join('')}</ul>
    </div>`).join('');

  $('#quests').innerHTML = QUESTS.map(q => `
    <li class="${q.done ? 'done' : ''}"><i></i><span class="q">${q.name}</span><span class="s">${q.state}</span></li>`).join('');

  const run = TICKER.map(w => `<span>${w}</span><i></i>`).join('');
  $('#ticker').innerHTML = run + run;

  $('#gh-tile').href = CONFIG.github;
  $('#gh-link').href = CONFIG.github;
  $('#li-link').href = CONFIG.linkedin;
  $('#li-link2').href = CONFIG.linkedin;
  $('#mail-link').href = `mailto:${CONFIG.email}`;
}

/* ---------------- 3D ---------------- */
const stage = new Stage(screen, pagesEl);
let ready = false;
let detailView = null, bootView = null;

const OPTS = {
  cart: { dist: 4.4, elev: 0.18, tilt: 0, spin: 0.5, shadowSize: 2.4 },
  george: { dist: 5.0, elev: 0.1, tilt: 0, sway: 0.4, shadowSize: 1.9, bob: 0.015 },
  keyboard: { dist: 4.9, elev: 0.5, tilt: 0.05, sway: 0.45, shadowSize: 3.6, bob: 0.02 },
  chest: { dist: 4.5, elev: 0.38, tilt: 0.02, sway: 0.5, shadowSize: 3.0 },
  envelope: { dist: 4.3, elev: 0.12, tilt: 0, sway: 0.45, shadowSize: 2.4 },
  floppy: { dist: 4.1, elev: 0.15, tilt: 0, spin: 0.5, shadowSize: 2.2 },
  duo: { dist: 7.2, elev: 0.1, tilt: 0, sway: 0.3, shadowSize: 3.4, floor: 5.2, bob: 0.015, lookY: -0.08 },
  portrait: { dist: 2.35, elev: 0.02, lookY: 0.66, tilt: 0, sway: 0.15, shadow: false, bob: 0 },
  inspector: { dist: 6.0, elev: 0.25, tilt: 0, sway: 0.5, shadowSize: 3.2 },
  webcam: { dist: 6.0, elev: 0.2, tilt: 0, sway: 0.55, shadowSize: 2.4 },
  plane: { dist: 6.6, elev: 0.3, tilt: 0, sway: 0.6, shadowSize: 3.2, bob: 0.08 },
};
const BUILD = {
  cart: () => makeCartridge(),
  george: () => { const g = makeGeorge(); g.userData.autoWave = false; return g; },
  keyboard: () => makeKeyboard(),
  chest: () => makeChest(),
  envelope: () => makeEnvelope(),
  floppy: () => makeFloppy({ title: 'SOURCE', sub: '@PARASCHOSG' }),
  duo: () => makeDuo(),
  portrait: () => { const g = makeGeorge(); g.userData.autoWave = false; return g; },
  inspector: () => makeInspector(),
  webcam: () => makeWebcam(),
  plane: () => makePlane(),
};
const ALIAS = { keyboard2: 'keyboard', chest2: 'chest', envelope2: 'envelope' };
// the big side views on inner pages sit further back than the menu tiles
const BIG = { keyboard2: { dist: 6.2 }, chest2: { dist: 5.8 }, envelope2: { dist: 5.8 } };

async function build3D() {
  const loadN = $('#load-n'), bar = $('#load-bar');
  try { await Promise.all(['16px "Press Start 2P"', '800 20px "Inter Tight"', '14px "JetBrains Mono"'].map(f => document.fonts.load(f))); } catch { /* fallback fonts */ }

  bootView = stage.add($('#boot-view'), makeDuo(), { ...OPTS.duo, dist: 6.2, lookY: -0.05, noClip: true, hoverEl: $('#boot-view') });
  await nextFrame();

  // everything else, a few at a time so the loading bar moves
  const els = [
    ...$$('.view[data-obj]').map(el => [el, ALIAS[el.dataset.obj] || el.dataset.obj, BIG[el.dataset.obj]]),
    ...$$('.view[data-project]').map(el => [el, PROJECTS.find(p => p.id === el.dataset.project).obj]),
  ];
  const total = new Set(els.map(([, kind]) => kind)).size;
  loadN.textContent = `0/${total}`;
  const seen = new Set();
  for (const [el, kind, big] of els) {
    const opts = { ...OPTS[kind], ...big, hoverEl: el.closest('a, .dialog') || el };
    if (kind === 'duo') Object.assign(opts, { drag: true });
    const v = stage.add(el, BUILD[kind](), opts);
    if (kind === 'duo') el.addEventListener('tapped', () => { Sound.jump(); setTimeout(() => Sound.meow(), 150); });
    if (!seen.has(kind)) {
      seen.add(kind);
      const n = Math.min(total, seen.size);
      loadN.textContent = `${n}/${total}`;
      bar.style.width = `${(n / total) * 100}%`;
      await nextFrame();
    }
  }
  detailView = stage.add($('#detail-view'), null, { dist: 7.4, elev: 0.3, tilt: 0, spin: 0.35, drag: true, floor: 4.4, shadowSize: 3.2, bob: 0.04 });
  $('#detail-view').addEventListener('tapped', () => Sound.jump());

  ready = true;
  loadN.textContent = `${total}/${total}`;
  bar.style.width = '100%';
  await wait(200);
  $('#boot-load').hidden = true;
  $('#press').hidden = false;
  if (current === 'project') showProject(currentArg);
}

/* ---------------- router ---------------- */
let current = 'boot', currentArg = null, first = true;

const TITLES = { home: 'MAIN MENU', work: 'PROJECTS', about: 'PLAYER 1', skills: 'INVENTORY', quests: 'SIDE QUESTS', contact: 'MESSAGE' };
const DOC_TITLES = { work: 'Projects', about: 'About', skills: 'Skills', quests: 'Now', contact: 'Contact' };

function parse() {
  const [p, arg] = location.hash.replace(/^#\/?/, '').split('/');
  let page = p || 'boot';
  if (page === 'work' && arg) page = 'project';
  if (!pages[page]) page = 'home';
  return { page, arg };
}

function parentOf(page) {
  if (page === 'project') return '#work';
  if (page === 'home') return '#';
  return '#home';
}

function route() {
  const { page, arg } = parse();
  const changed = page !== current || arg !== currentArg;
  if (!changed && !first) return;
  if (!first) { const g = $('#glitch'); g.classList.remove('on'); void g.offsetWidth; g.classList.add('on'); }

  Object.values(pages).forEach(p => p.classList.toggle('active', p === pages[page]));
  screen.classList.toggle('is-boot', page === 'boot');
  current = page; currentArg = arg;

  const crumbs = ['<a href="#home">HOME</a>'];
  if (page === 'project') {
    const p = PROJECTS.find(k => k.id === arg);
    crumbs.push('<a href="#work">PROJECTS</a>', `<b>${(p ? p.title : '').toUpperCase()}</b>`);
  } else if (TITLES[page] && page !== 'home') crumbs.push(`<b>${TITLES[page]}</b>`);
  $('#crumbs').innerHTML = crumbs.join('<span>›</span>');
  $('#back').href = parentOf(page);
  $('#back').hidden = page === 'home';

  if (page === 'project') showProject(arg);
  else document.title = DOC_TITLES[page] ? `${DOC_TITLES[page]} — ${CONFIG.name}` : `${CONFIG.name} — Portfolio`;

  if (page === 'about') startStory();
  pagesEl.scrollTop = 0;

  if (!first && usingKeys) requestAnimationFrame(() => { const f = pages[page].querySelector('[data-nav]'); f && f.focus({ preventScroll: true }); });
  first = false;
}
window.addEventListener('hashchange', route);

function showProject(id) {
  const i = PROJECTS.findIndex(p => p.id === id);
  if (i < 0) { location.hash = '#work'; return; }
  const p = PROJECTS[i];
  $('#d-idx').textContent = `GAME ${pad(i + 1)}/${pad(PROJECTS.length)}`;
  $('#d-name').textContent = p.title;
  $('#d-kind').textContent = `${p.kind.toUpperCase()} · ${p.year}`;
  $('#d-desc').textContent = p.desc;
  $('#d-stats').innerHTML = STAT_LABELS.map(([k, label]) =>
    `<dt>${label}</dt><dd aria-label="${p.stats[k]} of 5">${Array.from({ length: 5 }, (_, j) => `<i class="${j < p.stats[k] ? 'on' : ''}"></i>`).join('')}</dd>`).join('');
  $('#d-stack').innerHTML = p.stack.map(s => `<li>${s}</li>`).join('');
  $('#d-link').href = p.link;
  $('#d-prev').href = `#work/${PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length].id}`;
  $('#d-next').href = `#work/${PROJECTS[(i + 1) % PROJECTS.length].id}`;
  document.title = `${p.title} — ${CONFIG.name}`;
  if (ready && detailView) {
    detailView.setObject(BUILD[p.obj]());
    detailView.sqV += 4;
  }
}

/* ---------------- boot / start ---------------- */
function crtOn() {
  const el = $('#crt-on');
  el.classList.remove('run'); void el.offsetWidth; el.classList.add('run');
}
let starting = false;
async function start() {
  if (!ready || current !== 'boot' || starting) return;
  starting = true;
  Sound.init(); Sound.start();
  // George and the cat hop before the screen switches
  const duo = bootView.obj.userData;
  duo.george.userData.jump();
  setTimeout(() => duo.cat.userData.jump(), 120);
  bootView.sqV += 4;
  await wait(stage.reduced ? 0 : 520);
  crtOn();
  location.hash = '#home';
  starting = false;
}
$('#press').addEventListener('click', start);
pages.boot.addEventListener('click', e => { if (e.target.closest('.press')) return; start(); });

/* ---------------- about: typewriter dialogue ---------------- */
let storyI = 0, typing = null;
function typeLine(i) {
  const el = $('#line'), txt = STORY[i];
  clearInterval(typing);
  if (stage.reduced) { el.textContent = txt; typing = null; return; }
  let n = 0;
  el.textContent = '';
  typing = setInterval(() => {
    n++;
    el.textContent = txt.slice(0, n);
    if (n % 3 === 0) Sound.tone(1200 + Math.random() * 300, 0.02, 'square', 0.012);
    if (n >= txt.length) { clearInterval(typing); typing = null; }
  }, 26);
}
function startStory() { storyI = 0; typeLine(0); }
function advanceStory() {
  if (typing) { clearInterval(typing); typing = null; $('#line').textContent = STORY[storyI]; return; }
  storyI = (storyI + 1) % STORY.length;
  Sound.move();
  typeLine(storyI);
}
$('#dialog').addEventListener('click', advanceStory);
$('#dialog').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advanceStory(); } });

/* ---------------- input: keyboard as a gamepad ---------------- */
let usingKeys = false;
window.addEventListener('pointerdown', () => { usingKeys = false; Sound.init(); }, true);

function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
function move(dir) {
  const items = $$('[data-nav]', pages[current]).filter(visible);
  if (!items.length) return;
  const cur = items.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) { items[0].focus(); items[0].scrollIntoView({ block: 'nearest' }); Sound.move(); return; }
  const a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of items) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect(), dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
    const along = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy;
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 4) continue;
    const score = along + across * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest', behavior: stage.reduced ? 'auto' : 'smooth' }); Sound.move(); }
}

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typingInField = e.target.closest && e.target.closest('input, textarea');
  if (typingInField && e.key !== 'Escape') return;
  usingKeys = true;
  if (current === 'boot') {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
    return;
  }
  const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (current === 'project' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    Sound.move();
    location.hash = $(e.key === 'ArrowLeft' ? '#d-prev' : '#d-next').getAttribute('href');
    return;
  }
  if (dirs[e.key]) { e.preventDefault(); move(dirs[e.key]); return; }
  if (e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault();
    if (typingInField) e.target.blur();
    Sound.back();
    location.hash = parentOf(current);
  }
});

// select / back sounds + hover blips
document.addEventListener('click', e => {
  const a = e.target.closest('a, button');
  if (!a || a.id === 'snd' || a.id === 'press') return;
  if (a.id === 'back') Sound.back(); else Sound.select();
});
let lastBlip = 0;
document.addEventListener('pointerover', e => {
  const el = e.target.closest('[data-nav]');
  if (!el || el.contains(e.relatedTarget) || el.matches('input, textarea')) return;
  const now = performance.now();
  if (now - lastBlip > 60) { Sound.move(); lastBlip = now; }
});

/* ---------------- clock (Athens time) ---------------- */
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
function tick() { $('#clock').textContent = fmt.format(new Date()); }
tick();
setInterval(tick, 15000);

/* ---------------- contact form ---------------- */
(function form() {
  const f = $('#contact-form');
  const status = $('.form-status', f);
  const btn = $('button[type="submit"]', f);
  const say = (msg, cls = '') => { status.textContent = msg; status.className = `form-status px ${cls}`; };
  f.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    $$('.field', f).forEach(field => {
      const input = $('input, textarea', field);
      const valid = input.checkValidity() && input.value.trim() !== '';
      field.classList.toggle('bad', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { Sound.back(); return say('MISSING INPUT. TRY AGAIN.', 'err'); }
    const data = Object.fromEntries(new FormData(f));
    if (!CONFIG.formEndpoint) {
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Hello from paraschos.site — ' + data.name)}&body=${encodeURIComponent(body)}`;
      return say('OPENING YOUR MAIL APP…', 'ok');
    }
    btn.disabled = true; say('SENDING…');
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      f.reset(); say('MESSAGE SENT. +100 XP', 'ok'); Sound.start();
    } catch (err) {
      Sound.back();
      say(`${/^[A-Z .]+$/.test(err.message) ? err.message : 'CONNECTION LOST.'} EMAIL ${CONFIG.email.toUpperCase()}`, 'err');
    } finally { btn.disabled = false; }
  });
  f.addEventListener('input', e => e.target.closest('.field')?.classList.remove('bad'));
})();

/* ---------------- go ---------------- */
buildContent();
route();
crtOn();
build3D();
