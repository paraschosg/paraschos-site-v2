import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteBar from "@/components/SiteBar";
import Sketch from "@/components/Sketch";
import { projects, site } from "@/lib/content";

type Params = { slug: string };

const kindLabel = { solo: "Solo build", coursework: "Coursework", work: "Work" } as const;
const sketchFor = { airline: "airline", "camera-sense": "camera", "image-inspector": "inspector" } as const;

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
      <SiteBar />
      <main id="main" className="case">
        <article>
          <header className="case-head">
            <Link href={`/#project-${p.slug}`} className="link case-back">Back to the strip</Link>
            <p className="project-meta"><span>{p.year}, {kindLabel[p.kind].toLowerCase()}</span></p>
            <h1>{p.title}</h1>
            <p className="lede">{p.summary}</p>
          </header>

          <figure className="case-figure">
            <Sketch kind={sketchFor[p.slug as keyof typeof sketchFor]} />
          </figure>

          <div className="case-body">
            <section>
              <h2>What it does</h2>
              <ul className="project-detail">
                {p.detail.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </section>
            <aside>
              <h2>Built with</h2>
              <p className="project-stack">{p.stack.join(", ")}</p>
              <a className="btn btn-primary" href={p.href} target="_blank" rel="noopener">View source on GitHub</a>
            </aside>
          </div>

          <nav className="case-nav" aria-label="Other projects">
            {prev ? <Link href={`/work/${prev.slug}`} className="link">Previous: {prev.title}</Link> : <span />}
            {next ? <Link href={`/work/${next.slug}`} className="link">Next: {next.title}</Link> : <span />}
          </nav>
        </article>
      </main>
    </>
  );
}
