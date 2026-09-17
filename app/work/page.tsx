import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Projects from "@/components/Projects";

export const metadata: Metadata = { title: "Work", alternates: { canonical: "/work" } };

export default function WorkPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section" id="work">
          <div className="wrap">
            <div className="section-head">
              <h1>Work</h1>
              <p className="muted prose">Three things worth your time. Each one taught me something I couldn’t have read.</p>
            </div>
            <Projects />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
