// One WebGL canvas, many little 3D "views" glued to DOM elements (scissor rendering).
// Objects can animate themselves: userData.tick(t, dt, view) runs every frame and
// userData.onTap(view) runs when a draggable view is tapped.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { contactShadow, checkerFloor, PALETTE } from './props.js';

export class Stage {
  constructor(host, clipEl) {
    this.host = host;
    this.clipEl = clipEl;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.setClearColor(0x000000, 0);
    r.domElement.className = 'stage';
    host.appendChild(r.domElement);
    const pm = new THREE.PMREMGenerator(r);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.views = [];
    this.clock = new THREE.Clock();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.pointer = { x: innerWidth / 2, y: innerHeight * 0.35, seen: false };
    addEventListener('pointermove', e => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.seen = true; }, { passive: true });
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    r.setAnimationLoop(() => this.frame());
  }

  resize() {
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
  }

  add(el, object, opts) {
    const v = new View(this, el, object, opts);
    this.views.push(v);
    return v;
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    const r = this.renderer;
    r.setScissorTest(false);
    r.clear();
    r.setScissorTest(true);
    const hr = this.host.getBoundingClientRect();
    const cr = this.clipEl ? this.clipEl.getBoundingClientRect() : hr;
    const H = hr.height;
    for (const v of this.views) {
      if (!v.el.isConnected || v.el.offsetParent === null) continue;
      const b = v.el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const clip = v.o.noClip ? hr : cr;
      const cl = Math.max(b.left, clip.left), ct = Math.max(b.top, clip.top);
      const crr = Math.min(b.right, clip.right), cb = Math.min(b.bottom, clip.bottom);
      if (crr <= cl || cb <= ct) continue;
      // where the pointer is, relative to this view (-1..1 across the element, clamped)
      const p = this.pointer;
      const lx = (p.x - (b.left + b.width / 2)) / Math.max(b.width, 200);
      const ly = (p.y - (b.top + b.height * 0.35)) / Math.max(b.height, 200);
      v.look.x += (Math.max(-1, Math.min(1, lx * 1.6)) - v.look.x) * (1 - Math.exp(-dt * 6));
      v.look.y += (Math.max(-1, Math.min(1, ly * 1.6)) - v.look.y) * (1 - Math.exp(-dt * 6));
      v.update(t, dt);
      r.setViewport(b.left - hr.left, H - (b.bottom - hr.top), b.width, b.height);
      r.setScissor(cl - hr.left, H - (cb - hr.top), crr - cl, cb - ct);
      v.camera.aspect = b.width / b.height;
      v.camera.updateProjectionMatrix();
      r.render(v.scene, v.camera);
    }
  }
}

let bitGeo;
const bitMats = {};

class View {
  constructor(stage, el, object, o = {}) {
    this.stage = stage;
    this.el = el;
    this.o = Object.assign({
      fov: 28, dist: 5.2, elev: 0.5, lookY: 0, spin: 0.55, sway: 0, tilt: 0.35, bob: 0.05,
      drag: false, shadow: true, shadowSize: 2.8, shadowOpacity: 0.3, hoverEl: null, scale: 1, hoverLift: 0.1,
    }, o);
    const s = this.scene = new THREE.Scene();
    s.environment = stage.env;
    s.environmentIntensity = 0.45;
    s.add(new THREE.HemisphereLight(0xffffff, 0x5e3a4c, 0.8));
    const key = new THREE.DirectionalLight(0xfff3e6, 2.1); key.position.set(2.5, 5, 3.5);
    const rim = new THREE.DirectionalLight(0xffd9ea, 1.6); rim.position.set(-3.5, 2.5, -4);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3, 1, 3);
    s.add(key, rim, fill);

    this.pivot = new THREE.Group();
    this.spinner = new THREE.Group();
    this.squisher = new THREE.Group();
    this.pivot.add(this.squisher);
    this.squisher.add(this.spinner);
    s.add(this.pivot);

    if (this.o.floor) {
      this.floor = checkerFloor(this.o.floor);
      s.add(this.floor);
    }
    if (this.o.shadow) {
      this.shadow = contactShadow(this.o.shadowSize, this.o.shadowOpacity);
      s.add(this.shadow);
    }
    this.camera = new THREE.PerspectiveCamera(this.o.fov, 1, 0.1, 60);
    this.placeCamera();

    this.look = { x: 0, y: 0 };
    this.phase = Math.random() * 10;
    this.rotY = this.o.sway ? 0 : Math.random() * Math.PI * 2;
    this.vel = 0; this.hover = 0; this.hoverT = 0;
    this.sq = 0; this.sqV = 0;
    this.tiltExtra = 0;
    this.particles = [];
    this.setObject(object);

    const hEl = this.o.hoverEl || el;
    hEl.addEventListener('pointerenter', () => (this.hover = 1));
    hEl.addEventListener('pointerleave', () => (this.hover = 0));
    hEl.addEventListener('focus', () => (this.hover = 1));
    hEl.addEventListener('blur', () => (this.hover = 0));
    if (this.o.drag) this.bindDrag();
  }

  placeCamera() {
    const { dist, elev, lookY } = this.o;
    this.camera.position.set(0, Math.sin(elev) * dist + lookY, Math.cos(elev) * dist);
    this.camera.lookAt(0, lookY, 0);
  }

  setObject(obj) {
    if (this.obj) this.spinner.remove(this.obj);
    this.obj = obj;
    if (!obj) return;
    this.spinner.add(obj);
    this.pivot.rotation.x = this.o.tilt;
    this.pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.pivot);
    this.halfH = (box.max.y - box.min.y) / 2;
    if (this.shadow) this.shadow.position.y = box.min.y - 0.02;
    if (this.floor) this.floor.position.y = box.min.y - 0.03;
  }

  bindDrag() {
    const el = this.el;
    let down = false, lx = 0, moved = 0;
    el.addEventListener('pointerdown', e => {
      down = true; moved = 0; lx = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - lx;
      lx = e.clientX;
      moved += Math.abs(dx) + Math.abs(e.movementY || 0);
      this.rotY += dx * 0.012;
      this.vel = dx * 0.6;
    });
    const up = () => {
      if (!down) return;
      down = false;
      el.classList.remove('dragging');
      if (moved < 6) { this.tap(); this.el.dispatchEvent(new CustomEvent('tapped')); }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    this.isDown = () => down;
  }

  tap() {
    this.sqV += 7;
    this.burst();
    this.obj?.userData.onTap?.(this);
  }

  // little pixel "confetti" cubes
  burst(n = 18) {
    bitGeo ||= new THREE.BoxGeometry(1, 1, 1);
    const colors = [PALETTE.accent, PALETTE.paper, PALETTE.gold, PALETTE.ink];
    for (let i = 0; i < n; i++) {
      const c = colors[i % colors.length];
      bitMats[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
      const m = new THREE.Mesh(bitGeo, bitMats[c]);
      const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 1.8;
      m.position.set(Math.cos(a) * 0.5, this.halfH * 0.5, Math.sin(a) * 0.5);
      m.userData = { v: new THREE.Vector3(Math.cos(a) * sp, 2.5 + Math.random() * 2.5, Math.sin(a) * sp), life: 1, s: 0.04 + Math.random() * 0.05 };
      m.scale.setScalar(m.userData.s);
      this.scene.add(m);
      this.particles.push(m);
    }
  }

  update(t, dt) {
    const o = this.o, reduced = this.stage.reduced;
    this.hoverT += (this.hover - this.hoverT) * (1 - Math.exp(-dt * 10));
    const dragging = this.isDown && this.isDown();
    if (o.sway) {
      if (!dragging) {
        const target = Math.sin(t * 0.5 + this.phase) * o.sway;
        this.rotY += (target - this.rotY) * (1 - Math.exp(-dt * (this.vel ? 0.8 : 2)));
        this.vel *= Math.exp(-dt * 2);
      }
    } else if (!dragging) {
      const speed = (reduced ? 0.15 : o.spin) * (1 + this.hoverT * 2.5);
      this.rotY += (speed + this.vel * 0.02) * dt;
      this.vel *= Math.exp(-dt * 2.5);
    }
    this.spinner.rotation.y = this.rotY;
    this.pivot.rotation.x = o.tilt + this.hoverT * 0.08;
    const bob = reduced ? 0 : Math.sin(t * 1.7 + this.phase) * o.bob;
    this.pivot.position.y = bob + this.hoverT * o.hoverLift;
    // squash-and-stretch spring
    this.sqV += (-this.sq * 90 - this.sqV * 9) * dt;
    this.sq += this.sqV * dt;
    const k = o.scale * (1 + this.hoverT * 0.05);
    this.squisher.scale.set(k * (1 + this.sq * 0.05), k * (1 - this.sq * 0.09), k * (1 + this.sq * 0.05));
    this.obj?.userData.tick?.(t, dt, this);
    if (this.shadow) {
      const lift = this.pivot.position.y + (this.obj?.userData.lift || 0);
      const f = 1 - lift * 0.8;
      this.shadow.scale.setScalar(Math.max(0.4, f) * k);
      this.shadow.material.opacity = o.shadowOpacity * Math.max(0.3, f);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i], u = p.userData;
      u.v.y -= 9 * dt;
      p.position.addScaledVector(u.v, dt);
      p.rotation.x += dt * 6; p.rotation.y += dt * 4;
      u.life -= dt * 0.9;
      p.scale.setScalar(u.s * Math.max(0, u.life));
      if (u.life <= 0) { this.scene.remove(p); this.particles.splice(i, 1); }
    }
  }
}
