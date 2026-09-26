// George as a little chibi 3D character, plus his tabby cat sidekick.
// Everything is built from primitives (no model files). Both rigs animate themselves
// through userData.tick (blink, look at the cursor, wave, jump) — see stage.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeNoise, clamp } from './noise.js';
import { canvasTex } from './props.js';

// Edit these to tweak the look.
export const AVATAR = {
  skin: '#e7b894',
  skinShade: '#d69f7b',
  hair: '#1d1612',
  tee: '#17181c',
  jeans: '#2e3f5f',
  shoes: '#f3f2ee',
  sole: '#111216',
  mouth: '#7a3326',
  eye: '#141519',
};

const std = (color, roughness = 0.75, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* ------------------------------------------------------------------ */
/* George                                                              */
/* ------------------------------------------------------------------ */
export function makeGeorge() {
  const A = AVATAR;
  const skin = std(A.skin, 0.62), skinShade = std(A.skinShade, 0.65);
  const hairMat = std(A.hair, 0.5);
  const tee = std(A.tee, 0.92), jeans = std(A.jeans, 0.88);
  const shoe = std(A.shoes, 0.55), sole = std(A.sole, 0.5);
  const ink = std(A.eye, 0.3);

  const body = new THREE.Group();

  // sneakers + legs + hips
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.13, 0.34, 3, 0.055), shoe);
    sh.position.set(s * 0.135, 0.075, 0.045);
    const so = new THREE.Mesh(new RoundedBoxGeometry(0.235, 0.045, 0.355, 2, 0.02), sole);
    so.position.set(s * 0.135, 0.022, 0.045);
    const lace = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.02, 0.12, 2, 0.008), sole);
    lace.position.set(s * 0.135, 0.145, 0.1);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.106, 0.52, 18), jeans);
    leg.position.set(s * 0.13, 0.4, 0);
    body.add(sh, so, lace, leg);
  }
  const hips = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.2, 0.3, 3, 0.08), jeans);
  hips.position.y = 0.68;
  body.add(hips);

  // torso: black tee with a tiny "GP" print
  const torso = new THREE.Group();
  torso.position.y = 0.74;
  const chest = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.56, 0.34, 3, 0.13), tee);
  chest.position.y = 0.27;
  torso.add(chest);
  const print = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.08),
    new THREE.MeshStandardMaterial({ map: pixelText('GP', '#f1efe8'), transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  print.position.set(0.12, 0.37, 0.171);
  torso.add(print);
  body.add(torso);

  // arms (pivot at the shoulder)
  const arms = [-1, 1].map(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.31, 1.2, 0);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.24, 16), tee);
    sleeve.position.y = -0.06;
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), tee);
    arm.add(shoulder);
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.06, 0.36, 14), skin);
    limb.position.y = -0.3;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), skin);
    hand.position.y = -0.5;
    hand.scale.set(1, 1.1, 0.9);
    arm.add(sleeve, limb, hand);
    arm.rotation.z = s * 0.12;
    body.add(arm);
    return arm;
  });

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.14, 14), skinShade);
  neck.position.y = 1.33;
  body.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.38;
  body.add(head);
  const HC = 0.44; // head centre, local
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 44, 32), skin);
  skull.scale.set(1, 0.94, 0.93);
  skull.position.y = HC;
  head.add(skull);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), skin);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(s * 0.49, HC - 0.03, -0.01);
    head.add(ear);
  }

  // eyes (blink by scaling the group), brows, nose, smile, cheeks
  const eyes = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * 0.16, HC + 0.01, 0.425);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 12), ink);
    e.scale.set(0.82, 1.28, 0.55);
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    hi.position.set(0.018, 0.03, 0.03);
    g.add(e, hi);
    head.add(g);
    return g;
  });
  const brows = [-1, 1].map(s => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.032, 0.03, 2, 0.012), hairMat);
    b.position.set(s * 0.165, HC + 0.135, 0.43);
    b.rotation.set(-0.25, s * 0.28, s * 0.07);
    head.add(b);
    return b;
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), skinShade);
  nose.position.set(0, HC - 0.07, 0.462);
  nose.scale.set(1, 0.85, 0.8);
  head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 28, Math.PI * 0.85), std(A.mouth, 0.5));
  smile.rotation.set(-0.35, 0, Math.PI + Math.PI * 0.075);
  smile.position.set(0, HC - 0.13, 0.418);
  head.add(smile);
  const blushMat = new THREE.MeshStandardMaterial({ color: '#e8877a', transparent: true, opacity: 0.35, roughness: 0.9, depthWrite: false });
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), blushMat);
    c.scale.set(1.2, 0.7, 0.3);
    c.position.set(s * 0.27, HC - 0.1, 0.37);
    c.rotation.y = s * 0.55;
    head.add(c);
  }

  // hair: a wavy cap tilted back, plus a fringe of wavy locks ("σπαστά")
  head.add(makeHair(hairMat, HC));

  body.position.y = -1.16;
  const root = new THREE.Group();
  root.add(body);

  // ---------------- animation ----------------
  const st = { blinkT: 1.5 + Math.random() * 2, blink: 0, wave: 0, waveCD: 2.5, jumpT: -1, lift: 0, armUp: 0 };
  root.userData.jump = () => { if (st.jumpT < 0) st.jumpT = 0; };
  root.userData.wave = (secs = 1.6) => { st.wave = Math.max(st.wave, secs); };
  root.userData.onTap = () => root.userData.jump();
  root.userData.autoWave = true;
  root.userData.tick = (t, dt, v) => {
    // blink
    st.blinkT -= dt;
    if (st.blinkT < 0) { st.blink = 0.13; st.blinkT = 2 + Math.random() * 3.5; }
    st.blink -= dt;
    const eyeY = st.blink > 0 ? 0.1 : 1;
    for (const e of eyes) e.scale.y = damp(e.scale.y, eyeY, 40, dt);

    // look at the cursor (compensate for the body's own sway)
    const bodyYaw = v ? v.spinner.rotation.y : 0;
    const lx = v ? v.look.x : 0, ly = v ? v.look.y : 0;
    head.rotation.y = damp(head.rotation.y, clamp(lx * 0.75 - bodyYaw * 0.9, -0.85, 0.85), 6, dt);
    head.rotation.x = damp(head.rotation.x, clamp(ly * 0.35, -0.25, 0.35), 6, dt);
    head.rotation.z = damp(head.rotation.z, Math.sin(t * 0.9) * 0.04, 3, dt);
    for (const b of brows) b.position.y = HC + 0.135 + (v && v.hoverT > 0.5 ? 0.02 : 0);

    // breathing
    torso.scale.set(1, 1 + Math.sin(t * 2.2) * 0.012, 1);

    // wave: on hover, every few seconds on its own, or when asked
    if (root.userData.autoWave) { st.waveCD -= dt; if (st.waveCD < 0) { st.wave = 1.7; st.waveCD = 7 + Math.random() * 5; } }
    if (v && v.hoverT > 0.5) st.wave = Math.max(st.wave, 0.25);
    st.wave -= dt;
    const waving = st.wave > 0;

    // jump (squash handled by the view's spring; here: lift + arms up)
    let lift = 0;
    if (st.jumpT >= 0) {
      st.jumpT += dt;
      const p = st.jumpT / 0.6;
      if (p >= 1) st.jumpT = -1;
      else lift = Math.sin(Math.PI * p) * 0.6;
    }
    st.lift = lift;
    root.userData.lift = lift;
    body.position.y = -1.16 + lift;
    const airborne = st.jumpT >= 0;
    st.armUp = damp(st.armUp, airborne ? 1 : 0, 14, dt);

    const [armL, armR] = arms;
    const idle = Math.sin(t * 1.6) * 0.04;
    const rTarget = waving ? 2.85 + Math.sin(t * 13) * 0.28 : 0.12 + idle;
    armR.rotation.z = damp(armR.rotation.z, rTarget + st.armUp * 2.2 * (waving ? 0 : 1), 12, dt);
    armL.rotation.z = damp(armL.rotation.z, -0.12 - idle - st.armUp * 2.2, 12, dt);
    armR.rotation.x = damp(armR.rotation.x, waving ? -0.25 : 0, 8, dt);
  };
  return root;
}

// One smooth hair shell hugging the skull (same scale as the head): short at the sides,
// down to the nape at the back, a scalloped wavy hairline over the forehead and soft
// wave ridges on top. Where there is no hair the shell sinks inside the head.
function makeHair(mat, HC) {
  const n = makeNoise(21);
  let geo = new THREE.SphereGeometry(0.5, 112, 72);
  const p = geo.attributes.position, u = new THREE.Vector3();
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  for (let i = 0; i < p.count; i++) {
    u.fromBufferAttribute(p, i).normalize();
    const az = Math.atan2(u.x, u.z), a = Math.abs(az); // 0 = front, π = back
    // how low the hair reaches, going round the head
    let minY = a < 0.95 ? 0.47 - 0.12 * (a / 0.95) ** 2
      : a < 1.7 ? mix(0.35, 0.05, ss(0.95, 1.7, a))
      : mix(0.05, -0.52, ss(1.7, 2.9, a));
    minY += 0.05 * Math.sin(az * 13 + 0.7) * (1 - ss(0.75, 1.15, a)); // wavy fringe edge
    const mask = ss(minY - 0.02, minY + 0.08, u.y);
    const top = ss(0.05, 0.9, u.y);
    const waves = 0.032 * Math.sin(11 * (u.x * 0.8 + u.z * 0.5) + 3.2 * u.y + 1.8 * n.noise(u.x * 1.8, u.y * 1.8, u.z * 1.8)) * top;
    const quiff = 0.045 * Math.exp(-(az * az) / 0.35) * ss(0.35, 0.6, u.y) * (1 - ss(0.75, 0.98, u.y));
    const outer = 1.075 + 0.05 * top + waves + quiff + 0.01 * n.noise(u.x * 7, u.y * 7, u.z * 7);
    const r = 0.5 * (0.9 + (outer - 0.9) * mask);
    p.setXYZ(i, u.x * r, u.y * r, u.z * r);
  }
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  geo.computeVertexNormals();
  const hair = new THREE.Mesh(geo, mat);
  hair.scale.set(1, 0.94, 0.93);
  hair.position.y = HC;
  return hair;
}

function pixelText(text, color, w = 128, h = 64) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = color;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${Math.round(h * 0.55)}px "Press Start 2P", monospace`;
    g.fillText(text, w / 2, h / 2 + 2);
  }, true);
}

/* ------------------------------------------------------------------ */
/* Tabby cat                                                           */
/* ------------------------------------------------------------------ */
let tabbyTex;
function tabbyTexture() {
  tabbyTex ||= canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#8c7a64'; g.fillRect(0, 0, w, h);
    const n = makeNoise(4);
    // mottled base
    const img = g.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4, f = 14 * n.noise(x / 18, y / 18) + 8 * n.noise(x / 5, y / 5);
      img.data[k] += f; img.data[k + 1] += f; img.data[k + 2] += f * 0.8;
    }
    g.putImageData(img, 0, 0);
    // mackerel stripes: wavy vertical bands (they wrap around the body)
    g.strokeStyle = '#3b2f24';
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x0 = (i + 0.5) * (w / 26);
      g.lineWidth = 5 + (i % 3) * 2;
      g.beginPath();
      for (let y = 0; y <= h; y += 6) {
        const x = x0 + 7 * n.noise(i * 1.7, y / 40) + Math.sin(y / 22 + i) * 3;
        y === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.globalAlpha = 0.75;
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  return tabbyTex;
}

export function makeCat() {
  const fur = new THREE.MeshStandardMaterial({ map: tabbyTexture(), roughness: 0.95 });
  const light = std('#e9dfd0', 0.95);
  const dark = std('#3b2f24', 0.95);
  const pink = std('#d99a93', 0.7);
  const root = new THREE.Group();
  const cat = new THREE.Group();
  root.add(cat);

  const add = (geo, mat, [x, y, z], s = [1, 1, 1], r = [0, 0, 0], parent = cat) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.scale.set(...s); m.rotation.set(...r);
    parent.add(m);
    return m;
  };
  const sph = (r, a = 24, b = 16) => new THREE.SphereGeometry(r, a, b);

  // sitting body
  add(sph(0.3), fur, [0, 0.27, -0.05], [1.05, 0.88, 1.12]);
  add(sph(0.22), fur, [0, 0.5, 0.06], [1, 1.35, 0.95], [-0.22, 0, 0]);
  add(sph(0.13), light, [0, 0.45, 0.22], [1.05, 1.45, 0.55], [-0.25, 0, 0]);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.055, 0.062, 0.38, 12), fur, [s * 0.09, 0.2, 0.2]);
    add(sph(0.068), light, [s * 0.09, 0.035, 0.235], [1, 0.6, 1.3]);
    add(sph(0.085), fur, [s * 0.21, 0.045, 0.07], [0.9, 0.55, 1.6]);
  }

  // head
  const head = new THREE.Group();
  head.position.set(0, 0.8, 0.12);
  cat.add(head);
  add(sph(0.21, 28, 20), fur, [0, 0, 0], [1.12, 0.95, 1], [0, 0, 0], head);
  for (const s of [-1, 1]) add(sph(0.11), fur, [s * 0.12, -0.065, 0.07], [1.2, 0.8, 0.9], [0, 0, 0], head);
  add(sph(0.08), light, [0, -0.075, 0.165], [1.35, 0.8, 0.85], [0, 0, 0], head);
  add(sph(0.024, 10, 8), pink, [0, -0.035, 0.232], [1.2, 0.8, 0.8], [0, 0, 0], head);
  const eyes = [-1, 1].map(s => {
    const e = new THREE.Group();
    e.position.set(s * 0.088, 0.03, 0.175);
    const ball = new THREE.Mesh(sph(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: '#c8c24a', roughness: 0.25, emissive: '#3a3a10' }));
    ball.scale.set(1, 1, 0.5);
    const pupil = new THREE.Mesh(sph(0.03, 10, 8), std('#0c0c0c', 0.2));
    pupil.scale.set(0.3, 1.15, 0.3);
    pupil.position.z = 0.02;
    e.add(ball, pupil);
    e.rotation.y = s * 0.3;
    head.add(e);
    return e;
  });
  const ears = [-1, 1].map(s => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.12, 0.155, -0.01);
    ear.rotation.set(-0.12, 0, -s * 0.35);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.17, 4), fur);
    outer.rotation.y = Math.PI / 4;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), pink);
    inner.rotation.y = Math.PI / 4;
    inner.position.set(0, -0.015, 0.03);
    ear.add(outer, inner);
    head.add(ear);
    return ear;
  });
  // whiskers
  const wMat = std('#f4f1ea', 0.5);
  const wGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.2, 4);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    add(wGeo, wMat, [s * 0.14, -0.075 + i * 0.022, 0.17], [1, 1, 1], [0, 0, Math.PI / 2 + s * (i - 1) * 0.18], head);
  }

  // tail: a chain of segments that curls round the side and waves
  const segs = [];
  let parent = cat;
  const N = 10;
  for (let i = 0; i < N; i++) {
    const seg = new THREE.Group();
    if (i === 0) seg.position.set(0.05, 0.08, -0.32);
    else seg.position.set(0, 0, -0.068);
    const r = 0.048 * (1 - i / N * 0.45);
    const m = new THREE.Mesh(sph(r, 12, 10), i % 2 ? dark : fur);
    m.scale.set(1, 1, 1.35);
    seg.add(m);
    parent.add(seg);
    segs.push(seg);
    parent = seg;
  }

  // ---------------- animation ----------------
  const st = { blinkT: 1 + Math.random() * 2, blink: 0, twitch: 0, twitchT: 2, jumpT: -1 };
  root.userData.jump = () => { if (st.jumpT < 0) st.jumpT = 0; };
  root.userData.onTap = () => root.userData.jump();
  root.userData.tick = (t, dt, v) => {
    // tail curls to the right, tip lifts, and it swishes
    segs.forEach((s, i) => {
      const k = i / (N - 1);
      s.rotation.y = 0.3 + Math.sin(t * 2.3 - i * 0.55) * (0.08 + 0.2 * k);
      s.rotation.x = i > N - 4 ? -0.38 : (i === 0 ? 0.25 : 0.02);
    });
    // blink
    st.blinkT -= dt;
    if (st.blinkT < 0) { st.blink = 0.12; st.blinkT = 2.5 + Math.random() * 4; }
    st.blink -= dt;
    for (const e of eyes) e.scale.y = damp(e.scale.y, st.blink > 0 ? 0.1 : 1, 40, dt);
    // ear twitch
    st.twitchT -= dt;
    if (st.twitchT < 0) { st.twitch = 0.18; st.twitchT = 1.5 + Math.random() * 3; }
    st.twitch -= dt;
    ears[0].rotation.z = damp(ears[0].rotation.z, 0.35 + (st.twitch > 0 ? 0.35 : 0), 30, dt);
    // look (lazily) at the cursor
    const yaw = (v ? v.look.x * 0.5 - v.spinner.rotation.y * 0.6 : 0) - root.rotation.y * 0.5;
    head.rotation.y = damp(head.rotation.y, clamp(yaw, -0.6, 0.6), 3, dt);
    head.rotation.z = damp(head.rotation.z, Math.sin(t * 0.7) * 0.08 + (v && v.hoverT > 0.5 ? 0.18 : 0), 3, dt);
    // hop
    let lift = 0;
    if (st.jumpT >= 0) {
      st.jumpT += dt;
      const p = st.jumpT / 0.45;
      if (p >= 1) st.jumpT = -1; else lift = Math.sin(Math.PI * p) * 0.35;
    }
    cat.position.y = lift;
  };
  return root;
}

/* ------------------------------------------------------------------ */
/* George + cat together (boot screen, about page)                     */
/* ------------------------------------------------------------------ */
export function makeDuo() {
  const root = new THREE.Group();
  const george = makeGeorge();
  george.position.x = -0.32;
  const cat = makeCat();
  cat.scale.setScalar(0.95);
  cat.position.set(0.72, -1.16, 0.25);
  cat.rotation.y = -0.45;
  root.add(george, cat);
  root.userData.george = george;
  root.userData.cat = cat;
  root.userData.onTap = (v) => { george.userData.jump(); setTimeout(() => cat.userData.jump(), 120); };
  root.userData.tick = (t, dt, v) => {
    george.userData.tick(t, dt, v);
    cat.userData.tick(t, dt, v);
    root.userData.lift = george.userData.lift;
  };
  return root;
}
