"use client";

import { useEffect, useRef } from "react";

// A wireframe surface drawn on a fixed canvas behind the page. It rotates
// slowly on its own, and scroll position morphs it through four shapes —
// sphere, cube, torus, plane — one per section of the homepage.
//
// Design constraints, in order:
//   1. Never fight the text. Lines are thin and low-alpha; the shape sits to
//      the right where the hero's terminal already is.
//   2. Cost nothing when it can't be seen: paused off-screen, on hidden tabs,
//      and frozen to one frame under prefers-reduced-motion.
//   3. Small screens get a coarser mesh and a lower frame cap.

type Vec3 = [number, number, number];
type Surface = (u: number, v: number) => Vec3;

const SHAPES: Surface[] = [
  // sphere
  (u, v) => {
    const th = u * Math.PI * 2, ph = v * Math.PI;
    return [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
  },
  // cube: a sphere pushed out to its bounding box
  (u, v) => {
    const th = u * Math.PI * 2, ph = v * Math.PI;
    const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
    const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1;
    return [(x / m) * 0.8, (y / m) * 0.8, (z / m) * 0.8];
  },
  // torus
  (u, v) => {
    const th = u * Math.PI * 2, ph = v * Math.PI * 2, R = 0.7, r = 0.3;
    return [(R + r * Math.cos(ph)) * Math.cos(th), r * Math.sin(ph), (R + r * Math.cos(ph)) * Math.sin(th)];
  },
  // plane with a gentle ripple
  (u, v) => [(u - 0.5) * 2.2, Math.sin(u * 6) * Math.cos(v * 6) * 0.08, (v - 0.5) * 2.2],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export default function Wireframe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 720px)").matches;
    const M = small ? 12 : 20;            // mesh density
    const frameGap = small ? 1000 / 30 : 0; // cap phones at 30fps
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0, rot = 0, raf = 0, last = 0, running = true;

    const readColor = () => {
      const s = getComputedStyle(document.documentElement);
      return { rgb: s.getPropertyValue("--wire").trim() || "29 78 216", a: parseFloat(s.getPropertyValue("--wire-alpha")) || 0.4 };
    };
    let color = readColor();

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    const draw = () => {
      const p = progress() * (SHAPES.length - 1);
      const k = Math.floor(p), t = ease(p - k);
      const A = SHAPES[k], B = SHAPES[Math.min(k + 1, SHAPES.length - 1)];

      // Tilt slightly, spin slowly; the spin is the only motion at rest.
      const cy = Math.cos(rot), sy = Math.sin(rot), cx = Math.cos(0.45), sx = Math.sin(0.45);
      const scale = Math.min(w, h) * (small ? 0.34 : 0.36);
      const ox = small ? w * 0.5 : w * 0.78, oy = small ? h * 0.32 : h * 0.42;

      const project = (u: number, v: number): [number, number] => {
        const a = A(u, v), b = B(u, v);
        let x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t);
        [x, z] = [x * cy - z * sy, x * sy + z * cy];
        [y, z] = [y * cx - z * sx, y * sx + z * cx];
        const d = 2.8 / (2.8 + z);
        return [ox + x * d * scale, oy + y * d * scale];
      };

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgb(${color.rgb} / ${color.a})`;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < M; i++) {
        ctx.beginPath();
        for (let j = 0; j < M; j++) { const [x, y] = project(i / (M - 1), j / (M - 1)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.beginPath();
        for (let j = 0; j < M; j++) { const [x, y] = project(j / (M - 1), i / (M - 1)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - last >= frameGap) { last = now; rot += 0.0035; draw(); }
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) { draw(); }
    else {
      raf = requestAnimationFrame(loop);
      const onVis = () => {
        running = !document.hidden;
        if (running) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
      };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("resize", resize);
      const onTheme = () => { color = readColor(); };
      window.addEventListener("themechange", onTheme);
      const onScroll = reduced ? draw : undefined;
      return () => {
        running = false;
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("resize", resize);
        window.removeEventListener("themechange", onTheme);
        if (onScroll) window.removeEventListener("scroll", onScroll);
      };
    }
    // Reduced motion: still morph with scroll, just don't spin.
    const onScroll = () => draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="wire" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
