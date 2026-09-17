import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GitHubActivity from "@/components/GitHubActivity";

export const metadata: Metadata = { title: "GitHub", alternates: { canonical: "/github" } };


export default function GitHubPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section" id="github">
          <div className="wrap">
            <div className="section-head">
              <h1>On GitHub</h1>
              <p className="muted prose">Live, not a screenshot. Pulled from the GitHub API at build time and refreshed on a schedule.</p>
            </div>
            <Suspense fallback={<div className="empty">Fetching activity…</div>}>
              <GitHubActivity />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
