"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { projects, site, stack } from "@/lib/content";
import { applyTheme, currentTheme } from "./ThemeToggle";

type Line = { kind: "cmd" | "out" | "dim"; body: ReactNode };

const COMMANDS = ["help", "whoami", "projects", "stack", "contact", "theme", "open", "clear", "history"];

// Types out a hint in the empty input so a visitor sees the terminal is
// theirs to use. Stops the moment they touch it, and never runs for anyone
// who has asked for reduced motion.
function useTypedHint(active: boolean) {
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHint("help");
      return;
    }
    const word = "help";
    let i = 0;
    const start = window.setTimeout(function step() {
      setHint(word.slice(0, ++i));
      if (i < word.length) window.setTimeout(step, 110);
    }, 700);
    return () => window.clearTimeout(start);
  }, [active]);

  return hint;
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "dim", body: "Welcome. This is a real terminal, sort of. Type `help`." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hint = useTypedHint(!touched);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const print = (...out: Line[]) => setLines((l) => [...l, ...out]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    print({ kind: "cmd", body: cmd });
    setHistory((h) => [cmd, ...h].slice(0, 50));
    setCursor(-1);

    const [name, ...args] = cmd.split(/\s+/);
    switch (name.toLowerCase()) {
      case "help":
        print({ kind: "out", body: "Commands: " + COMMANDS.join("  ") }, { kind: "dim", body: "Tab completes. ↑↓ walk history. ⌘K opens the palette." });
        break;
      case "whoami":
        print({ kind: "out", body: `${site.name} — ${site.role}, ${site.location}.` }, { kind: "out", body: site.tagline });
        break;
      case "projects":
        projects.forEach((p) => print({ kind: "out", body: `${p.slug.padEnd(12)} ${p.title}` }));
        print({ kind: "dim", body: "open <name> to jump to it, e.g. `open airline`." });
        break;
      case "stack":
        Object.entries(stack).forEach(([k, v]) => print({ kind: "out", body: `${k}: ${v.join(", ")}` }));
        break;
      case "contact":
        print(
          { kind: "out", body: <a href={`mailto:${site.email}`}>{site.email}</a> },
          { kind: "out", body: <a href={site.github} target="_blank" rel="noopener">{site.github.replace("https://", "")}</a> },
          { kind: "out", body: <a href={site.linkedin} target="_blank" rel="noopener">linkedin.com/in/george-paraschos</a> },
        );
        break;
      case "theme": {
        const next = args[0] === "light" || args[0] === "dark" ? args[0] : currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        window.dispatchEvent(new Event("themechange"));
        print({ kind: "dim", body: `Theme set to ${next}.` });
        break;
      }
      case "open": {
        const target = args[0];
        const project = projects.find((p) => p.slug === target);
        const sections = ["work", "stack", "github", "contact"];
        if (project) {
          window.location.href = `/work/${project.slug}`;
          print({ kind: "dim", body: `Opening ${project.title}…` });
        } else if (target && sections.includes(target)) {
          window.location.href = `/${target}`;
          print({ kind: "dim", body: `Opening ${target}…` });
        } else {
          print({ kind: "out", body: `open: what? Try one of: ${[...projects.map((p) => p.slug), ...sections].join(", ")}` });
        }
        break;
      }
      case "clear":
        setLines([]);
        break;
      case "history":
        history.forEach((h, i) => print({ kind: "dim", body: `${String(history.length - i).padStart(3)}  ${h}` }));
        break;
      case "sudo":
        print({ kind: "out", body: "Nice try. This incident will be reported to nobody." });
        break;
      case "ls":
        print({ kind: "out", body: "work/  stack/  github/  contact/  .secrets  (just kidding)" });
        break;
      default:
        print({ kind: "out", body: `${name}: command not found. Type \`help\`.` });
    }
  };

  return (
    <div className="term" aria-label="Interactive terminal">
      <div className="term-bar">
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        <span className="term-title">george@paraschos.site</span>
      </div>
      <div
        className="term-body"
        ref={bodyRef}
        onClick={() => inputRef.current?.focus()}
        role="log"
        aria-live="polite"
      >
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.kind}`}>{l.body}</div>
        ))}
      </div>
      <div className="term-input-row" data-empty={input.length === 0 ? "" : undefined} data-focused={focused ? "" : undefined}>
        {!focused && input.length === 0 && (
          <span className="term-hint" aria-hidden="true">
            {hint}
            <span className="term-caret" />
          </span>
        )}
        <input
          ref={inputRef}
          className="term-input"
          value={input}
          placeholder=""
          onFocus={() => { setFocused(true); setTouched(true); }}
          onBlur={() => setFocused(false)}
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { run(input); setInput(""); }
            else if (e.key === "Tab") {
              e.preventDefault();
              const match = COMMANDS.find((c) => c.startsWith(input.toLowerCase()) && input);
              if (match) setInput(match + " ");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const next = Math.min(cursor + 1, history.length - 1);
              if (history[next] !== undefined) { setCursor(next); setInput(history[next]); }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = cursor - 1;
              setCursor(next);
              setInput(next < 0 ? "" : history[next]);
            } else if (e.key === "l" && e.ctrlKey) {
              e.preventDefault();
              setLines([]);
            }
          }}
        />
      </div>
    </div>
  );
}
