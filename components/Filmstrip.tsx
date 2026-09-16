"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Dock, { type DockItem } from "./Dock";

export type Station = DockItem;

// The homepage is one horizontal strip. The page still scrolls vertically —
// wheel, trackpad, keyboard and scrollbar all behave normally — and that
// vertical distance is translated into sideways movement of a sticky track.
//
// Horizontal mode only runs where it's comfortable: a fine pointer, enough
// room, and no request for reduced motion. Everywhere else the same stations
// simply stack, and every effect below falls back to its finished state.
const QUERY = "(min-width: 900px) and (min-height: 640px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export default function Filmstrip({ stations, children }: { stations: Station[]; children: ReactNode }) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [active, setActive] = useState(0);
  const geo = useRef({ travel: 0, top: 0, lefts: [] as number[] });

  const stationEls = () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>("[data-station]") ?? []);

  // Where the window has to be for a given station to sit at the left edge.
  const targetFor = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const station = el.closest<HTMLElement>("[data-station]") ?? el.querySelector<HTMLElement>("[data-station]");
    if (!station) return null;
    if (!horizontal) return { top: station.getBoundingClientRect().top + window.scrollY, station };
    const { top, travel } = geo.current;
    return { top: top + Math.min(station.offsetLeft, travel), station };
  }, [horizontal]);

  const go = useCallback((id: string, instant = false) => {
    const t = targetFor(id);
    if (!t) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: t.top, behavior: instant || reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  }, [targetFor]);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setHorizontal(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Measure, then drive everything from scroll in a single animation frame.
  useEffect(() => {
    const runway = runwayRef.current, viewport = viewportRef.current, track = trackRef.current;
    if (!runway || !viewport || !track) return;
    let frame = 0;

    const measure = () => {
      if (horizontal) {
        const travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
        runway.style.height = `${travel + window.innerHeight}px`;
        geo.current = { travel, top: runway.getBoundingClientRect().top + window.scrollY, lefts: stationEls().map((s) => s.offsetLeft) };
      } else {
        runway.style.height = "";
        track.style.transform = "";
        stationEls().forEach((s) => s.style.setProperty("--p", "1"));
      }
    };

    const tick = () => {
      frame = 0;
      const els = stationEls();
      if (horizontal) {
        const { travel, top } = geo.current;
        const x = Math.min(Math.max(window.scrollY - top, 0), travel);
        const vw = viewport.clientWidth;
        track.style.transform = `translate3d(${-x}px, 0, 0)`;
        let current = 0;
        els.forEach((s, i) => {
          const centre = s.offsetLeft + s.offsetWidth / 2 - x;
          const off = (centre - vw / 2) / vw;
          // Full drawing across a small plateau around centre, so a station
          // doesn't need pixel-perfect alignment to look finished.
          const p = 1 - Math.min(Math.max(Math.abs(off) - 0.12, 0) / 0.6, 1);
          s.style.setProperty("--p", p.toFixed(3));
          s.style.setProperty("--d", off.toFixed(3));
          if (s.offsetLeft <= x + vw * 0.45) current = i;
        });
        setActive(current);
      } else {
        let current = 0;
        els.forEach((s, i) => {
          const r = s.getBoundingClientRect();
          s.style.setProperty("--d", ((r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight).toFixed(3));
          if (r.top <= window.innerHeight * 0.45) current = i;
        });
        setActive(current);
      }
    };

    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const onResize = () => { measure(); tick(); };

    measure();
    tick();
    if (location.hash) go(location.hash.slice(1), true);

    // Focus moving into an off-screen station (Tab, or a test filling a form)
    // must bring that station into view, and must never scroll the clipped
    // viewport sideways behind the track's back.
    const onFocus = (e: FocusEvent) => {
      viewport.scrollLeft = 0;
      if (!horizontal) return;
      const station = (e.target as HTMLElement).closest<HTMLElement>("[data-station]");
      if (!station) return;
      const { top, travel } = geo.current;
      const x = window.scrollY - top;
      if (station.offsetLeft < x - 1 || station.offsetLeft + station.offsetWidth > x + viewport.clientWidth + 1) {
        window.scrollTo({ top: top + Math.min(station.offsetLeft, travel), behavior: "auto" });
      }
    };
    const onViewportScroll = () => { viewport.scrollLeft = 0; };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    track.addEventListener("focusin", onFocus);
    viewport.addEventListener("scroll", onViewportScroll);
    document.fonts?.ready.then(onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      track.removeEventListener("focusin", onFocus);
      viewport.removeEventListener("scroll", onViewportScroll);
    };
  }, [horizontal, go]);

  // In-page links, the palette, the terminal and the arrow keys all route here.
  useEffect(() => {
    const onGo = (e: Event) => go((e as CustomEvent<string>).detail);
    const onHash = () => { if (location.hash) go(location.hash.slice(1), true); };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute("href")!.split("#")[1];
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      go(id);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [role=dialog]")) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = Math.min(Math.max(active + (e.key === "ArrowRight" ? 1 : -1), 0), stations.length - 1);
      if (next === active) return;
      e.preventDefault();
      go(stations[next].id);
    };
    window.addEventListener("station:go", onGo);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("station:go", onGo);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [go, active, stations]);

  return (
    <div className="filmstrip" data-filmstrip data-mode={horizontal ? "h" : "v"}>
      <div className="runway" ref={runwayRef}>
        <div className="viewport" ref={viewportRef}>
          <div className="track" ref={trackRef}>{children}</div>
        </div>
      </div>
      <Dock items={stations} active={active} onSelect={go} />
    </div>
  );
}
