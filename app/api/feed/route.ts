import { NextResponse } from "next/server"
import { getFeed, type FeedSort } from "@/lib/queries"
import { getCurrentProfile } from "@/lib/session"

// Serves subsequent feed pages for infinite scroll.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const sortParam = url.searchParams.get("sirala") ?? "aktif"
  const sort = (["yeni", "populer", "aktif", "takip"].includes(sortParam)
    ? sortParam
    : "aktif") as FeedSort
  const page = Math.max(0, Number(url.searchParams.get("sayfa") ?? 0) || 0)
  const categoryIdRaw = url.searchParams.get("kategori")
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined

  // Viewer is needed for the "takip" feed and for muting on every feed.
  const profile = await getCurrentProfile()
  if (sort === "takip" && !profile) return NextResponse.json({ topics: [] })
  const viewerProfileId = profile?.id

  const topics = await getFeed({ sort, page, categoryId, viewerProfileId })
  return NextResponse.json({ topics })
}
