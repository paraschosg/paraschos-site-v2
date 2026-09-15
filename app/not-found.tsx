import Link from "next/link";
import SiteBar from "@/components/SiteBar";
import { projects } from "@/lib/content";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteBar />
      <main id="main" className="lost">
        <p className="lost-code" aria-hidden="true">404</p>
        <h1>This path doesn’t exist.</h1>
        <p className="lede">The link was wrong or the page moved. Pick up the trail from one of these.</p>
        <ul className="lost-links">
          <li><Link className="link" href="/">Back to the homepage</Link></li>
          {projects.map((p) => (
            <li key={p.slug}><Link className="link" href={`/work/${p.slug}`}>{p.title}</Link></li>
          ))}
          <li><Link className="link" href="/#contact">Tell me what broke</Link></li>
        </ul>
      </main>
    </>
  );
}
