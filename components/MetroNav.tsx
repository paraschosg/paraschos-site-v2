"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { markArrived, pageTransition } from "./dockTransition";
import { applyTheme, currentTheme } from "./ThemeToggle";

// The menu is a metro line: every page is a stop, and the train sits at the
// one you're on. Choosing a stop slides the train there and colours the
// track behind it, so where you are is always visible.

const STOPS = [
  { href: "/", id: "home", label: "Home" },
  { href: "/work", id: "work", label: "Work" },
  { href: "/stack", id: "stack", label: "Stack" },
  { href: "/github", id: "github", label: "GitHub" },
  { href: "/contact", id: "contact", label: "Contact" },
] as const;

export default function MetroNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // A page transition started on the previous page waits for this.
  useEffect(() => { markArrived(); }, [pathname]);

  useEffect(() => {
    setTheme(currentTheme());
    const onChange = () => setTheme(currentTheme());
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);

  const at = STOPS.findIndex((s) => (s.href === "/" ? pathname === "/" : pathname.startsWith(s.href)));
  const index = at === -1 ? 0 : at;
  const ridden = index / (STOPS.length - 1);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string, i: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (i === index) return;
    pageTransition(href, (h) => router.push(h));
  };

  const next = theme === "dark" ? "light" : "dark";

  return (
    <nav className="metro" aria-label="Primary" style={{ "--ridden": ridden } as React.CSSProperties}>
      <div className="metro-inner">
        <div className="metro-track" aria-hidden="true">
          <span className="metro-run" />
          <span className="metro-train" />
        </div>
        <ol className="metro-stops">
          {STOPS.map((s, i) => (
            <li key={s.id}>
              <a
                className="metro-stop"
                href={s.href}
                onClick={(e) => go(e, s.href, i)}
                aria-current={i === index ? "page" : undefined}
              >
                <span className="metro-dot" aria-hidden="true" />
                <span className="metro-name">{s.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="metro-tools">
        <button type="button" aria-label="Search — open command palette" onClick={() => window.dispatchEvent(new Event("palette:open"))}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <button
          type="button"
          aria-label={`Switch to ${next} theme`}
          onClick={() => { applyTheme(next); window.dispatchEvent(new Event("themechange")); }}
        >
          {theme === null ? null : theme === "dark" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          )}
        </button>
      </div>
    </nav>
  );
}
