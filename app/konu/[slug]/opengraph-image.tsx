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

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "linear-gradient(135deg, #0a0f1e 0%, #101830 100%)",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#22d3ee",
          }}
        >
          neonsform
        </div>
        <div
          style={{
            display: "flex",
            padding: "6px 18px",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 600,
            color: categoryColor,
            background: `${categoryColor}22`,
            border: `1px solid ${categoryColor}55`,
          }}
        >
          {category}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: title.length > 80 ? 44 : 56,
          fontWeight: 800,
          lineHeight: 1.2,
          maxWidth: 1000,
        }}
      >
        {title.slice(0, 140)}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 24,
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex" }}>{author ? `@${author}` : ""}</div>
        <div style={{ display: "flex" }}>{commentCount} yorum · neonsform.com</div>
      </div>
    </div>,
    { ...size },
  )
}
