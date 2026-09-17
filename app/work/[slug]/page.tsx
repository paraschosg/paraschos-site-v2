import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { projects, site } from "@/lib/content";

type Params = { slug: string };

const kindLabel = { solo: "Solo build", coursework: "Coursework", work: "Work" } as const;

// Pre-render every project page at build time; no runtime lookups.
export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: {
      type: "article",
      url: `${site.url}/work/${p.slug}`,
      title: `${p.title} — ${site.name}`,
      description: p.summary,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  const index = projects.findIndex((x) => x.slug === slug);
  const prev = projects[index - 1];
  const next = projects[index + 1];

  return (
    <>
      <Header />
      <main id="main" className="section">
        <article className="wrap project-page">
          <Link href="/work" className="link muted back">← All work</Link>

          <header className="project-page-head">
            <p className="project-page-meta">
              <span className="project-year">{p.year}</span>
              <span className="project-kind" data-kind={p.kind}>{kindLabel[p.kind]}</span>
            </p>
            <h1>{p.title}</h1>
            <p className="lede">{p.summary}</p>
          </header>

          <div className="project-page-body">
            <section>
              <h2>What it does</h2>
              <ul>
                {p.detail.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </section>

            <aside className="project-aside">
              <h2>Built with</h2>
              <div className="chips">
                {p.stack.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <a className="btn btn-primary" href={p.href} target="_blank" rel="noopener">
                View source
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
              </a>
            </aside>
          </div>

          <nav className="project-page-nav" aria-label="Other projects">
            {prev ? <Link href={`/work/${prev.slug}`} className="link">← {prev.title}</Link> : <span />}
            {next ? <Link href={`/work/${next.slug}`} className="link">{next.title} →</Link> : <span />}
          </nav>
        </article>
      </main>
    </>
  );
}
