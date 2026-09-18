// Page transitions for the dock, on the View Transitions API.
//
// The old page fades out, the new one fades in while rising a few pixels.
// Only opacity and a small translate are animated — both are cheap for the
// compositor, so it stays smooth on large pages.

let arrived: (() => void) | null = null;
let running: Promise<void> | null = null;

/** Resolves once any page transition in flight has finished. */
export function whenSettled(): Promise<void> {
  return running ?? Promise.resolve();
}

/** Called by the dock whenever it mounts on a page. */
export function markArrived() {
  arrived?.();
  arrived = null;
}

type Doc = Document & { startViewTransition?: (cb: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> } };

export function pageTransition(href: string, navigate: (href: string) => void) {
  const doc = document as Doc;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) {
    navigate(href);
    return;
  }

  // One at a time: a second transition would cut the first one short.
  if (running) {
    navigate(href);
    return;
  }

  const transition = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        // Never hold the page frozen if something goes wrong on the way.
        const giveUp = setTimeout(resolve, 1500);
        arrived = () => { clearTimeout(giveUp); resolve(); };
        navigate(href);
      }),
  );

  running = transition.finished.then(() => { running = null; }, () => { running = null; });

  transition.ready.then(() => {
    const easing = "cubic-bezier(0.22, 0.8, 0.3, 1)";

    document.documentElement.animate(
      { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0)"] },
      { duration: 300, easing, pseudoElement: "::view-transition-new(root)", fill: "both" },
    );

    document.documentElement.animate(
      { opacity: [1, 0] },
      { duration: 150, easing: "linear", pseudoElement: "::view-transition-old(root)", fill: "both" },
    );
  }).catch(() => {});
}
