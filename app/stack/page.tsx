import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { now, stack } from "@/lib/content";

export const metadata: Metadata = { title: "Stack", alternates: { canonical: "/stack" } };

export default function StackPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section" id="stack">
          <div className="wrap two-col">
            <div>
              <div className="section-head"><h1>Stack</h1></div>
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
      </main>
      <Footer />
    </>
  );
}
