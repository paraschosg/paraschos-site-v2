"use client";

import { useState } from "react";
import { site } from "@/lib/content";

// The hero is a circuit board: each section of the page is a component, and
// the traces between them are the real dependencies. Hovering (or focusing) a
// component lights the traces that leave it, so the picture teaches the
// structure of the site rather than decorating it.
//
// Accessibility drove the markup: every component is an <a> inside the SVG's
// foreignObject-free structure, so it is tabbable, has a real href, and works
// with a screen reader as a plain navigation list. The board is the visual
// layer on top of that list, never a replacement for it.

type Part = {
  id: string;
  href: string;
  label: string;
  sub: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pins?: "both" | "none";
};

const PARTS: Part[] = [
  { id: "core", href: "#work", label: "WORK", sub: "3 projects", note: "The main package. Three pins out, one per project.", x: 246, y: 96, w: 148, h: 64, pins: "both" },
  { id: "stack", href: "#stack", label: "STACK", sub: "12 parts", note: "Languages, runtimes and data stores, as a capacitor bank.", x: 64, y: 196, w: 132, h: 40 },
  { id: "signal", href: "#github", label: "SIGNAL", sub: "live", note: "GitHub activity, pulled from the API and refreshed on a schedule.", x: 440, y: 196, w: 132, h: 40 },
  { id: "out", href: "#contact", label: "CONTACT", sub: "output", note: "Where the signal leaves the board and reaches me.", x: 246, y: 262, w: 148, h: 44 },
];

// from → path. Each trace starts at a component and ends at another.
const TRACES: { from: string; d: string }[] = [
  { from: "psu", d: "M132 118 H206 V128 H246" },
  { from: "psu", d: "M132 118 H160 V216 H196" },
  { from: "core", d: "M246 148 H214 V216" },
  { from: "core", d: "M394 148 H426 V216" },
  { from: "core", d: "M320 160 V262" },
  { from: "stack", d: "M130 236 V284 H246" },
  { from: "signal", d: "M506 236 V284 H394" },
];

export default function BoardHero() {
  const [active, setActive] = useState<string | null>(null);
  const part = PARTS.find((p) => p.id === active);

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="wrap">
        <p className="board-meta">
          <span className="availability" aria-hidden="true" />
          <span>{site.name}</span>
          <span className="board-rev">REV 2.1 · ATHENS, GR · OPEN TO INTERNSHIPS</span>
        </p>

        <h1 id="board-title" className="board-title">
          Backends that stay honest <em>under load.</em>
        </h1>

        <p className="board-lede">
          Final-year Information &amp; Communication Systems Engineering at the University
          of the Aegean, part-time engineer at Talent. Follow a trace to see where it goes.
        </p>

        <div className="board-frame">
          <svg viewBox="0 0 640 330" className="board-svg" role="img" aria-label="Diagram of this site's sections as components on a circuit board">
            <defs>
              <pattern id="vias" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="0.9" fill="var(--board-edge)" />
              </pattern>
            </defs>
            <rect width="640" height="330" fill="url(#vias)" />
            <rect x="8" y="8" width="624" height="314" rx="8" fill="none" stroke="var(--board-edge)" />

            <g className="board-traces" fill="none" strokeLinecap="round">
              {TRACES.map((t, i) => (
                <path key={i} d={t.d} className={active === t.from ? "trace on" : "trace"} />
              ))}
            </g>

            {/* power in — the identity block, not a link */}
            <g
              className="part"
              onMouseEnter={() => setActive("psu")}
              onMouseLeave={() => setActive(null)}
            >
              <rect x="36" y="92" width="96" height="52" rx="4" />
              <text x="50" y="116" className="part-label">GEORGE</text>
              <text x="50" y="131" className="part-sub">PARASCHOS</text>
            </g>

            {PARTS.map((p) => (
              <a
                key={p.id}
                href={p.href}
                className="part part-link"
                onMouseEnter={() => setActive(p.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(p.id)}
                onBlur={() => setActive(null)}
              >
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" />
                <text x={p.x + 14} y={p.y + 26} className="part-label">{p.label}</text>
                <text x={p.x + 14} y={p.y + 42} className="part-sub">{p.sub}</text>
                {p.pins === "both" && (
                  <g className="pins">
                    {[12, 30, 48].map((dy) => (
                      <g key={dy}>
                        <rect x={p.x - 6} y={p.y + dy} width="6" height="4" />
                        <rect x={p.x + p.w} y={p.y + dy} width="6" height="4" />
                      </g>
                    ))}
                  </g>
                )}
              </a>
            ))}
          </svg>

          <p className="board-readout" role="status">
            {part ? (
              <><b>{part.label}</b> — {part.note}</>
            ) : active === "psu" ? (
              <><b>GEORGE PARASCHOS</b> — power in. Everything on this board runs from here.</>
            ) : (
              <span className="board-hint">Hover a component, or press Tab to step through them.</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
