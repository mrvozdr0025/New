import { ImageResponse } from "next/og"
import { getTopicBySlug } from "@/lib/queries"

export const alt = "neonsform konu görseli"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Dynamic Open Graph image for topic pages (used by social share cards).
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = await getTopicBySlug(slug)

  const title = topic?.title ?? "neonsform"
  const category = topic?.categoryName ?? "Forum"
  const categoryColor = topic?.categoryColor ?? "#22d3ee"
  const author = topic?.authorDisplayName ?? ""
  const commentCount = topic?.commentCount ?? 0
  const isSolved = Boolean(topic?.acceptedCommentId)

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 70px",
        background: "radial-gradient(circle at 15% 15%, #162447 0%, #0a0f1d 55%, #050811 100%)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        border: "12px solid #111c33",
        position: "relative",
      }}
    >
      {/* Top Bar: Brand, Category, Solved */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f8fafc",
            }}
          >
            neons<span style={{ color: "#22d3ee" }}>form</span>
          </div>

          <div
            style={{
              display: "flex",
              padding: "6px 18px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
              color: categoryColor,
              background: `${categoryColor}20`,
              border: `1.5px solid ${categoryColor}60`,
            }}
          >
            {category}
          </div>
        </div>

        {isSolved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 20px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 800,
              color: "#34d399",
              background: "#34d39920",
              border: "1.5px solid #34d39980",
            }}
          >
            ✓ ÇÖZÜLDÜ
          </div>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          display: "flex",
          fontSize: title.length > 80 ? 46 : 58,
          fontWeight: 800,
          lineHeight: 1.25,
          maxWidth: 1060,
          color: "#ffffff",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        {title.slice(0, 140)}
      </div>

      {/* Footer Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 24,
          fontWeight: 600,
          color: "#94a3b8",
          borderTop: "1px solid #1e293b",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#38bdf8" }}>@{author || "neonsform"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>{commentCount} Yorum</span>
          <span>·</span>
          <span style={{ color: "#22d3ee" }}>neonsform.com</span>
        </div>
      </div>
    </div>,
    { ...size },
  )
}
