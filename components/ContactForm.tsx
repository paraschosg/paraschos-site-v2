"use client";

import { useState } from "react";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "err"; message: string };
type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(f: FormData): Errors {
  const e: Errors = {};
  const name = String(f.get("name") ?? "").trim();
  const email = String(f.get("email") ?? "").trim();
  const message = String(f.get("message") ?? "").trim();
  if (name.length < 2) e.name = "Tell me who you are.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "That doesn’t look like an email address.";
  if (message.length < 20) e.message = "A little more detail helps — at least 20 characters.";
  return e;
}

export default function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setState({ kind: "ok" });
      form.reset();
    } catch (err) {
      setState({ kind: "err", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
        {errors.name && <span id="name-err" className="field-error">{errors.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
        {errors.email && <span id="email-err" className="field-error">{errors.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-err" : undefined} />
        {errors.message && <span id="message-err" className="field-error">{errors.message}</span>}
      </div>
      {/* Honeypot: real people never see or fill this. Bots do. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <button className="btn btn-primary" type="submit" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
      {state.kind === "ok" && (
        <p className="form-status" data-state="ok" role="status">Sent. I read everything and reply to most things within a day.</p>
      )}
      {state.kind === "err" && (
        <p className="form-status" data-state="err" role="alert">Couldn’t send: {state.message} You can email me directly instead.</p>
      )}
    </form>
  );
}
