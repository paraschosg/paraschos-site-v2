"use client";

export default function PaletteButton() {
  return (
    <button type="button" className="tool" onClick={() => window.dispatchEvent(new Event("palette:open"))} aria-label="Search — open command palette">
      <span className="hide-sm">Search</span>
      <kbd className="kbd">⌘K</kbd>
    </button>
  );
}
