"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TopicCard } from "@/components/topic-card"
import type { FeedTopic } from "@/lib/queries"
import { Loader2 } from "lucide-react"

interface InfiniteFeedProps {
  sort: string
  categoryId?: number
  isAuthed: boolean
  pageSize: number
  initialCursor?: string | null
}

// Loads feed pages via cursor-based pagination as the sentinel scrolls into view.
// Page 0 is server-rendered by TopicFeed for SEO and fast first paint.
export function InfiniteFeed({
  sort,
  categoryId,
  isAuthed,
  pageSize,
  initialCursor = null,
}: InfiniteFeedProps) {
  const [topics, setTopics] = useState<FeedTopic[]>([])
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  // Reset when sort or category changes
  useEffect(() => {
    setTopics([])
    setCursor(initialCursor)
    setDone(false)
  }, [sort, categoryId, initialCursor])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || done) return
    loadingRef.current = true
    setLoading(true)

    try {
      const params = new URLSearchParams({ sirala: sort })
      if (cursor) params.set("cursor", cursor)
      if (categoryId) params.set("kategori", String(categoryId))

      const res = await fetch(`/api/feed?${params.toString()}`)
      if (!res.ok) throw new Error("feed fetch failed")

      const data: {
        topics: FeedTopic[]
        nextCursor: string | null
        hasMore: boolean
      } = await res.json()

      if (!data.topics || data.topics.length === 0) {
        setDone(true)
        return
      }

      setTopics((prev) => {
        const seen = new Set(prev.map((t) => t.id))
        const newOnes = data.topics.filter((t) => !seen.has(t.id))
        return [...prev, ...newOnes]
      })

      setCursor(data.nextCursor)
      if (!data.hasMore || !data.nextCursor || data.topics.length < pageSize) {
        setDone(true)
      }
    } catch {
      setDone(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [cursor, done, sort, categoryId, pageSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || done) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: "600px" }
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
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-4"
          aria-hidden="true"
        >
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>
      )}
      {done && topics.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">Hepsi bu kadar.</p>
      )}
    </>
  )
}
