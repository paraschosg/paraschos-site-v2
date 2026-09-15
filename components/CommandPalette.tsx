"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/lib/content";
import { applyTheme, currentTheme } from "./ThemeToggle";
import { goToStation } from "@/lib/go";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  keywords?: string;
  run: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setIndex(0);
  }, []);

  const go = useCallback(
    (hash: string) => {
      close();
      goToStation(hash.slice(1));
    },
    [close],
  );

  const commands = useMemo<Command[]>(
    () => [
      { id: "work", label: "Go to work", icon: "#", hint: "section", keywords: "projects", run: () => go("#work") },
      { id: "stack", label: "Go to stack", icon: "#", hint: "section", keywords: "skills tools", run: () => go("#stack") },
      { id: "now", label: "Go to now", icon: "#", hint: "section", keywords: "current", run: () => go("#now") },
      { id: "github", label: "Go to GitHub activity", icon: "#", hint: "section", run: () => go("#github") },
      { id: "contact", label: "Go to contact", icon: "#", hint: "section", keywords: "email message", run: () => go("#contact") },
      {
        id: "theme",
        label: "Toggle theme",
        icon: "◐",
        hint: "light / dark",
        run: () => {
          applyTheme(currentTheme() === "dark" ? "light" : "dark");
          window.dispatchEvent(new Event("themechange"));
          close();
        },
      },
      {
        id: "email",
        label: copied ? "Copied!" : "Copy email address",
        icon: "@",
        hint: site.email,
        run: async () => {
          await navigator.clipboard.writeText(site.email);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            close();
          }, 700);
        },
      },
      { id: "gh", label: "Open GitHub profile", icon: "↗", hint: "github.com", run: () => { window.open(site.github, "_blank", "noopener"); close(); } },
      { id: "li", label: "Open LinkedIn", icon: "↗", hint: "linkedin.com", run: () => { window.open(site.linkedin, "_blank", "noopener"); close(); } },
      { id: "terminal", label: "Open the terminal", icon: "❯", hint: "or press ~", run: () => { close(); window.dispatchEvent(new Event("terminal:open")); } },
    ],
    [go, close, copied],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        close();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", onOpen);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or jump to a section…"
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={filtered[index] ? `cmd-${filtered[index].id}` : undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter" && filtered[index]) { e.preventDefault(); filtered[index].run(); }
          }}
        />
        {filtered.length === 0 ? (
          <p className="palette-empty">Nothing matches “{query}”. Try “contact” or “theme”.</p>
        ) : (
          <ul id="palette-list" role="listbox">
            {filtered.map((c, i) => (
              <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === index}>
                <button type="button" onMouseEnter={() => setIndex(i)} onClick={c.run}>
                  <span className="icon" aria-hidden="true">{c.icon}</span>
                  {c.label}
                  {c.hint && <span className="hint">{c.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
