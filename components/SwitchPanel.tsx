"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { markArrived, pageTransition } from "./dockTransition";
import { applyTheme, currentTheme } from "./ThemeToggle";

// The site menu is a panel of physical switches. Throwing one down opens its
// page and lights its indicator; the page you're on stays down. Search is a
// momentary push button and the theme switch flips between light and dark.

const PAGES = [
  { href: "/", id: "home", label: "Home" },
  { href: "/work", id: "work", label: "Work" },
  { href: "/stack", id: "stack", label: "Stack" },
  { href: "/github", id: "github", label: "GitHub" },
  { href: "/contact", id: "contact", label: "Contact" },
] as const;

function Lever({ on }: { on: boolean }) {
  return (
    <span className="sw-slot" aria-hidden="true">
      <span className="sw-lever" />
      <span className="sw-led" data-on={on ? "" : undefined} />
    </span>
  );
}

export default function SwitchPanel() {
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

  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Plain left-clicks transition to the page; new-tab clicks behave as usual.
  const open = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (current(href)) return;
    pageTransition(href, (h) => router.push(h));
  };

  const next = theme === "dark" ? "light" : "dark";

  return (
    <nav className="panel" aria-label="Primary">
      <ul>
        {PAGES.map((p) => (
          <li key={p.id}>
            <a
              className="sw"
              href={p.href}
              onClick={(e) => open(e, p.href)}
              aria-label={p.label}
              aria-current={current(p.href) ? "page" : undefined}
            >
              <Lever on={current(p.href)} />
              <span className="sw-name">{p.label}</span>
            </a>
          </li>
        ))}

        <li className="panel-sep" aria-hidden="true" />

        <li>
          <button
            type="button"
            className="sw sw-push"
            aria-label="Search — open command palette"
            onClick={() => window.dispatchEvent(new Event("palette:open"))}
          >
            <span className="sw-slot" aria-hidden="true"><span className="sw-button" /></span>
            <span className="sw-name">Search</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="sw"
            aria-label={`Switch to ${next} theme`}
            onClick={() => { applyTheme(next); window.dispatchEvent(new Event("themechange")); }}
          >
            <Lever on={theme === "dark"} />
            <span className="sw-name">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
