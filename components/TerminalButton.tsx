"use client";

export default function TerminalButton() {
  return (
    <button type="button" className="tool" onClick={() => window.dispatchEvent(new Event("terminal:open"))} aria-label="Open terminal">
      <span className="hide-sm">Terminal</span>
      <kbd className="kbd">~</kbd>
    </button>
  );
}
