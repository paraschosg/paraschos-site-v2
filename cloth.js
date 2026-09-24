import * as THREE from 'three';

/*
  Interactive hanging fabric — a Verlet cloth simulation.
  · hover: the cursor presses into the fabric
  · drag: grab and pull any point, release to let it swing
  · click: a small gust at the click point
*/

const SX = 40, SY = 28;                 // segments
const W = 4.4, H = (W * SY) / SX;       // world size
const COLS = SX + 1, ROWS = SY + 1, COUNT = COLS * ROWS;
const DX = W / SX, DY = H / SY;
const TOP = H / 2 + 0.25;
const PIN_COLS = [0, 8, 16, 24, 32, 40];
const GATHER = 0.94;                    // top edge is slightly gathered → soft pleats like a curtain
const BLUE = '#063278', ON_BLUE = '#f1efe8';

export function createCloth(canvas, { name = 'George Paraschos', reduceMotion = false } = {}) {
  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8f8f, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(-2.5, 4, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4, bottom: -5, near: 1, far: 20 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // Invisible "wall" that only receives the fabric's shadow
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShadowMaterial({ opacity: 0.13 }));
  wall.position.z = -0.8;
  wall.receiveShadow = true;
  scene.add(wall);

  /* ---------- cloth mesh ---------- */
  const geo = new THREE.PlaneGeometry(W, H, SX, SY);
  const posAttr = geo.attributes.position;
  const texture = new THREE.CanvasTexture(paintTexture(name));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.93, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Hanging rail + clips
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x151516, roughness: 0.5, metalness: 0.4 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, W * GATHER + 0.7, 16), inkMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, TOP + 0.09, 0);
  rail.castShadow = true;
  scene.add(rail);
  PIN_COLS.forEach((c) => {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.06), inkMat);
    clip.position.set((-W / 2 + c * DX) * GATHER, TOP + 0.03, 0);
    clip.castShadow = true;
    scene.add(clip);
  });

  /* ---------- particles & constraints ---------- */
  const pos = new Float32Array(COUNT * 3);
  const prev = new Float32Array(COUNT * 3);
  const invMass = new Float32Array(COUNT).fill(1);
  const pinPos = new Map();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      pos[i * 3] = -W / 2 + x * DX;
      pos[i * 3 + 1] = TOP - y * DY;
      pos[i * 3 + 2] = 0;
    }
  }
  // the whole top edge hangs from the rail; a tiny zig-zag in z seeds the pleats
  for (let c = 0; c < COLS; c++) {
    invMass[c] = 0;
    pinPos.set(c, [(-W / 2 + c * DX) * GATHER, TOP, (c % 2 ? 0.035 : -0.035) * (c % 8 === 0 ? 0 : 1)]);
  }

  const cons = [];
  const link = (x1, y1, x2, y2, k) => {
    if (x1 >= COLS || x2 >= COLS || y2 >= ROWS) return;
    const a = y1 * COLS + x1, b = y2 * COLS + x2;
    cons.push(a, b, Math.hypot((x2 - x1) * DX, (y2 - y1) * DY), k);
  };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      link(x, y, x + 1, y, 1); link(x, y, x, y + 1, 1);            // structural
      link(x, y, x + 1, y + 1, 0.8); link(x + 1, y, x, y + 1, 0.8);   // shear
      link(x, y, x + 2, y, 0.3); link(x, y, x, y + 2, 0.3);        // bend
    }
  }
  const C = new Float32Array(cons);
  const NC = C.length / 4;

  // Intro: fabric starts lifted toward the viewer (a 60° swing) and falls into place
  function drop() {
    const a = Math.PI / 3;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = (y * COLS + x) * 3, r = y * DY;
        pos[i] = (-W / 2 + x * DX) * GATHER;
        pos[i + 1] = TOP - r * Math.cos(a);
        pos[i + 2] = r * Math.sin(a);
      }
    }
    prev.set(pos);
  }
  drop();

  /* ---------- interaction ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { x: 0, y: 0, px: 0, py: 0, inside: false, speed: 0 };
  const grab = { active: false, idx: [], offs: [], plane: new THREE.Plane(), target: new THREE.Vector3(), downAt: 0, moved: 0 };
  const rayO = new THREE.Vector3(), rayD = new THREE.Vector3();
  let hovering = false;

  function setRay(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  function hitCloth() {
    geo.computeBoundingSphere();
    return raycaster.intersectObject(mesh, false)[0];
  }

  canvas.addEventListener('pointermove', (e) => {
    pointer.inside = true;
    pointer.speed = Math.min(1.5, pointer.speed + Math.hypot(e.clientX - pointer.px, e.clientY - pointer.py) / 60);
    pointer.px = e.clientX; pointer.py = e.clientY;
    setRay(e);
    rayO.copy(raycaster.ray.origin); rayD.copy(raycaster.ray.direction);
    if (grab.active) {
      grab.moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      if (raycaster.ray.intersectPlane(grab.plane, grab.target)) clampToFabric(grab.target);
    } else if (e.pointerType === 'mouse') {
      const over = !!hitCloth();
      if (over !== hovering) { hovering = over; canvas.style.cursor = over ? 'grab' : ''; }
    }
  });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; });

  canvas.addEventListener('pointerdown', (e) => {
    setRay(e);
    const hit = hitCloth();
    if (!hit) return;
    const f = hit.face;
    let best = f.a, bd = Infinity;
    for (const v of [f.a, f.b, f.c]) {
      const d = (pos[v * 3] - hit.point.x) ** 2 + (pos[v * 3 + 1] - hit.point.y) ** 2 + (pos[v * 3 + 2] - hit.point.z) ** 2;
      if (d < bd) { bd = d; best = v; }
    }
    // grab a small 3×3 patch around the nearest particle
    const bx = best % COLS, by = Math.max(1, Math.floor(best / COLS));
    grab.center = by * COLS + bx;
    grab.idx = []; grab.offs = [];
    for (let y = by - 1; y <= by + 1; y++) {
      for (let x = bx - 1; x <= bx + 1; x++) {
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const i = y * COLS + x;
        if (invMass[i] === 0) continue;
        grab.idx.push(i);
        grab.offs.push([pos[i * 3] - hit.point.x, pos[i * 3 + 1] - hit.point.y, pos[i * 3 + 2] - hit.point.z]);
      }
    }
    grab.idx.forEach((i) => { invMass[i] = 0; });
    grab.plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), hit.point);
    grab.target.copy(hit.point);
    grab.active = true; grab.downAt = performance.now(); grab.moved = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  // the grabbed point can't be pulled further from the rail than the fabric is long
  function clampToFabric(t) {
    const p = pinPos.get(grab.center % COLS), max = Math.floor(grab.center / COLS) * DY * 1.03;
    const dx = t.x - p[0], dy = t.y - p[1], dz = t.z - p[2], d = Math.hypot(dx, dy, dz);
    if (d > max) t.set(p[0] + (dx * max) / d, p[1] + (dy * max) / d, p[2] + (dz * max) / d);
  }

  function release(e) {
    if (!grab.active) return;
    grab.idx.forEach((i) => { invMass[i] = 1; });
    // quick click → gust at that point
    if (grab.moved < 6 && performance.now() - grab.downAt < 300) gust(grab.target, 0.09);
    grab.active = false; grab.idx = [];
    canvas.style.cursor = hovering ? 'grab' : '';
    if (e && canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function gust(p, strength) {
    for (let i = 0; i < COUNT; i++) {
      if (invMass[i] === 0) continue;
      const i3 = i * 3;
      const d2 = (pos[i3] - p.x) ** 2 + (pos[i3 + 1] - p.y) ** 2;
      if (d2 < 1.2) prev[i3 + 2] += strength * (1 - d2 / 1.2);
    }
  }

  /* ---------- simulation ---------- */
  const G = -5.5, DAMP = 0.985, ITER = 16, R2 = 0.5 * 0.5;
  function step(t, dt) {
    const dt2 = dt * dt;
    const wind = reduceMotion ? 0 : (Math.sin(t * 0.8) * 0.45 + Math.sin(t * 2.1 + 1.3) * 0.2 + 0.35) * 0.9;
    const press = pointer.inside && !grab.active && !reduceMotion;
    const pushK = 6 + pointer.speed * 55;

    for (let i = 0; i < COUNT; i++) {
      if (invMass[i] === 0) continue;
      const i3 = i * 3;
      const x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];
      let ax = 0, ay = G, az = wind * (0.55 + 0.45 * Math.sin(t * 1.6 + x * 1.3 + y * 0.8));

      if (press) { // cursor presses into the fabric along the view ray
        const vx = x - rayO.x, vy = y - rayO.y, vz = z - rayO.z;
        const d = vx * rayD.x + vy * rayD.y + vz * rayD.z;
        const ex = vx - rayD.x * d, ey = vy - rayD.y * d, ez = vz - rayD.z * d;
        const dist2 = ex * ex + ey * ey + ez * ez;
        if (dist2 < R2) {
          const f = (1 - dist2 / R2) * pushK;
          ax += rayD.x * f; ay += rayD.y * f; az += rayD.z * f;
        }
      }
      const nx = x + (x - prev[i3]) * DAMP + ax * dt2;
      const ny = y + (y - prev[i3 + 1]) * DAMP + ay * dt2;
      const nz = z + (z - prev[i3 + 2]) * DAMP + az * dt2;
      prev[i3] = x; prev[i3 + 1] = y; prev[i3 + 2] = z;
      pos[i3] = nx; pos[i3 + 1] = ny; pos[i3 + 2] = nz;
    }

    // pinned + grabbed particles
    pinPos.forEach((p, i) => { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; });
    if (grab.active) {
      grab.idx.forEach((i, k) => {
        const i3 = i * 3, o = grab.offs[k];
        prev[i3] = pos[i3]; prev[i3 + 1] = pos[i3 + 1]; prev[i3 + 2] = pos[i3 + 2];
        pos[i3] = grab.target.x + o[0]; pos[i3 + 1] = grab.target.y + o[1]; pos[i3 + 2] = grab.target.z + o[2];
      });
    }

    for (let it = 0; it < ITER; it++) {
      for (let c = 0; c < NC; c++) {
        const c4 = c * 4, a = C[c4], b = C[c4 + 1];
        const wa = invMass[a], wb = invMass[b], ws = wa + wb;
        if (ws === 0) continue;
        const a3 = a * 3, b3 = b * 3;
        const dx = pos[b3] - pos[a3], dy = pos[b3 + 1] - pos[a3 + 1], dz = pos[b3 + 2] - pos[a3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const k = ((d - C[c4 + 2]) / (d * ws)) * C[c4 + 3];
        pos[a3] += dx * k * wa; pos[a3 + 1] += dy * k * wa; pos[a3 + 2] += dz * k * wa;
        pos[b3] -= dx * k * wb; pos[b3 + 1] -= dy * k * wb; pos[b3 + 2] -= dz * k * wb;
      }
    }
    // long-range attachments: no particle may drift further from its column's top pin than
    // the fabric length between them → no stretching under gravity, so no crumpling
    for (let i = COLS; i < COUNT; i++) {
      if (invMass[i] === 0) continue;
      const col = i % COLS, row = (i / COLS) | 0, p = pinPos.get(col), i3 = i * 3;
      const dx = pos[i3] - p[0], dy = pos[i3 + 1] - p[1], dz = pos[i3 + 2] - p[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz), max = row * DY * 1.01;
      if (d > max) { const k = max / d; pos[i3] = p[0] + dx * k; pos[i3 + 1] = p[1] + dy * k; pos[i3 + 2] = p[2] + dz * k; }
    }
    // keep the fabric in front of the wall
    for (let i = 0; i < COUNT; i++) if (pos[i * 3 + 2] < -0.75) pos[i * 3 + 2] = -0.75;
  }

  /* ---------- sizing ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const share = camera.aspect < 1 ? 0.76 : 0.6;
    const distW = W / (share * t * camera.aspect);
    const distH = (H + 0.9) / (0.78 * t);
    camera.userData.dist = Math.max(distW, distH);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  /* ---------- loop ---------- */
  let running = false, raf = 0, last = 0, acc = 0, time = 0;
  const cam = { x: 0, y: 0 };
  function frame(now) {
    if (!running) return;
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now; acc += delta;
    const h = 1 / 90;
    while (acc >= h) { time += h; step(time, h); acc -= h; }
    pointer.speed *= 0.9;

    posAttr.array.set(pos);
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // subtle camera parallax
    const mx = pointer.inside ? ndc.x : 0, my = pointer.inside ? ndc.y : 0;
    cam.x += (mx * 0.6 - cam.x) * 0.04; cam.y += (my * 0.35 - cam.y) * 0.04;
    camera.position.set(cam.x, cam.y - 0.1, camera.userData.dist || 12);
    camera.lookAt(0, -0.1, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() { if (running) return; running = true; resize(); last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); release(); },
    drop,
  };
}

/* ---------- printed fabric texture (Off-White / archive label) ---------- */
function paintTexture(name) {
  const cw = 2048, ch = Math.round((cw * H) / W);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d');

  g.fillStyle = BLUE;
  g.fillRect(0, 0, cw, ch);

  // woven noise
  const img = g.getImageData(0, 0, cw, ch), d = img.data;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      const weave = ((x >> 1) + (y >> 1)) % 2 ? 4 : -4;
      const n = (Math.random() - 0.5) * 16 + weave;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
  }
  g.putImageData(img, 0, 0);

  g.fillStyle = ON_BLUE; g.strokeStyle = ON_BLUE;
  const mono = (s, w = 700) => `${w} ${s}px "Courier Prime", "Courier New", monospace`;
  const M = 110;

  // dashed frame
  g.setLineDash([16, 12]); g.lineWidth = 3;
  g.strokeRect(60, 60, cw - 120, ch - 120);
  g.setLineDash([]);

  // leader row helper: text · · · · text · · · · text
  function leaderRow(y, parts, size) {
    g.font = mono(size); g.textBaseline = 'alphabetic';
    const widths = parts.map((p) => g.measureText(p).width);
    const free = cw - 2 * M - widths.reduce((a, b) => a + b, 0) - 40 * (parts.length - 1);
    const gap = free / (parts.length - 1);
    let x = M;
    parts.forEach((p, k) => {
      g.fillText(p, x, y);
      x += widths[k];
      if (k < parts.length - 1) {
        for (let dx = 20; dx < gap + 20; dx += 14) g.fillRect(x + dx, y - 6, 4, 4);
        x += gap + 40;
      }
    });
  }

  leaderRow(170, ['GP. ARCHIVE', 'DD/MM/YY', 'S/26', 'V. 003'], 38);

  // giant quoted title
  const title = '“PORTFOLIO”';
  let size = 400;
  g.font = `800 ${size}px "Inter Tight", "Helvetica Neue", Arial, sans-serif`;
  if ('letterSpacing' in g) g.letterSpacing = `${-size * 0.06}px`;
  const tw = g.measureText(title).width;
  size = Math.min(size, (size * (cw - 2 * M + 20)) / tw);
  g.font = `800 ${size}px "Inter Tight", "Helvetica Neue", Arial, sans-serif`;
  if ('letterSpacing' in g) g.letterSpacing = `${-size * 0.06}px`;
  g.fillText(title, M - 14, 250 + size * 0.78);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  const base = 250 + size * 0.78 + 70;
  g.fillRect(M, base, cw - 2 * M, 3);

  // left: descriptor lines
  g.font = mono(44);
  ['SOFTWARE ENGINEER', 'BACKEND / COMPUTER VISION', `c/o ${name.toUpperCase()}`].forEach((t, k) => g.fillText(t, M, base + 90 + k * 62));

  // right: care label
  const bw = 520, bh = 250, bx = cw - M - bw, by = base + 40;
  g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeRect(bx, by, bw, bh); g.setLineDash([]);
  g.font = mono(30);
  ['100% CODE', 'HANDLE WITH CARE', 'DO NOT IRON', 'MADE 2026 ™'].forEach((t, k) => g.fillText(t, bx + 30, by + 58 + k * 52));

  // barcode
  const bcY = ch - 330, bcH = 130;
  let x = M;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  while (x < M + 560) {
    const w = 3 + Math.floor(rnd() * 4) * 3;
    g.fillRect(x, bcY, w, bcH);
    x += w + 4 + Math.floor(rnd() * 3) * 4;
  }
  g.font = mono(26, 400);
  g.fillText('0 26 0000 0001 3', M, bcY + bcH + 40);

  // Off-White-style quoted label
  g.font = mono(46);
  g.textAlign = 'right';
  g.fillText('“FOR INTERACTIVE USE ONLY”', cw - M, ch - 160);
  g.textAlign = 'left';

  return c;
}
