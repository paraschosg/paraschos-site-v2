import MetroNav from "./MetroNav";

export default function Header() {
  return (
    <>
      <header className="header">
        <div className="wrap">
          <a className="brand" href="/" aria-label="George Paraschos, back to top">
            <span className="brand-dot" aria-hidden="true" />
            paraschos
          </a>
        </div>
      </header>
      <MetroNav />
    </>
  );
}
