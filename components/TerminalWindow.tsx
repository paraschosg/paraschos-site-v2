"use client";

import { useEffect, useRef, useState } from "react";
import Terminal from "./Terminal";

// The terminal floats above whatever page you're on and can be dragged by its
// title bar. It opens from the header button, the command palette, or the ~ key.
export default function TerminalWindow() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, [contenteditable]");
      if ((e.key === "~" || e.key === "`") && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen((v) => { if (!v) opener.current = document.activeElement as HTMLElement; return !v; }); }
      else if (e.key === "Escape" && ref.current?.contains(document.activeElement)) setOpen(false);
    };
    window.addEventListener("terminal:open", show);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("terminal:open", show); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLInputElement>(".term-input")?.focus();
    else opener.current?.focus?.();
  }, [open]);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button") || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    const move = (ev: PointerEvent) => {
      const x = Math.min(Math.max(ev.clientX - dx, 8), window.innerWidth - r.width - 8);
      const y = Math.min(Math.max(ev.clientY - dy, 8), window.innerHeight - 60);
      setPos({ x, y });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="term-window"
      role="dialog"
      aria-label="Terminal"
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
    >
      <div className="term-drag" onPointerDown={startDrag}>
        <span>george@paraschos.site</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close terminal">Close</button>
      </div>
      <Terminal />
    </div>
  );
}
