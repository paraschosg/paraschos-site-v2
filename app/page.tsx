import { Suspense } from "react";
import Header from "@/components/Header";
import Terminal from "@/components/Terminal";
import Projects from "@/components/Projects";
import GitHubActivity from "@/components/GitHubActivity";
import ContactForm from "@/components/ContactForm";
import { now, site, stack } from "@/lib/content";

export default function Home() {
  return (
    <>
      <div id="top" />
      <Header />
      <main id="main">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <p className="hero-eyebrow">
                <span className="availability" aria-hidden="true" />
                {site.name} · open to internships and collaborations
              </p>
              <h1>Backends that stay honest under load.</h1>
              <p className="lede">
                Software engineer in {site.location}, finishing a degree in Information &amp; Communication
                Systems Engineering. I care about concurrency that’s actually correct, APIs that fail
                loudly, and systems that don’t promise more than they can keep.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#work">See the work</a>
                <a className="btn" href="#contact">Get in touch</a>
              </div>
            </div>
            <Terminal />
          </div>
        </section>

        <section className="section" id="work">
          <div className="wrap">
            <div className="section-head">
              <h2>Work</h2>
              <p className="muted prose">Three things worth your time. Each one taught me something I couldn’t have read.</p>
            </div>
            <Projects />
          </div>
        </section>

        <section className="section" id="stack">
          <div className="wrap two-col">
            <div>
              <div className="section-head"><h2>Stack</h2></div>
              <dl className="stack-list">
                {Object.entries(stack).map(([k, v]) => (
                  <div key={k} className="stack-row">
                    <dt>{k}</dt>
                    <dd>{v.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <div className="section-head"><h2>Now</h2></div>
              <ul className="now-list">
                {now.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="github">
          <div className="wrap">
            <div className="section-head">
              <h2>On GitHub</h2>
              <p className="muted prose">Live, not a screenshot. Pulled from the GitHub API at build time and refreshed on a schedule.</p>
            </div>
            <Suspense fallback={<div className="empty">Fetching activity…</div>}>
              <GitHubActivity />
            </Suspense>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="wrap contact-grid">
            <div>
              <div className="section-head"><h2>Say hello</h2></div>
              <p className="prose muted">
                Internships, collaborations, a bug in one of my repos, or a distributed-systems argument
                you want to have with someone — all welcome.
              </p>
              <div className="contact-links">
                <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
                <a className="link" href={site.github} target="_blank" rel="noopener">github.com/{site.handle}</a>
                <a className="link" href={site.linkedin} target="_blank" rel="noopener">LinkedIn</a>
              </div>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap">
          <span>© {new Date().getFullYear()} {site.name}. Built with Next.js. Anonymous, cookie-free analytics — nothing that identifies you.</span>
          <span>Press <kbd className="kbd">⌘K</kbd> — or type <span className="mono">help</span> in the terminal.</span>
        </div>
      </footer>
    </>
  );
}
