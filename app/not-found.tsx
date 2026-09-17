import Link from "next/link";
import Header from "@/components/Header";
import { projects } from "@/lib/content";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="section notfound">
        <div className="wrap notfound-grid">
          <div>
            <p className="notfound-code">404</p>
            <h1>This path doesn’t exist.</h1>
            <p className="lede">
              The page you asked for isn’t here — either it moved, or the link was wrong.
              Everything worth reading is one click away.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/">Back to the homepage</Link>
              <Link className="btn" href="/contact">Tell me what broke</Link>
            </div>
          </div>

          <div className="term notfound-term" aria-hidden="true">
            <div className="term-bar">
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              <span className="term-title">george@paraschos.site</span>
            </div>
            <div className="term-body notfound-term-body">
              <div className="term-line cmd">cd {"<the page you wanted>"}</div>
              <div className="term-line">no such file or directory</div>
              <div className="term-line cmd">ls ~/work</div>
              {projects.map((p) => (
                <div key={p.slug} className="term-line">{p.slug}</div>
              ))}
              <div className="term-line dim">3 directories, 0 dead ends</div>
            </div>
          </div>

          <nav className="notfound-links" aria-label="Projects">
            <p className="muted">Or go straight to a project:</p>
            <ul>
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link className="link" href={`/work/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </>
  );
}
