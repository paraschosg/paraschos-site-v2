import { Suspense } from "react";
import Link from "next/link";
import SiteBar from "@/components/SiteBar";
import Filmstrip, { type Station } from "@/components/Filmstrip";
import Sketch from "@/components/Sketch";
import StackStrips from "@/components/StackStrips";
import GitHubActivity from "@/components/GitHubActivity";
import ContactForm from "@/components/ContactForm";
import { now, projects, site } from "@/lib/content";

const kindLabel = { solo: "Solo build", coursework: "Coursework", work: "Work" } as const;
const sketchFor = { airline: "airline", "camera-sense": "camera", "image-inspector": "inspector" } as const;

const stations: Station[] = [
  { id: "top", label: "Hello" },
  ...projects.map((p) => ({ id: `project-${p.slug}`, label: p.title.replace(" management system", "") })),
  { id: "stack", label: "Stack" },
  { id: "now", label: "Now" },
  { id: "github", label: "GitHub" },
  { id: "contact", label: "Contact" },
];

export default function Home() {
  return (
    <>
      <SiteBar />
      <main id="main">
        <Filmstrip stations={stations}>
          <section className="station station-hello" id="top" data-station aria-labelledby="hello-title">
            <div className="hello-copy">
              <p className="hello-status"><span className="availability" aria-hidden="true" />Open to internships and collaborations</p>
              <h1 id="hello-title">Backends that stay honest under load.</h1>
              <p className="lede">
                I’m a software engineer in {site.location}, finishing a degree in Information &amp; Communication
                Systems Engineering. I care about concurrency that’s actually correct, APIs that fail
                loudly, and systems that don’t promise more than they can keep.
              </p>
              <div className="actions">
                <a className="btn btn-primary" href="#work">See the work</a>
                <a className="btn" href="#contact">Get in touch</a>
              </div>
            </div>
            <figure className="hello-figure">
              <Sketch kind="load" className="sketch-intro" />
              <figcaption>Keep scrolling. The page moves sideways.</figcaption>
            </figure>
          </section>

          <div className="work-group" id="work">
            <h2 className="visually-hidden">Work</h2>
            {projects.map((p, i) => (
              <article key={p.slug} className="station station-project" id={`project-${p.slug}`} data-station aria-labelledby={`t-${p.slug}`}>
                <div className="project-copy">
                  <p className="project-meta">
                    <span>Work {i + 1} of {projects.length}</span>
                    <span>{p.year}, {kindLabel[p.kind].toLowerCase()}</span>
                  </p>
                  <h3 id={`t-${p.slug}`}>{p.title}</h3>
                  <p className="project-summary">{p.summary}</p>
                  <ul className="project-detail">
                    {p.detail.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                  <p className="project-stack">{p.stack.join(", ")}</p>
                  <div className="actions">
                    <Link className="btn btn-primary" href={`/work/${p.slug}`}>Read the case study</Link>
                    <a className="btn" href={p.href} target="_blank" rel="noopener">View source</a>
                  </div>
                </div>
                <div className="project-figure">
                  <Sketch kind={sketchFor[p.slug as keyof typeof sketchFor]} />
                </div>
              </article>
            ))}
          </div>

          <section className="station station-stack" id="stack" data-station aria-labelledby="stack-title">
            <h2 id="stack-title">What I build with</h2>
            <StackStrips />
          </section>

          <section className="station station-now" id="now" data-station aria-labelledby="now-title">
            <div className="journal">
              <h2 id="now-title">Now</h2>
              <ul>
                {now.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          </section>

          <section className="station station-github" id="github" data-station aria-labelledby="gh-title">
            <h2 id="gh-title">Recent activity on GitHub</h2>
            <Suspense fallback={<p className="signals-empty">Fetching activity…</p>}>
              <GitHubActivity />
            </Suspense>
          </section>

          <section className="station station-contact" id="contact" data-station aria-labelledby="contact-title">
            <div className="postcard">
              <div className="postcard-message">
                <h2 id="contact-title">Say hello</h2>
                <p>
                  Internships, collaborations, a bug in one of my repos, or a distributed-systems argument
                  you want to have with someone. All welcome.
                </p>
                <ul className="postcard-links">
                  <li><a className="link" href={`mailto:${site.email}`}>{site.email}</a></li>
                  <li><a className="link" href={site.github} target="_blank" rel="noopener">github.com/{site.handle}</a></li>
                  <li><a className="link" href={site.linkedin} target="_blank" rel="noopener">LinkedIn</a></li>
                </ul>
                <p className="postcard-foot">
                  © {new Date().getFullYear()} {site.name}. Built with Next.js. Anonymous, cookie-free analytics.
                </p>
              </div>
              <ContactForm />
            </div>
          </section>
        </Filmstrip>
      </main>
    </>
  );
}
