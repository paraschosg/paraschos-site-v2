import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section" id="contact">
          <div className="wrap contact-grid">
            <div>
              <div className="section-head"><h1>Say hello</h1></div>
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
      <Footer />
    </>
  );
}
