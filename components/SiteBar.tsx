import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import PaletteButton from "./PaletteButton";
import TerminalButton from "./TerminalButton";

export default function SiteBar() {
  return (
    <header className="sitebar">
      <Link className="wordmark" href="/" aria-label="George Paraschos, home">George Paraschos</Link>
      <div className="sitebar-tools">
        <TerminalButton />
        <PaletteButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
