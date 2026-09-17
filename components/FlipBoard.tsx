"use client";

import { useEffect, useRef, useState } from "react";

// Split-flap board. Every tile flips forward through the character drum
// until it reaches its letter, one flap at a time, like an airport departures
// board. Text is wrapped by word to fit however many columns the board has.

const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?-'/&@#$%()+=";
const FLAP_MS = 55;          // one flap
const MAX_START_MS = 450;    // latest a tile may start, so the board ripples

function wrap(text: string, cols: number, rows: number): string[] {
  const lines: string[] = [];
  for (const para of text.toUpperCase().split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= cols) line = next;
      else { lines.push(line); line = word.slice(0, cols); }
    }
    lines.push(line);
  }
  // Centre vertically and horizontally inside the board.
  const top = Math.max(0, Math.floor((rows - lines.length) / 2));
  const grid = Array.from({ length: rows }, () => " ".repeat(cols));
  lines.slice(0, rows).forEach((l, i) => {
    const left = Math.floor((cols - l.length) / 2);
    grid[top + i] = (" ".repeat(left) + l).padEnd(cols, " ");
  });
  return grid;
}

function Tile({ char, prev, step }: { char: string; prev: string; step: number }) {
  // `step` changes on every flap so the leaves remount and replay.
  return (
    <span className="flap">
      <span className="flap-half flap-top"><span>{char}</span></span>
      <span className="flap-half flap-bottom"><span>{prev}</span></span>
      {step > 0 && (
        <span key={step} className="flap-leaves">
          <span className="flap-half flap-top flap-fall"><span>{prev}</span></span>
          <span className="flap-half flap-bottom flap-rise"><span>{char}</span></span>
        </span>
      )}
    </span>
  );
}

export default function FlipBoard({ text, rows = 6, maxCols = 22, minCols = 12 }: { text: string; rows?: number; maxCols?: number; minCols?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(maxCols);
  const total = cols * rows;
  const [shown, setShown] = useState<string[]>(() => Array(total).fill(" "));
  const [prev, setPrev] = useState<string[]>(() => Array(total).fill(" "));
  const [steps, setSteps] = useState<number[]>(() => Array(total).fill(0));
  // What the tiles currently read, so a new message flips on from there
  // instead of blanking the board first.
  const onBoard = useRef<string[]>([]);

  // Fewer, larger tiles on narrow screens.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setCols(Math.max(minCols, Math.min(maxCols, Math.floor(el.clientWidth / 44))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxCols, minCols]);

  useEffect(() => {
    const target = wrap(text, cols, rows).join("").split("");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onBoard.current = target;
      setShown(target); setPrev(target); setSteps(Array(target.length).fill(0));
      return;
    }

    const current = onBoard.current.length === target.length ? [...onBoard.current] : Array(target.length).fill(" ");
    const last = [...current];
    const count = Array(target.length).fill(0);
    const changedAt = Array(target.length).fill(-10);
    const startAt = target.map(() => Math.random() * MAX_START_MS);
    const t0 = performance.now();
    let frame = 0;
    let lastTick = 0;
    let tickNo = 0;

    // A tile is "flipping" for two ticks after its last change, long enough
    // for both leaves to finish. Once it settles, both halves show the same
    // character and the leaves are removed, so nothing can freeze half-drawn.
    const publish = () => {
      const flipping = changedAt.map((t) => tickNo - t <= 2);
      onBoard.current = [...current];
      setShown([...current]);
      setPrev(current.map((c, i) => (flipping[i] ? last[i] : c)));
      setSteps(count.map((n, i) => (flipping[i] ? n : 0)));
      return flipping.some(Boolean);
    };

    const tick = (now: number) => {
      if (now - lastTick >= FLAP_MS) {
        lastTick = now;
        tickNo++;
        let busy = false;
        for (let i = 0; i < target.length; i++) {
          if (current[i] === target[i]) continue;
          busy = true;
          if (now - t0 < startAt[i]) continue;
          last[i] = current[i];
          current[i] = DRUM[(DRUM.indexOf(current[i]) + 1) % DRUM.length];
          // Characters not on the drum snap straight to themselves.
          if (!DRUM.includes(target[i])) current[i] = target[i];
          count[i]++;
          changedAt[i] = tickNo;
        }
        const animating = publish();
        if (!busy && !animating) return;
      }
      frame = requestAnimationFrame(tick);
    };
    publish();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, cols, rows]);

  return (
    <div className="flipboard" ref={ref} aria-hidden="true">
      <div className="flipboard-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, "--cols": cols } as React.CSSProperties}>
        {shown.slice(0, total).map((c, i) => (
          <Tile key={`${cols}-${i}`} char={c} prev={prev[i] ?? " "} step={steps[i] ?? 0} />
        ))}
      </div>
    </div>
  );
}
