import { site } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <span>© {new Date().getFullYear()} {site.name}. Built with Next.js. Anonymous, cookie-free analytics — nothing that identifies you.</span>
        <span>Press <kbd className="kbd">⌘K</kbd> to search.</span>
      </div>
    </footer>
  );
}
