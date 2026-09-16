import Link from "next/link";
import { projects } from "@/lib/content";

const kindLabel = { solo: "Solo build", coursework: "Coursework", work: "Work" } as const;

export default function Projects() {
  return (
    <div className="projects">
      {projects.map((p) => (
        <details key={p.slug} className="project" id={`project-${p.slug}`}>
          <summary>
            <span className="project-year">{p.year}</span>
            <span className="project-title">
              <h3>{p.title}</h3>
              <span className="project-kind" data-kind={p.kind}>{kindLabel[p.kind]}</span>
              <p>{p.summary}</p>
            </span>
            <span className="project-toggle" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
            </span>
          </summary>
          <div className="project-body">
            <ul>
              {p.detail.map((d) => <li key={d}>{d}</li>)}
            </ul>
            <div className="project-aside">
              <div className="chips">
                {p.stack.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <div className="project-actions">
                <Link className="btn btn-primary" href={`/work/${p.slug}`}>Read more</Link>
                <a className="btn" href={p.href} target="_blank" rel="noopener">
                  View source
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                </a>
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
