// One way to move around the site, used by the ruler, the command palette and
// the terminal. On the homepage the filmstrip listens for this event; anywhere
// else there is no listener, so we navigate home to the station instead.
export function goToStation(id: string) {
  if (document.querySelector("[data-filmstrip]")) {
    window.dispatchEvent(new CustomEvent("station:go", { detail: id }));
  } else {
    window.location.href = `/#${id}`;
  }
}
