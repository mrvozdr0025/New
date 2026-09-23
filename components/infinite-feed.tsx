"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TopicCard } from "@/components/topic-card"
import type { FeedTopic } from "@/lib/queries"
import { Loader2 } from "lucide-react"

// Loads feed pages 1..n as the sentinel scrolls into view.
// Page 0 is server-rendered by TopicFeed for SEO and fast first paint.
export function InfiniteFeed({
  sort,
  categoryId,
  isAuthed,
  pageSize,
}: {
  sort: string
  categoryId?: number
  isAuthed: boolean
  pageSize: number
}) {
  const [topics, setTopics] = useState<FeedTopic[]>([])
  const [page, setPage] = useState(0) // last loaded extra page (0 = none yet)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || done) return
    loadingRef.current = true
    setLoading(true)
    try {
      const next = page + 1
      const params = new URLSearchParams({ sirala: sort, sayfa: String(next) })
      if (categoryId) params.set("kategori", String(categoryId))
      const res = await fetch(`/api/feed?${params}`)
      if (!res.ok) throw new Error("feed fetch failed")
      const data: { topics: FeedTopic[] } = await res.json()
      setTopics((prev) => {
        const seen = new Set(prev.map((t) => t.id))
        return [...prev, ...data.topics.filter((t) => !seen.has(t.id))]
      })
      setPage(next)
      if (data.topics.length < pageSize) setDone(true)
    } catch {
      setDone(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [page, done, sort, categoryId, pageSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || done) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: "600px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, done])

  return (
    <>
      {topics.map((t) => (
        <TopicCard key={t.id} topic={t} isAuthed={isAuthed} />
      ))}
      {!done && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4" aria-hidden="true">
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>
      )}
      {done && topics.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">Hepsi bu kadar.</p>
      )}
    </>
  )
}
