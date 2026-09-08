"use client";

export default function PaletteButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("palette:open"))}
      aria-label="Open command palette"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
    >
      <span className="hide-sm">Search</span>
      <kbd className="kbd">⌘K</kbd>
    </button>
  );
}
