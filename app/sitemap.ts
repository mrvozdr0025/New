import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { categories, tags, topics } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return "https://neonsform.com"
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl()

  const [cats, latestTopics, allTags] = await Promise.all([
    db.select({ slug: categories.slug }).from(categories),
    db
      .select({ slug: topics.slug, lastActivityAt: topics.lastActivityAt })
      .from(topics)
      .orderBy(desc(topics.lastActivityAt))
      .limit(500),
    db.select({ slug: tags.slug }).from(tags).limit(200),
  ])

  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/arena`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/oyun`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/sohbet`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/gorevler`, changeFrequency: "daily", priority: 0.5 },
    ...cats.map((c) => ({
      url: `${base}/kategori/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...latestTopics.map((t) => ({
      url: `${base}/konu/${t.slug}`,
      lastModified: t.lastActivityAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...allTags.map((t) => ({
      url: `${base}/etiket/${t.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ]
}
