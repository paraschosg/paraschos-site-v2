// 3D props for the menus, built from primitives: cartridge, keyboard, chest, envelope,
// floppy disk, and one model per project (magnifier + photo, webcam, plane).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './noise.js';

export const PALETTE = {
  accent: '#ab2c6a', accentHi: '#c94a88', ink: '#111216', paper: '#f1efe8', screen: '#e4e5e0',
  grey: '#b9bcc3', greyDark: '#80848d', gold: '#d6a84a', red: '#d8452c', green: '#34c46a',
};

const std = (color, roughness = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* ---------- canvas textures ---------- */
export function canvasTex(w, h, draw, pixel = false) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
  return t;
}

const PX = '"Press Start 2P", monospace';

function decal(tex, w, h, extra = {}) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...extra,
  }));
}

/* ---------- soft contact shadow ---------- */
let shadowTex;
export function contactShadow(size = 2.6, opacity = 0.3) {
  shadowTex ||= canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(34,10,22,1)'); gr.addColorStop(0.5, 'rgba(34,10,22,0.45)'); gr.addColorStop(1, 'rgba(34,10,22,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  return m;
}

/* ---------- raspberry/paper checkerboard floor disc ---------- */
let floorMat;
export function checkerFloor(size = 5.5) {
  floorMat ||= new THREE.MeshBasicMaterial({
    map: canvasTex(512, 512, (g, w) => {
      const n = 10, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? PALETTE.accent : PALETTE.paper; g.fillRect(i * s, j * s, s, s); }
    }),
    alphaMap: canvasTex(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, '#ddd'); gr.addColorStop(0.82, '#000');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }),
    transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -2;
  return m;
}

function centered(root, y = 0) {
  const box = new THREE.Box3().setFromObject(root);
  root.position.y += -(box.min.y + box.max.y) / 2 + y;
  const wrap = new THREE.Group();
  wrap.add(root);
  return wrap;
}

/* ---------- game cartridge ---------- */
export function makeCartridge({ title = 'PROJECTS', sub = '3-IN-1', color = PALETTE.grey } = {}) {
  const root = new THREE.Group();
  const shell = std(color, 0.55);
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.85, 0.3, 3, 0.07), shell);
  root.add(body);
  // grip ridges on top
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.035, 0.32, 2, 0.012), std(PALETTE.greyDark, 0.6));
    r.position.set(0, 0.62 + i * 0.055, 0);
    root.add(r);
  }
  // recessed label
  const label = decal(canvasTex(320, 256, (g, w, h) => {
    g.fillStyle = PALETTE.accent; g.fillRect(0, 0, w, h);
    g.fillStyle = PALETTE.paper;
    g.fillRect(12, 12, w - 24, 6); g.fillRect(12, h - 18, w - 24, 6);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `44px ${PX}`; g.fillText('GP', w / 2, 82);
    g.font = `20px ${PX}`; g.fillText(title, w / 2, 150);
    g.fillStyle = PALETTE.gold; g.font = `14px ${PX}`; g.fillText(sub, w / 2, 196);
  }, true), 1.24, 0.99, { roughness: 0.6 });
  label.position.set(0, 0.03, 0.152);
  root.add(label);
  const arrow = decal(canvasTex(64, 64, (g) => {
    g.fillStyle = PALETTE.greyDark; g.beginPath(); g.moveTo(32, 50); g.lineTo(12, 18); g.lineTo(52, 18); g.closePath(); g.fill();
  }), 0.16, 0.16);
  arrow.position.set(0, -0.68, 0.152);
  root.add(arrow);
  // edge connector with gold pins
  const conn = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.12), std(PALETTE.ink, 0.5));
  conn.position.set(0, -0.96, 0);
  root.add(conn);
  const pinMat = std(PALETTE.gold, 0.25, { metalness: 0.8 });
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.125), pinMat);
    p.position.set(-0.56 + i * 0.086, -0.97, 0);
    root.add(p);
  }
  root.rotation.set(0.12, 0, -0.08);
  return centered(root);
}

/* ---------- mechanical keyboard with keys that press themselves ---------- */
export function makeKeyboard() {
  const root = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.2, 1.05, 3, 0.06), std(PALETTE.ink, 0.5));
  root.add(base);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(2.42, 0.06, 0.93, 2, 0.02), std('#2a2c33', 0.6));
  plate.position.y = 0.1;
  root.add(plate);
  const keyGeo = new RoundedBoxGeometry(0.16, 0.11, 0.16, 2, 0.03);
  const paper = std(PALETTE.paper, 0.55), accentMat = std(PALETTE.accent, 0.45), grey = std(PALETTE.grey, 0.55);
  const keys = [];
  const rows = 4, cols = 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const special = (r === 0 && c === 0) || (r === 2 && c === cols - 1);
      const k = new THREE.Mesh(keyGeo, special ? accentMat : (r === 3 && (c < 2 || c > 9)) ? grey : paper);
      k.position.set(-1.1 + c * 0.2 + (r % 2) * 0.04, 0.2, -0.33 + r * 0.2);
      if (r === 3 && c >= 3 && c <= 8) { if (c === 3) { k.scale.x = 7.3; k.position.x += 0.5; } else continue; }
      k.userData.y0 = k.position.y;
      root.add(k);
      keys.push(k);
    }
  }
  // "G" and "P" keycaps
  const letter = ch => decal(canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = PALETTE.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `30px ${PX}`; g.fillText(ch, w / 2, h / 2 + 2);
  }, true), 0.12, 0.12);
  for (const [ch, idx] of [['G', 17], ['P', 21]]) {
    const k = keys[idx];
    k.material = accentMat;
    const d = letter(ch);
    d.rotation.x = -Math.PI / 2;
    d.position.set(0, 0.056, 0);
    k.add(d);
  }
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.8, 0.05, -0.52), new THREE.Vector3(0.9, 0.05, -0.9), new THREE.Vector3(0.5, 0.05, -1.25), new THREE.Vector3(0.1, 0.05, -1.4),
  ]), 24, 0.03, 8), std(PALETTE.ink, 0.5));
  root.add(cable);

  const st = { next: 0 };
  root.userData.tick = (t, dt, v) => {
    st.next -= dt;
    if (st.next < 0) {
      st.next = 0.09 + Math.random() * (v && v.hoverT > 0.5 ? 0.05 : 0.25);
      const k = keys[(Math.random() * keys.length) | 0];
      k.userData.press = 1;
    }
    for (const k of keys) {
      k.userData.press = Math.max(0, (k.userData.press || 0) - dt * 7);
      k.position.y = k.userData.y0 - Math.sin(Math.min(1, k.userData.press) * Math.PI) * 0.05;
    }
  };
  root.rotation.set(0.25, -0.2, 0);
  return centered(root);
}

/* ---------- treasure chest (lid opens on hover) ---------- */
export function makeChest() {
  const root = new THREE.Group();
  const wood = std(PALETTE.accent, 0.55), trim = std(PALETTE.gold, 0.3, { metalness: 0.7 });
  const W = 1.6, D = 1.05, H = 0.75;
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.05), wood);
  base.position.y = H / 2;
  root.add(base);
  for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, H + 0.02, D + 0.03), trim);
    band.position.set(x, H / 2, 0);
    root.add(band);
  }
  const rimB = new THREE.Mesh(new THREE.BoxGeometry(W + 0.03, 0.08, D + 0.03), trim);
  rimB.position.y = H - 0.02;
  root.add(rimB);
  // coins glowing inside
  const coinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.025, 20);
  const coinMat = std(PALETTE.gold, 0.25, { metalness: 0.85, emissive: '#6b4a0c', emissiveIntensity: 0.6 });
  const r = rng(3);
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.position.set((r() - 0.5) * (W - 0.4), H - 0.06 + r() * 0.1, (r() - 0.5) * (D - 0.35));
    c.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8);
    root.add(c);
  }
  // lid (half cylinder) hinged at the back
  const hinge = new THREE.Group();
  hinge.position.set(0, H, -D / 2);
  const lidGeo = new THREE.CylinderGeometry(D / 2, D / 2, W, 24, 1, false, 0, Math.PI);
  const lid = new THREE.Mesh(lidGeo, wood);
  lid.rotation.set(0, 0, Math.PI / 2);
  lid.rotation.order = 'ZYX';
  lid.rotateY(-Math.PI / 2);
  lid.position.set(0, 0, D / 2);
  hinge.add(lid);
  for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(D / 2 + 0.012, D / 2 + 0.012, 0.1, 24, 1, true, 0, Math.PI), trim);
    b.material.side = THREE.DoubleSide;
    b.rotation.copy(lid.rotation);
    b.position.set(x, 0, D / 2);
    hinge.add(b);
  }
  const lock = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.26, 0.08, 2, 0.03), trim);
  lock.position.set(0, 0.02, D + 0.02);
  hinge.add(lock);
  root.add(hinge);
  const glow = new THREE.PointLight('#ffd27a', 0, 3);
  glow.position.set(0, H + 0.2, 0);
  root.add(glow);

  root.userData.tick = (t, dt, v) => {
    const open = v ? v.hoverT : 0;
    hinge.rotation.x = damp(hinge.rotation.x, -(0.08 + open * 0.95 + Math.max(0, Math.sin(t * 1.3)) * 0.06), 8, dt);
    glow.intensity = open * 3;
  };
  root.rotation.y = -0.35;
  return centered(root);
}

/* ---------- envelope with a wax seal ---------- */
export function makeEnvelope() {
  const root = new THREE.Group();
  const shell = std(PALETTE.accent, 0.6);
  const W = 1.9, H = 1.25;
  const back = new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.06, 2, 0.02), shell);
  root.add(back);
  // the letter that slides out on hover
  const letter = new THREE.Mesh(new THREE.BoxGeometry(W - 0.25, H - 0.2, 0.01), std('#ffffff', 0.9));
  const lines = decal(canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = PALETTE.accent; g.font = `14px ${PX}`; g.fillText('HELLO GEORGE,', 16, 30);
    g.fillStyle = '#8c93a3';
    for (let i = 0; i < 4; i++) g.fillRect(16, 56 + i * 22, w - 32 - (i === 3 ? 90 : 0), 6);
  }, true), W - 0.35, H - 0.35);
  lines.position.z = 0.006;
  letter.add(lines);
  letter.position.set(0, 0, 0.04);
  root.add(letter);
  // front pocket (two side triangles + bottom) as one shape
  const pocket = new THREE.Shape();
  pocket.moveTo(-W / 2, -H / 2); pocket.lineTo(W / 2, -H / 2); pocket.lineTo(W / 2, H / 2 - 0.02);
  pocket.lineTo(0, -0.05); pocket.lineTo(-W / 2, H / 2 - 0.02); pocket.closePath();
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(pocket, { depth: 0.02, bevelEnabled: false }), std(PALETTE.accentHi, 0.6));
  front.position.z = 0.07;
  root.add(front);
  // flap hinged at the top edge
  const hinge = new THREE.Group();
  hinge.position.set(0, H / 2, 0.08);
  const flapS = new THREE.Shape();
  flapS.moveTo(-W / 2, 0); flapS.lineTo(W / 2, 0); flapS.lineTo(0, -H * 0.62); flapS.closePath();
  const flap = new THREE.Mesh(new THREE.ExtrudeGeometry(flapS, { depth: 0.02, bevelEnabled: false }), std('#8e2255', 0.6));
  hinge.add(flap);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.05, 28), std(PALETTE.gold, 0.3, { metalness: 0.6 }));
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -H * 0.5, 0.045);
  const sealTxt = decal(canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = PALETTE.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `20px ${PX}`; g.fillText('GP', w / 2, h / 2 + 2);
  }, true), 0.22, 0.22);
  sealTxt.position.set(0, -H * 0.5, 0.072);
  hinge.add(seal, sealTxt);
  root.add(hinge);

  root.userData.tick = (t, dt, v) => {
    const open = v ? v.hoverT : 0;
    hinge.rotation.x = damp(hinge.rotation.x, -open * 2.6, 7, dt);
    letter.position.y = damp(letter.position.y, open * 0.55, 6, dt);
    letter.position.z = open > 0.3 ? 0.035 : 0.04;
  };
  root.rotation.set(-0.15, 0.25, 0.06);
  return centered(root);
}

/* ---------- floppy disk ---------- */
export function makeFloppy({ title = 'SOURCE', sub = 'GITHUB' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.65, 0.1, 2, 0.03), std(PALETTE.accent, 0.45));
  root.add(body);
  const shutter = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.55, 0.12, 2, 0.015), std('#c9ccd3', 0.25, { metalness: 0.85 }));
  shutter.position.set(0.05, 0.55, 0);
  root.add(shutter);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.125), std(PALETTE.ink, 0.6));
  slot.position.set(0.2, 0.55, 0);
  root.add(slot);
  const label = decal(canvasTex(256, 176, (g, w, h) => {
    g.fillStyle = PALETTE.paper; g.fillRect(0, 0, w, h);
    g.fillStyle = PALETTE.red; g.fillRect(0, 0, w, 14);
    g.fillStyle = PALETTE.ink; g.font = `22px ${PX}`; g.fillText(title, 18, 62);
    g.fillStyle = PALETTE.accent; g.font = `14px ${PX}`; g.fillText(sub, 18, 100);
    g.fillStyle = '#9aa0ad';
    for (let i = 0; i < 2; i++) g.fillRect(18, 124 + i * 20, w - 36, 4);
  }, true), 1.28, 0.88);
  label.position.set(0, -0.3, 0.052);
  root.add(label);
  root.rotation.set(0.1, 0, 0.1);
  return centered(root);
}

/* ---------- project: Image Inspector (photo + magnifier) ---------- */
export function makeInspector() {
  const root = new THREE.Group();
  const photo = canvasTex(96, 64, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#f0bfd6'); sky.addColorStop(1, '#f7e7d4');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f6c65b'; g.fillRect(64, 10, 12, 12);
    g.fillStyle = PALETTE.accent;
    g.beginPath(); g.moveTo(0, 48); g.lineTo(22, 26); g.lineTo(40, 44); g.lineTo(58, 22); g.lineTo(96, 50); g.lineTo(96, 64); g.lineTo(0, 64); g.fill();
    g.fillStyle = '#d0619a'; g.fillRect(0, 54, w, 10);
  }, true);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(1.9, 1.35, 0.1, 2, 0.03), std(PALETTE.ink, 0.45));
  frame.position.y = 0.72;
  root.add(frame);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.13), new THREE.MeshStandardMaterial({ map: photo, roughness: 0.6 }));
  pic.position.set(0, 0.72, 0.052);
  root.add(pic);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.06), std(PALETTE.ink, 0.5));
  leg.position.set(0, 0.5, -0.32);
  leg.rotation.x = 0.45;
  root.add(leg);
  // magnifier
  const mag = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 14, 40), std(PALETTE.grey, 0.25, { metalness: 0.8 }));
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshPhysicalMaterial({ color: '#ffe6f1', transparent: true, opacity: 0.28, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.7, 0.13, 2, 0.05), std(PALETTE.accent, 0.45));
  handle.position.set(0.4, -0.55, 0);
  handle.rotation.z = 0.65;
  mag.add(ring, glass, handle);
  mag.position.set(0.25, 0.7, 0.45);
  root.add(mag);
  // pixel picker readout
  const tag = decal(canvasTex(160, 48, (g, w, h) => {
    g.fillStyle = PALETTE.ink; g.fillRect(0, 0, w, h);
    g.fillStyle = PALETTE.accent; g.fillRect(8, 10, 28, 28);
    g.fillStyle = PALETTE.paper; g.font = `12px ${PX}`; g.fillText('#AB2C6A', 46, 30);
  }, true), 0.62, 0.19);
  tag.position.set(-0.55, 1.55, 0.06);
  root.add(tag);

  root.userData.tick = (t, dt, v) => {
    const s = v && v.hoverT > 0.5 ? 1.8 : 1;
    mag.position.x = 0.1 + Math.sin(t * 0.9 * s) * 0.45;
    mag.position.y = 0.72 + Math.sin(t * 1.4 * s) * 0.22;
    mag.rotation.z = Math.sin(t * 0.7) * 0.12;
  };
  root.rotation.y = -0.2;
  return centered(root);
}

/* ---------- project: Camera Recognition (webcam + detection box) ---------- */
export function makeWebcam() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.62, 0.55, 4, 0.24), std(PALETTE.ink, 0.35));
  body.position.y = 1.0;
  root.add(body);
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 36), std('#2c2f38', 0.3, { metalness: 0.6 }));
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0, 1.0, 0.28);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#1f0d18', roughness: 0.05, clearcoat: 1, metalness: 0.2 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.0, 0.3);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd0e4' }));
  glint.position.set(0.06, 1.06, 0.45);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: PALETTE.red, emissive: PALETTE.red, emissiveIntensity: 2 }));
  led.position.set(0.42, 1.14, 0.25);
  root.add(bezel, lens, glint, led);
  // stand
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), std(PALETTE.greyDark, 0.4, { metalness: 0.5 }));
  neck.position.y = 0.48;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.1, 32), std(PALETTE.ink, 0.4));
  base.position.y = 0.2;
  root.add(neck, base);
  // floating detection box (corner brackets) + label
  const box = new THREE.Group();
  const bMat = new THREE.MeshBasicMaterial({ color: PALETTE.green, toneMapped: false });
  const L = 0.28, T = 0.035, bw = 1.4, bh = 1.0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(L, T, T), bMat);
    hBar.position.set(sx * (bw / 2 - L / 2), sy * bh / 2, 0);
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(T, L, T), bMat);
    vBar.position.set(sx * bw / 2, sy * (bh / 2 - L / 2), 0);
    box.add(hBar, vBar);
  }
  const label = decal(canvasTex(192, 40, (g, w, h) => {
    g.fillStyle = PALETTE.green; g.fillRect(0, 0, w, h);
    g.fillStyle = PALETTE.ink; g.font = `13px ${PX}`; g.fillText('HAND 0.98', 10, 27);
  }, true), 0.62, 0.13, { toneMapped: false });
  label.position.set(-bw / 2 + 0.31, bh / 2 + 0.1, 0);
  box.add(label);
  box.position.set(0, 1.05, 0.9);
  root.add(box);

  root.userData.tick = (t, dt, v) => {
    led.material.emissiveIntensity = (Math.sin(t * 5) > 0 ? 2.2 : 0.3);
    const k = v && v.hoverT > 0.5 ? 1 : 0.6;
    box.position.x = Math.sin(t * 0.8) * 0.18 * k;
    box.position.y = 1.05 + Math.sin(t * 1.3) * 0.08;
    box.scale.setScalar(1 + Math.sin(t * 2.1) * 0.04);
  };
  return centered(root);
}

/* ---------- project: Airline Management (low-poly plane) ---------- */
export function makePlane() {
  const root = new THREE.Group();
  const white = std(PALETTE.paper, 0.4), livery = std(PALETTE.accent, 0.4), grey = std(PALETTE.grey, 0.35, { metalness: 0.5 });
  const plane = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.9, 8, 20), white);
  fus.rotation.x = Math.PI / 2;
  plane.add(fus);
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.245, 1.7, 6, 20), livery);
  belly.rotation.x = Math.PI / 2;
  belly.scale.set(1, 1, 0.35);
  belly.position.y = -0.14;
  plane.add(belly);
  // windows
  const winMat = std(PALETTE.ink, 0.2);
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), winMat);
    w.scale.set(0.4, 1, 1);
    w.position.set(s * 0.235, 0.06, 0.7 - i * 0.16);
    plane.add(w);
  }
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), winMat);
  cockpit.scale.set(1.5, 0.5, 0.8);
  cockpit.position.set(0, 0.12, 1.1);
  plane.add(cockpit);
  // wings
  const wing = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.06, 0.5, 2, 0.02), white);
  wing.position.set(0, -0.06, 0.1);
  plane.add(wing);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.22, 0.3, 2, 0.02), livery);
    tip.position.set(s * 1.3, 0.05, 0.05);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 16), grey);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(s * 0.6, -0.2, 0.22);
    plane.add(tip, eng);
  }
  const stab = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.04, 0.26, 2, 0.015), white);
  stab.position.set(0, 0.05, -1.05);
  plane.add(stab);
  const fin = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.55, 0.42, 2, 0.02), livery);
  fin.position.set(0, 0.36, -1.02);
  fin.rotation.x = -0.35;
  plane.add(fin);
  for (const s of [-1, 1]) {
    const gp = decal(canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = PALETTE.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `22px ${PX}`; g.fillText('GP', w / 2, h / 2 + 2);
    }, true), 0.26, 0.26);
    gp.position.set(s * 0.028, 0.38, -1.0);
    gp.rotation.y = s * Math.PI / 2;
    plane.add(gp);
  }
  root.add(plane);
  // a few cloud puffs
  const cloudMat = std('#ffffff', 0.95);
  const clouds = [[-1.3, -0.5, -0.6, 0.9], [1.4, 0.45, -0.9, 0.7]].map(([x, y, z, s]) => {
    const c = new THREE.Group();
    for (const [dx, dy, r] of [[0, 0, 0.22], [0.22, 0.05, 0.17], [-0.2, 0.02, 0.16], [0.08, 0.14, 0.15]]) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), cloudMat);
      p.position.set(dx, dy, 0);
      c.add(p);
    }
    c.position.set(x, y, z); c.scale.setScalar(s);
    root.add(c);
    return c;
  });

  root.userData.tick = (t, dt, v) => {
    const k = v && v.hoverT > 0.5 ? 1.6 : 1;
    plane.rotation.z = Math.sin(t * 0.9 * k) * 0.28;
    plane.rotation.x = Math.sin(t * 0.6) * 0.08;
    plane.position.y = Math.sin(t * 1.2) * 0.08;
    clouds.forEach((c, i) => { c.position.z = ((t * 0.5 + i * 1.3) % 3) - 1.5; });
  };
  root.rotation.y = -0.6;
  return centered(root);
}
