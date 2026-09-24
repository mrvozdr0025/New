import { requirePermission } from "@/lib/session"
import { getAdminTopics } from "@/app/actions/admin-topics"
import { TopicManager } from "@/components/admin/topic-manager"

export const metadata = {
  title: "Konu Yönetimi | Yönetim Paneli",
  description: "Forumdaki konuları görüntüleyin, arayın, filtreleyin, düzenleyin ve yönetin.",
}

export default async function AdminKonularPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    kategori?: string
    durum?: "all" | "pinned" | "locked" | "hot" | "daily"
    sirala?: "newest" | "oldest" | "comments" | "views" | "score"
    sayfa?: string
  }>
}) {
  await requirePermission("canLockTopics")

  const sp = await searchParams
  const search = sp.q ?? ""
  const categoryId = Math.max(0, Number(sp.kategori ?? 0) || 0)
  const status = (["all", "pinned", "locked", "hot", "daily"].includes(sp.durum ?? "")
    ? sp.durum
    : "all") as "all" | "pinned" | "locked" | "hot" | "daily"
  const sortBy = (["newest", "oldest", "comments", "views", "score"].includes(sp.sirala ?? "")
    ? sp.sirala
    : "newest") as "newest" | "oldest" | "comments" | "views" | "score"
  const page = Math.max(1, Number(sp.sayfa ?? 1) || 1)

  const { topics, totalCount, categories, stats } = await getAdminTopics({
    search,
    categoryId,
    status,
    sortBy,
    page,
    limit: 25,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Konu Yönetimi</h1>
        <p className="text-xs text-muted-foreground">
          Forumda açılan tüm konuları görüntüleyin, başlık ve içeriklerini düzenleyin, sabitleyin, kilitleyin veya silin.
        </p>
      </div>

      <TopicManager
        initialTopics={topics}
        categories={categories}
        stats={stats}
        totalCount={totalCount}
        currentFilters={{
          search,
          categoryId,
          status,
          sortBy,
          page,
        }}
      />
    </div>
  )
}
