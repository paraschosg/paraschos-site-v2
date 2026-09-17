"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { markArrived, zoomTo } from "./dockTransition";
import { applyTheme, currentTheme } from "./ThemeToggle";

// Stroke icons on a 24px grid.
const icon = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  stack: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  github: <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10M18 10c0 4-6 3-12 7" /></>,
  contact: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
};

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "stack", label: "Stack" },
  { id: "github", label: "GitHub" },
  { id: "contact", label: "Contact" },
] as const;

const BASE = 48;      // resting tile size, px
const GROW = 22;      // extra px right under the pointer
const REACH = 120;    // px either side where the pull fades out

// macOS-style dock for the site menu. Tiles near the pointer grow and push
// their neighbours apart, following a small spring so they overshoot a touch
// and settle. Touch screens and reduced motion get the dock at rest.
export default function Dock() {
  const pathname = usePathname();
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const active = pathname === "/" ? "home" : SECTIONS.find((sec) => pathname.startsWith(`/${sec.id}`))?.id ?? null;
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // A page transition started on the previous page waits for this.
  useEffect(() => { markArrived(); }, [pathname]);

  // Plain left-clicks zoom into the page; new-tab clicks behave as usual.
  const open = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (href === pathname) return;
    zoomTo(href, e.currentTarget, (h) => router.push(h));
  };

  useEffect(() => {
    setTheme(currentTheme());
    const onChange = () => setTheme(currentTheme());
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);

  // Magnification.
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
      // Measure from resting positions around the dock's fixed midpoint, so
      // growth never feeds back into the distances.
      const r = list.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const seps = list.querySelectorAll(".dock-sep").length;
      const sepW = seps ? (list.querySelector(".dock-sep") as HTMLElement).offsetWidth + gap : 0;
      const total = tiles.length * BASE + (tiles.length - 1 + seps) * gap + seps * (sepW - gap);
      let x = mid - total / 2;
      let moving = false;
      tiles.forEach((t, i) => {
        if (t.dataset.afterSep !== undefined) x += sepW;
        const centre = x + BASE / 2;
        x += BASE + gap;
        const d = pointer === null ? Infinity : Math.abs(pointer - centre);
        const target = BASE + GROW * Math.max(0, Math.cos(Math.min(d / REACH, 1) * (Math.PI / 2)));
        vel[i] = (vel[i] + (target - size[i]) * 0.2) * 0.7;
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
  }, []);

  const next = theme === "dark" ? "light" : "dark";
  const tip = (label: string) => <span className="dock-tip" aria-hidden="true">{label}</span>;
  const svg = (d: React.ReactNode) => <svg viewBox="0 0 24 24" aria-hidden="true">{d}</svg>;

  return (
    <nav className="dock" aria-label="Primary">
      <ul ref={listRef}>
        <li>
          <a className="dock-tile" href="/" onClick={(e) => open(e, "/")} aria-label="Home" aria-current={active === "home" ? "page" : undefined}>
            {svg(icon.home)}{tip("Home")}
          </a>
        </li>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a className="dock-tile" href={`/${s.id}`} onClick={(e) => open(e, `/${s.id}`)} aria-label={s.label} aria-current={active === s.id ? "page" : undefined}>
              {svg(icon[s.id])}{tip(s.label)}
            </a>
          </li>
        ))}
        <li className="dock-sep" aria-hidden="true" />
        <li>
          <button type="button" className="dock-tile" data-after-sep aria-label="Search — open command palette" onClick={() => window.dispatchEvent(new Event("palette:open"))}>
            {svg(icon.search)}{tip("Search ⌘K")}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dock-tile"
            aria-label={`Switch to ${next} theme`}
            onClick={() => { applyTheme(next); window.dispatchEvent(new Event("themechange")); }}
          >
            {theme === null ? null : svg(theme === "dark" ? icon.sun : icon.moon)}
            {tip(theme === "dark" ? "Light theme" : "Dark theme")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
