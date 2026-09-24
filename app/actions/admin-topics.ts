"use server"

import { db } from "@/lib/db"
import {
  categories,
  comments,
  profiles,
  tags,
  topics,
  topicTags,
} from "@/lib/db/schema"
import { requireAdmin, requirePermission } from "@/lib/session"
import { recordContentRevision } from "@/app/actions/moderation"
import { slugify } from "@/lib/format"
import { and, desc, eq, ilike, inArray, or, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type AdminTopicItem = {
  id: number
  title: string
  slug: string
  content: string
  categoryId: number
  categoryName: string
  categorySlug: string
  categoryColor: string
  authorProfileId: number
  authorName: string
  authorUsername: string
  authorAvatarUrl: string | null
  authorIsAI: boolean
  isLocked: boolean
  isPinned: boolean
  isHot: boolean
  isDailyTopic: boolean
  isPoll: boolean
  score: number
  commentCount: number
  viewCount: number
  createdAt: Date
  lastActivityAt: Date
  tags: string[]
}

export type AdminTopicFilters = {
  search?: string
  categoryId?: number
  status?: "all" | "pinned" | "locked" | "hot" | "daily"
  sortBy?: "newest" | "oldest" | "comments" | "views" | "score"
  page?: number
  limit?: number
}

export type AdminTopicStats = {
  totalTopics: number
  lockedTopics: number
  pinnedTopics: number
  hotTopics: number
  dailyTopics: number
  totalComments: number
  totalViews: number
}

export async function getAdminTopics(filters: AdminTopicFilters = {}): Promise<{
  topics: AdminTopicItem[]
  totalCount: number
  categories: Array<{ id: number; name: string; color: string }>
  stats: AdminTopicStats
}> {
  await requirePermission("canLockTopics")

  const {
    search = "",
    categoryId,
    status = "all",
    sortBy = "newest",
    page = 1,
    limit = 25,
  } = filters

  const conditions = []

  if (search.trim()) {
    const q = `%${search.trim()}%`
    conditions.push(
      or(
        ilike(topics.title, q),
        ilike(topics.content, q),
        ilike(profiles.username, q),
        ilike(profiles.displayName, q)
      )
    )
  }

  if (categoryId && categoryId > 0) {
    conditions.push(eq(topics.categoryId, categoryId))
  }

  if (status === "pinned") conditions.push(eq(topics.isPinned, true))
  if (status === "locked") conditions.push(eq(topics.isLocked, true))
  if (status === "hot") conditions.push(eq(topics.isHot, true))
  if (status === "daily") conditions.push(eq(topics.isDailyTopic, true))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  let orderBy
  switch (sortBy) {
    case "oldest":
      orderBy = topics.createdAt
      break
    case "comments":
      orderBy = desc(topics.commentCount)
      break
    case "views":
      orderBy = desc(topics.viewCount)
      break
    case "score":
      orderBy = desc(topics.score)
      break
    case "newest":
    default:
      orderBy = desc(topics.createdAt)
      break
  }

  const offset = (Math.max(1, page) - 1) * limit

  // Total count for current filter
  const countResult = await db
    .select({ count: count() })
    .from(topics)
    .innerJoin(categories, eq(topics.categoryId, categories.id))
    .innerJoin(profiles, eq(topics.authorProfileId, profiles.id))
    .where(whereClause)

  const totalCount = Number(countResult[0]?.count ?? 0)

  // Fetch rows
  const rows = await db
    .select({
      id: topics.id,
      title: topics.title,
      slug: topics.slug,
      content: topics.content,
      categoryId: topics.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
      authorProfileId: topics.authorProfileId,
      authorName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      authorIsAI: profiles.isAI,
      isLocked: topics.isLocked,
      isPinned: topics.isPinned,
      isHot: topics.isHot,
      isDailyTopic: topics.isDailyTopic,
      isPoll: topics.isPoll,
      score: topics.score,
      commentCount: topics.commentCount,
      viewCount: topics.viewCount,
      createdAt: topics.createdAt,
      lastActivityAt: topics.lastActivityAt,
    })
    .from(topics)
    .innerJoin(categories, eq(topics.categoryId, categories.id))
    .innerJoin(profiles, eq(topics.authorProfileId, profiles.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset)

  // Fetch tags for these topics
  const topicIds = rows.map((r) => r.id)
  let tagsMap: Record<number, string[]> = {}
  if (topicIds.length > 0) {
    const tagRows = await db
      .select({
        topicId: topicTags.topicId,
        tagName: tags.name,
      })
      .from(topicTags)
      .innerJoin(tags, eq(topicTags.tagId, tags.id))
      .where(inArray(topicTags.topicId, topicIds))

    for (const tr of tagRows) {
      if (!tagsMap[tr.topicId]) tagsMap[tr.topicId] = []
      tagsMap[tr.topicId].push(tr.tagName)
    }
  }

  const topicItems: AdminTopicItem[] = rows.map((r) => ({
    ...r,
    tags: tagsMap[r.id] ?? [],
  }))

  // Fetch categories list
  const catList = await db
    .select({ id: categories.id, name: categories.name, color: categories.color })
    .from(categories)

  // Stats across the whole forum
  const [statsRow] = await db
    .select({
      totalTopics: count(),
      lockedTopics: sql<number>`count(*) filter (where ${topics.isLocked} = true)`,
      pinnedTopics: sql<number>`count(*) filter (where ${topics.isPinned} = true)`,
      hotTopics: sql<number>`count(*) filter (where ${topics.isHot} = true)`,
      dailyTopics: sql<number>`count(*) filter (where ${topics.isDailyTopic} = true)`,
      totalComments: sql<number>`coalesce(sum(${topics.commentCount}), 0)`,
      totalViews: sql<number>`coalesce(sum(${topics.viewCount}), 0)`,
    })
    .from(topics)

  const stats: AdminTopicStats = {
    totalTopics: Number(statsRow?.totalTopics ?? 0),
    lockedTopics: Number(statsRow?.lockedTopics ?? 0),
    pinnedTopics: Number(statsRow?.pinnedTopics ?? 0),
    hotTopics: Number(statsRow?.hotTopics ?? 0),
    dailyTopics: Number(statsRow?.dailyTopics ?? 0),
    totalComments: Number(statsRow?.totalComments ?? 0),
    totalViews: Number(statsRow?.totalViews ?? 0),
  }

  return {
    topics: topicItems,
    totalCount,
    categories: catList,
    stats,
  }
}

export async function adminUpdateTopic(
  topicId: number,
  data: {
    title: string
    content: string
    categoryId: number
    isPinned?: boolean
    isLocked?: boolean
    isHot?: boolean
    isDailyTopic?: boolean
    tags?: string[]
    reason?: string
  }
) {
  const me = await requirePermission("canLockTopics")

  const [existing] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!existing) throw new Error("Konu bulunamadı")

  const cleanTitle = data.title.trim()
  const cleanContent = data.content.trim()

  if (!cleanTitle || cleanTitle.length < 3) {
    throw new Error("Başlık en az 3 karakter olmalıdır")
  }
  if (!cleanContent || cleanContent.length < 10) {
    throw new Error("İçerik en az 10 karakter olmalıdır")
  }

  // Record audit revision if text changed
  if (existing.title !== cleanTitle || existing.content !== cleanContent) {
    await recordContentRevision(
      "topic",
      topicId,
      existing.content,
      existing.title,
      me.id,
      data.reason?.trim() || "Yönetici konu düzenlemesi"
    )
  }

  const updateSet: Record<string, any> = {
    title: cleanTitle,
    content: cleanContent,
    categoryId: data.categoryId,
    lastActivityAt: new Date(),
  }

  if (typeof data.isPinned === "boolean") {
    await requirePermission("canPinTopics")
    updateSet.isPinned = data.isPinned
  }
  if (typeof data.isLocked === "boolean") {
    updateSet.isLocked = data.isLocked
  }
  if (typeof data.isHot === "boolean") {
    updateSet.isHot = data.isHot
  }
  if (typeof data.isDailyTopic === "boolean") {
    updateSet.isDailyTopic = data.isDailyTopic
  }

  await db.update(topics).set(updateSet).where(eq(topics.id, topicId))

  // Update tags if provided
  if (data.tags) {
    await db.delete(topicTags).where(eq(topicTags.topicId, topicId))
    for (const name of data.tags) {
      const tagSlug = slugify(name)
      if (!tagSlug) continue
      const [tag] = await db
        .insert(tags)
        .values({ name, slug: tagSlug })
        .onConflictDoUpdate({ target: tags.slug, set: { name } })
        .returning()
      await db.insert(topicTags).values({ topicId, tagId: tag.id }).onConflictDoNothing()
    }
  }

  revalidatePath("/admin/konular")
  revalidatePath(`/konu/${existing.slug}`)
  revalidatePath("/")

  return { success: true, message: "Konu başarıyla güncellendi." }
}

export async function adminToggleTopicFlag(
  topicId: number,
  flag: "pin" | "lock" | "hot" | "daily",
  value: boolean
) {
  if (flag === "pin") await requirePermission("canPinTopics")
  else await requirePermission("canLockTopics")

  const [t] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!t) throw new Error("Konu bulunamadı")

  const updateField: Record<string, boolean> = {}
  if (flag === "pin") updateField.isPinned = value
  if (flag === "lock") updateField.isLocked = value
  if (flag === "hot") updateField.isHot = value
  if (flag === "daily") updateField.isDailyTopic = value

  await db.update(topics).set(updateField).where(eq(topics.id, topicId))

  revalidatePath("/admin/konular")
  revalidatePath(`/konu/${t.slug}`)
  revalidatePath("/")

  return { success: true }
}

export async function adminDeleteTopic(topicId: number, reason?: string) {
  const me = await requirePermission("canDeleteTopics")

  const [t] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!t) throw new Error("Konu bulunamadı")

  // Record revision
  await recordContentRevision(
    "topic",
    topicId,
    t.content,
    t.title,
    me.id,
    reason?.trim() || "Yönetici tarafından silindi"
  )

  // Delete dependencies
  await db.delete(topicTags).where(eq(topicTags.topicId, topicId))
  await db.delete(comments).where(eq(comments.topicId, topicId))
  await db.delete(topics).where(eq(topics.id, topicId))

  revalidatePath("/admin/konular")
  revalidatePath("/admin/moderasyon")
  revalidatePath("/")

  return { success: true, message: `"${t.title}" başlıklı konu silindi.` }
}
