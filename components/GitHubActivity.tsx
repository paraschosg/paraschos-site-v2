import { site } from "@/lib/content";

type Event = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: { action?: string; ref?: string; ref_type?: string; commits?: { message: string }[]; pull_request?: { title: string } };
};
type User = { public_repos: number; followers: number; created_at: string };

const headers: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "paraschos.site",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function load() {
  // Fetched on the server, cached at the edge, refreshed at most every 30 minutes.
  const [u, e] = await Promise.all([
    fetch(`https://api.github.com/users/${site.handle}`, { headers, next: { revalidate: 1800 } }),
    fetch(`https://api.github.com/users/${site.handle}/events/public?per_page=30`, { headers, next: { revalidate: 1800 } }),
  ]);
  if (!u.ok || !e.ok) throw new Error(`GitHub responded ${u.status}/${e.status}`);
  return { user: (await u.json()) as User, events: (await e.json()) as Event[] };
}

function describe(ev: Event): { icon: string; text: string } | null {
  const repo = ev.repo.name.replace(`${site.handle}/`, "");
  switch (ev.type) {
    case "PushEvent": {
      const n = ev.payload.commits?.length ?? 0;
      return { icon: "↑", text: `Pushed ${n} commit${n === 1 ? "" : "s"} to ${repo}` };
    }
    case "CreateEvent":
      return { icon: "+", text: `Created ${ev.payload.ref_type} ${ev.payload.ref ?? ""} in ${repo}`.replace(/\s+/g, " ") };
    case "PullRequestEvent":
      return { icon: "⇄", text: `${ev.payload.action} pull request in ${repo}` };
    case "IssuesEvent":
      return { icon: "!", text: `${ev.payload.action} an issue in ${repo}` };
    case "WatchEvent":
      return { icon: "★", text: `Starred ${ev.repo.name}` };
    case "ForkEvent":
      return { icon: "⑂", text: `Forked ${ev.repo.name}` };
    default:
      return null;
  }
}

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function GitHubActivity() {
  let data: Awaited<ReturnType<typeof load>> | null = null;
  try {
    data = await load();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="empty">
        GitHub isn’t answering right now. The activity is still there at{" "}
        <a className="link" href={site.github} target="_blank" rel="noopener">github.com/{site.handle}</a>.
      </div>
    );
  }

  const years = new Date().getFullYear() - new Date(data.user.created_at).getFullYear();
  const items = data.events.map((e) => ({ e, d: describe(e) })).filter((x) => x.d).slice(0, 8);

  return (
    <div className="gh">
      <div>
        <div className="gh-stats">
          <div className="gh-stat"><strong>{data.user.public_repos}</strong><span>public repos</span></div>
          <div className="gh-stat"><strong>{data.user.followers}</strong><span>followers</span></div>
          <div className="gh-stat"><strong>{years}</strong><span>years on GitHub</span></div>
        </div>
        <p className="gh-note">Rendered on the server and revalidated every 30 minutes — no client-side API calls, no rate limits hit by visitors.</p>
      </div>
      {items.length === 0 ? (
        <div className="empty">No public activity in the last while. Probably deep in a private repo.</div>
      ) : (
        <ul className="gh-events">
          {items.map(({ e, d }) => (
            <li key={e.id} className="gh-event">
              <span className="icon" aria-hidden="true">{d!.icon}</span>
              <span>{d!.text}</span>
              <time dateTime={e.created_at}>{ago(e.created_at)}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
