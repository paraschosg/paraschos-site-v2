// Zoom-from-icon page transitions for the dock, built on the View Transitions
// API. The new page starts at the size and position of the tile you clicked
// and grows to fill the screen, like an app opening from the macOS dock.
//
// The navigation itself is Next's client-side router. startViewTransition
// captures the old page, then waits on a promise that the next page's dock
// resolves when it mounts, so the new snapshot is the fully rendered page.

let arrived: (() => void) | null = null;

/** Called by the dock whenever it mounts on a page. */
export function markArrived() {
  arrived?.();
  arrived = null;
}

type Doc = Document & { startViewTransition?: (cb: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> } };

export function zoomTo(href: string, tile: HTMLElement, navigate: (href: string) => void) {
  const doc = document as Doc;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) {
    navigate(href);
    return;
  }

  const r = tile.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;

  const transition = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        // Never hold the page frozen if something goes wrong on the way.
        const giveUp = setTimeout(resolve, 1500);
        arrived = () => { clearTimeout(giveUp); resolve(); };
        navigate(href);
      }),
  );

  transition.ready.then(() => {
    const easing = "cubic-bezier(0.2, 0.9, 0.25, 1)";
    const duration = 460;

    // New page: from the tile's box to the whole viewport.
    document.documentElement.animate(
      {
        transform: [
          `translate(${r.left}px, ${r.top}px) scale(${r.width / vw}, ${r.height / vh})`,
          "translate(0, 0) scale(1, 1)",
        ],
        borderRadius: ["22%", "0%"],
        opacity: [0.4, 1],
      },
      { duration, easing, pseudoElement: "::view-transition-new(root)", fill: "both" },
    );

    // Old page recedes slightly behind it.
    document.documentElement.animate(
      { transform: ["scale(1)", "scale(0.94)"], opacity: [1, 0.35] },
      { duration, easing, pseudoElement: "::view-transition-old(root)", fill: "both" },
    );
  }).catch(() => {});
}
