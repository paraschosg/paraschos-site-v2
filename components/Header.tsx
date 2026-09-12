import ThemeToggle from "./ThemeToggle";
import PaletteButton from "./PaletteButton";

export default function Header() {
  return (
    <header className="header">
      <div className="wrap">
        <a className="brand" href="/" aria-label="George Paraschos, back to top">
          <span className="brand-dot" aria-hidden="true" />
          paraschos
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="/#work" className="hide-sm">Work</a>
          <a href="/#stack" className="hide-sm">Stack</a>
          <a href="/#github" className="hide-sm">GitHub</a>
          <a href="/#contact" className="hide-sm">Contact</a>
          <PaletteButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
