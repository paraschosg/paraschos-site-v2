"use client";

import { useEffect, useRef } from "react";

export type DockItem = { id: string; label: string; icon: keyof typeof ICONS };

// Stroke icons drawn on a 24px grid, one per station.
const ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  camera: <><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="4" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  notebook: <><path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z" /><path d="M6 3v18M4 7h4M4 12h4M4 17h4M11 8h5M11 12h5" /></>,
  branch: <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10M18 10c0 4-6 3-12 7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
};

const BASE = 44;        // resting tile size in px
const MAX_GROW = 26;    // extra px at the pointer
const REACH = 110;      // px either side where the pull fades out

// A dock of stations. Tiles near the pointer grow and push their neighbours
// apart; each tile's size follows its target through a small spring, so it
// overshoots slightly and settles instead of snapping. Touch devices and
// reduced motion get the same dock at rest.
export default function Dock({ items, active, onSelect }: { items: DockItem[]; active: number; onSelect: (id: string) => void }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const tiles = Array.from(list.querySelectorAll<HTMLElement>(".dock-tile"));
    const size = tiles.map(() => BASE);
    const vel = tiles.map(() => 0);
    let pointer: number | null = null;
    let frame = 0;

    const tick = () => {
      // Distances are measured from where each tile sits at rest, so growth
      // never feeds back into the maths and the dock can't wobble.
      // The dock is centred, so its midpoint stays put while tiles grow.
      const r = list.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      let moving = false;
      tiles.forEach((t, i) => {
        const centre = mid + (i - (tiles.length - 1) / 2) * (BASE + gap);
        const d = pointer === null ? Infinity : Math.abs(pointer - centre);
        const target = BASE + MAX_GROW * Math.max(0, Math.cos(Math.min(d / REACH, 1) * (Math.PI / 2)));
        vel[i] = (vel[i] + (target - size[i]) * 0.22) * 0.68;
        size[i] += vel[i];
        if (Math.abs(target - size[i]) > 0.05 || Math.abs(vel[i]) > 0.05) moving = true;
        t.style.setProperty("--size", `${size[i].toFixed(2)}px`);
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => { pointer = e.clientX; kick(); };
    const onLeave = () => { pointer = null; kick(); };

    list.addEventListener("pointermove", onMove);
    list.addEventListener("pointerleave", onLeave);
    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      tiles.forEach((t) => t.style.removeProperty("--size"));
    };
  }, [items.length]);

  return (
    <nav className="dock" aria-label="Stations">
      <ol ref={listRef}>
        {items.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className="dock-tile"
              aria-label={s.label}
              aria-current={i === active ? "location" : undefined}
              onClick={() => onSelect(s.id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[s.icon]}</svg>
              <span className="dock-tip" aria-hidden="true">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
