import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const runtime = "edge";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f6f2ea",
          color: "#1a1f2b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: "#e0a458" }} />
          paraschos.site
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>
            {site.tagline}
          </div>
          <div style={{ fontSize: 34, color: "#5f5a52" }}>
            {site.name} · {site.role} · {site.location}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
