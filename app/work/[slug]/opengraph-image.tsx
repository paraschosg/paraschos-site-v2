import { ImageResponse } from "next/og";
import { projects, site } from "@/lib/content";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const kindLabel = { solo: "Solo build", coursework: "Coursework", work: "Work" } as const;

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  const title = p?.title ?? site.name;
  const summary = p?.summary ?? site.tagline;
  const isSolo = p?.kind === "solo";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#f6f2ea",
          color: "#1a1f2b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "#5f5a52" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#1a1f2b", fontWeight: 600 }}>
            <div style={{ width: 20, height: 20, borderRadius: 999, background: "#e0a458" }} />
            paraschos.site
          </div>
          <div>{`work / ${slug}${p ? ` · ${p.year}` : ""}`}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1000 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: "#5f5a52" }}>{summary}</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {p && (
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 999,
                background: isSolo ? "#e0a458" : "#dbe2fa",
                color: isSolo ? "#1a1f2b" : "#0c447c",
              }}
            >
              {kindLabel[p.kind]}
            </div>
          )}
          {p?.stack.slice(0, 5).map((s) => (
            <div key={s} style={{ fontSize: 22, padding: "8px 18px", borderRadius: 999, border: "2px solid #e0d8ca", background: "#ffffff" }}>
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
