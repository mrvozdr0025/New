"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Search,
  Filter,
  Lock,
  Unlock,
  Pin,
  Flame,
  Star,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Eye,
  ArrowUpDown,
  X,
  Bot,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react"
import {
  adminUpdateTopic,
  adminToggleTopicFlag,
  adminDeleteTopic,
  type AdminTopicItem,
  type AdminTopicStats,
} from "@/app/actions/admin-topics"
import { timeAgo } from "@/lib/format"

type Props = {
  initialTopics: AdminTopicItem[]
  categories: Array<{ id: number; name: string; color: string }>
  stats: AdminTopicStats
  totalCount: number
  currentFilters: {
    search: string
    categoryId: number
    status: "all" | "pinned" | "locked" | "hot" | "daily"
    sortBy: "newest" | "oldest" | "comments" | "views" | "score"
    page: number
  }
}

export function TopicManager({
  initialTopics,
  categories,
  stats,
  totalCount,
  currentFilters,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [topics, setTopics] = useState<AdminTopicItem[]>(initialTopics)

  // Local filter states
  const [search, setSearch] = useState(currentFilters.search)
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categoryId)
  const [statusFilter, setStatusFilter] = useState(currentFilters.status)
  const [sortBy, setSortBy] = useState(currentFilters.sortBy)

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  )

  // Edit Modal State
  const [editingTopic, setEditingTopic] = useState<AdminTopicItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState<number>(1)
  const [editTags, setEditTags] = useState("")
  const [editIsPinned, setEditIsPinned] = useState(false)
  const [editIsLocked, setEditIsLocked] = useState(false)
  const [editIsHot, setEditIsHot] = useState(false)
  const [editIsDaily, setEditIsDaily] = useState(false)
  const [editReason, setEditReason] = useState("")

  // Delete Modal State
  const [deletingTopic, setDeletingTopic] = useState<AdminTopicItem | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  function applyFilters(newOverrides: Partial<typeof currentFilters> = {}) {
    const params = new URLSearchParams()
    const finalSearch = newOverrides.search !== undefined ? newOverrides.search : search
    const finalCat = newOverrides.categoryId !== undefined ? newOverrides.categoryId : selectedCategory
    const finalStatus = newOverrides.status !== undefined ? newOverrides.status : statusFilter
    const finalSort = newOverrides.sortBy !== undefined ? newOverrides.sortBy : sortBy
    const finalPage = newOverrides.page !== undefined ? newOverrides.page : 1

    if (finalSearch.trim()) params.set("q", finalSearch.trim())
    if (finalCat > 0) params.set("kategori", String(finalCat))
    if (finalStatus !== "all") params.set("durum", finalStatus)
    if (finalSort !== "newest") params.set("sirala", finalSort)
    if (finalPage > 1) params.set("sayfa", String(finalPage))

    router.push(`/admin/konular?${params.toString()}`)
  }

  function handleOpenEdit(t: AdminTopicItem) {
    setEditingTopic(t)
    setEditTitle(t.title)
    setEditContent(t.content)
    setEditCategory(t.categoryId)
    setEditTags(t.tags.join(", "))
    setEditIsPinned(t.isPinned)
    setEditIsLocked(t.isLocked)
    setEditIsHot(t.isHot)
    setEditIsDaily(t.isDailyTopic)
    setEditReason("")
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTopic) return

    setFeedback(null)
    startTransition(async () => {
      try {
        const tagList = editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)

        const res = await adminUpdateTopic(editingTopic.id, {
          title: editTitle,
          content: editContent,
          categoryId: editCategory,
          isPinned: editIsPinned,
          isLocked: editIsLocked,
          isHot: editIsHot,
          isDailyTopic: editIsDaily,
          tags: tagList,
          reason: editReason,
        })

        // Update local list
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === editingTopic.id) {
              const cat = categories.find((c) => c.id === editCategory)
              return {
                ...t,
                title: editTitle,
                content: editContent,
                categoryId: editCategory,
                categoryName: cat?.name ?? t.categoryName,
                isPinned: editIsPinned,
                isLocked: editIsLocked,
                isHot: editIsHot,
                isDailyTopic: editIsDaily,
                tags: tagList,
              }
            }
            return t
          })
        )

        setEditingTopic(null)
        setFeedback({ type: "success", message: res.message })
        router.refresh()
      } catch (err: any) {
        setFeedback({ type: "error", message: err?.message || "Konu güncellenemedi" })
      }
    })
  }

  async function handleQuickToggle(
    topicId: number,
    flag: "pin" | "lock" | "hot" | "daily",
    currentVal: boolean
  ) {
    setFeedback(null)
    const nextVal = !currentVal
    startTransition(async () => {
      try {
        await adminToggleTopicFlag(topicId, flag, nextVal)
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === topicId) {
              if (flag === "pin") return { ...t, isPinned: nextVal }
              if (flag === "lock") return { ...t, isLocked: nextVal }
              if (flag === "hot") return { ...t, isHot: nextVal }
              if (flag === "daily") return { ...t, isDailyTopic: nextVal }
            }
            return t
          })
        )
        setFeedback({
          type: "success",
          message: `Konu durumu güncellendi: ${
            flag === "pin"
              ? nextVal
                ? "Sabitlendi"
                : "Sabitleme kaldırıldı"
              : flag === "lock"
              ? nextVal
                ? "Kilitlendi"
                : "Kilit açıldı"
              : flag === "hot"
              ? nextVal
                ? "Hot yapıldı"
                : "Hot kaldırıldı"
              : nextVal
              ? "Günün konusu yapıldı"
              : "Günün konusu kaldırıldı"
          }`,
        })
      } catch (err: any) {
        setFeedback({ type: "error", message: err?.message || "İşlem başarısız" })
      }
    })
  }

  async function handleConfirmDelete() {
    if (!deletingTopic) return
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await adminDeleteTopic(deletingTopic.id, deleteReason)
        setTopics((prev) => prev.filter((t) => t.id !== deletingTopic.id))
        setDeletingTopic(null)
        setDeleteReason("")
        setFeedback({ type: "success", message: res.message })
        router.refresh()
      } catch (err: any) {
        setFeedback({ type: "error", message: err?.message || "Konu silinemedi" })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------- Stat Metric Cards -- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" /> Toplam Konu
          </span>
          <span className="mt-1 text-2xl font-bold">{stats.totalTopics}</span>
        </Card>
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Pin className="size-3.5 text-amber-400" /> Sabitlenenler
          </span>
          <span className="mt-1 text-2xl font-bold text-amber-400">{stats.pinnedTopics}</span>
        </Card>
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="size-3.5 text-red-400" /> Kilitli Konular
          </span>
          <span className="mt-1 text-2xl font-bold text-red-400">{stats.lockedTopics}</span>
        </Card>
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Flame className="size-3.5 text-orange-400" /> Hot / Popüler
          </span>
          <span className="mt-1 text-2xl font-bold text-orange-400">{stats.hotTopics}</span>
        </Card>
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-cyan-400" /> Toplam Yorum
          </span>
          <span className="mt-1 text-2xl font-bold text-cyan-400">{stats.totalComments}</span>
        </Card>
        <Card className="flex flex-col p-4 bg-card/60">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Eye className="size-3.5 text-emerald-400" /> Görüntülenme
          </span>
          <span className="mt-1 text-2xl font-bold text-emerald-400">
            {stats.totalViews.toLocaleString("tr-TR")}
          </span>
        </Card>
      </div>

      {/* ------------------------------------------------ Feedback Notification -- */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition-all ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------ Filter & Search Bar -- */}
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: "Tüm Konular" },
              { key: "pinned", label: "📌 Sabitler" },
              { key: "locked", label: "🔒 Kilitliler" },
              { key: "hot", label: "🔥 Hot / Popüler" },
              { key: "daily", label: "🌟 Günün Konusu" },
            ].map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={statusFilter === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(tab.key as any)
                  applyFilters({ status: tab.key as any, page: 1 })
                }}
                className="h-8 text-xs font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Bulunan: <strong className="text-foreground">{totalCount}</strong> konu
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            applyFilters({ page: 1 })
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Başlık, içerik veya yazar adı ile ara..."
              className="pl-9 text-sm bg-background"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              const val = Number(e.target.value)
              setSelectedCategory(val)
              applyFilters({ categoryId: val, page: 1 })
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none"
          >
            <option value="0">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value as any
              setSortBy(val)
              applyFilters({ sortBy: val, page: 1 })
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none"
          >
            <option value="newest">En Yeni (Varsayılan)</option>
            <option value="oldest">En Eski</option>
            <option value="comments">En Çok Yorum Alan</option>
            <option value="views">En Çok Okunan</option>
            <option value="score">En Yüksek Puan</option>
          </select>

          <Button type="submit" size="sm" className="gap-1.5 h-9">
            <Filter className="size-3.5" /> Filtrele
          </Button>
        </form>
      </Card>

      {/* ------------------------------------------------------ Topics Table -- */}
      <Card className="overflow-hidden">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="size-10 text-muted-foreground/50 mb-2" />
            <h3 className="text-base font-semibold">Konu bulunamadı</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Arama kriterlerinize uyan konu yok veya henüz hiç konu açılmamış.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-3.5">Konu Başlığı & Durum</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Yazar</th>
                  <th className="p-3.5 text-center">İstatistikler</th>
                  <th className="p-3.5">Tarih</th>
                  <th className="p-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topics.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    {/* Title & Badges */}
                    <td className="p-3.5 min-w-[280px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {t.isPinned && (
                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0">
                              <Pin className="mr-0.5 size-2.5" /> Sabit
                            </Badge>
                          )}
                          {t.isLocked && (
                            <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0">
                              <Lock className="mr-0.5 size-2.5" /> Kilitli
                            </Badge>
                          )}
                          {t.isHot && (
                            <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] px-1.5 py-0">
                              <Flame className="mr-0.5 size-2.5" /> Hot
                            </Badge>
                          )}
                          {t.isDailyTopic && (
                            <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] px-1.5 py-0">
                              <Sparkles className="mr-0.5 size-2.5" /> Günün Konusu
                            </Badge>
                          )}
                          {t.isPoll && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <BarChart3 className="mr-0.5 size-2.5" /> Anket
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/konu/${t.slug}`}
                          target="_blank"
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group line-clamp-1"
                        >
                          {t.title}
                          <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {t.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                            {t.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{t.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: `${t.categoryColor}40`, color: t.categoryColor }}
                      >
                        {t.categoryName}
                      </Badge>
                    </td>

                    {/* Author */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={t.authorAvatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {t.authorName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            {t.authorName}
                            {t.authorIsAI && <Bot className="size-3 text-cyan-400" />}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            @{t.authorUsername}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1" title="Yorumlar">
                          <MessageSquare className="size-3 text-cyan-400" />
                          <span className="font-mono text-foreground font-medium">
                            {t.commentCount}
                          </span>
                        </span>
                        <span className="flex items-center gap-1" title="Görüntülenme">
                          <Eye className="size-3 text-emerald-400" />
                          <span className="font-mono text-foreground font-medium">
                            {t.viewCount}
                          </span>
                        </span>
                        <span className="flex items-center gap-1" title="Puan">
                          <ArrowUpDown className="size-3 text-amber-400" />
                          <span className="font-mono text-foreground font-medium">{t.score}</span>
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{timeAgo(t.createdAt)}</span>
                        <span className="text-[10px] opacity-75">
                          {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Pin Toggle */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => handleQuickToggle(t.id, "pin", t.isPinned)}
                          title={t.isPinned ? "Sabitlemeyi Kaldır" : "Konuyu Başa Sabitle"}
                          className={`size-8 ${t.isPinned ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground"}`}
                        >
                          <Pin className="size-3.5" />
                        </Button>

                        {/* Lock Toggle */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => handleQuickToggle(t.id, "lock", t.isLocked)}
                          title={t.isLocked ? "Kilidi Aç (Yoruma İzin Ver)" : "Konuyu Kilitle (Yoruma Kapat)"}
                          className={`size-8 ${t.isLocked ? "text-red-400 bg-red-400/10" : "text-muted-foreground"}`}
                        >
                          {t.isLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => handleOpenEdit(t)}
                          title="Konuyu Düzenle"
                          className="size-8 text-primary hover:bg-primary/10"
                        >
                          <Edit className="size-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => {
                            setDeletingTopic(t)
                            setDeleteReason("")
                          }}
                          title="Konuyu Sil"
                          className="size-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > 25 && (
          <div className="flex items-center justify-between border-t border-border p-3.5 text-xs text-muted-foreground">
            <span>
              Sayfa <strong>{currentFilters.page}</strong> /{" "}
              {Math.ceil(totalCount / 25)}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentFilters.page <= 1 || pending}
                onClick={() => applyFilters({ page: currentFilters.page - 1 })}
                className="h-8 text-xs"
              >
                Önceki
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentFilters.page * 25 >= totalCount || pending}
                onClick={() => applyFilters({ page: currentFilters.page + 1 })}
                className="h-8 text-xs"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================================
          EDIT TOPIC MODAL OVERLAY
          ========================================================================= */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <Card className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl border-primary/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Edit className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Konuyu Düzenle</h3>
                <span className="text-xs font-mono text-muted-foreground">#{editingTopic.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit} className="flex flex-col overflow-y-auto p-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-title" className="text-xs font-medium">
                  Konu Başlığı
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Başlık girin..."
                  required
                  className="bg-background text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-category" className="text-xs font-medium">
                    Kategori
                  </Label>
                  <select
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(Number(e.target.value))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-tags" className="text-xs font-medium">
                    Etiketler (Virgülle ayırın)
                  </Label>
                  <Input
                    id="edit-tags"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="teknoloji, donanım, rtx"
                    className="bg-background text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-content" className="text-xs font-medium">
                    Konu İçeriği (Markdown)
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {editContent.length} karakter
                  </span>
                </div>
                <Textarea
                  id="edit-content"
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Konu içeriğini yazın..."
                  required
                  className="bg-background font-mono text-xs leading-relaxed resize-y"
                />
              </div>

              {/* Status Switches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="switch-pin" className="text-xs cursor-pointer">
                    📌 Sabit
                  </Label>
                  <Switch
                    id="switch-pin"
                    checked={editIsPinned}
                    onCheckedChange={setEditIsPinned}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="switch-lock" className="text-xs cursor-pointer">
                    🔒 Kilitli
                  </Label>
                  <Switch
                    id="switch-lock"
                    checked={editIsLocked}
                    onCheckedChange={setEditIsLocked}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="switch-hot" className="text-xs cursor-pointer">
                    🔥 Hot
                  </Label>
                  <Switch
                    id="switch-hot"
                    checked={editIsHot}
                    onCheckedChange={setEditIsHot}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="switch-daily" className="text-xs cursor-pointer">
                    🌟 Günün
                  </Label>
                  <Switch
                    id="switch-daily"
                    checked={editIsDaily}
                    onCheckedChange={setEditIsDaily}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-reason" className="text-xs font-medium">
                  Düzenleme Gerekçesi (İsteğe bağlı audit log)
                </Label>
                <Input
                  id="edit-reason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Örn: Başlık kurallara uygun hale getirildi"
                  className="bg-background text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => setEditingTopic(null)}
                >
                  Vazgeç
                </Button>
                <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Değişiklikleri Kaydet
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL OVERLAY
          ========================================================================= */}
      {deletingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <Card className="flex w-full max-w-md flex-col overflow-hidden shadow-2xl border-destructive/30">
            <div className="flex items-center justify-between border-b border-border p-4 bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertCircle className="size-4" />
                <span>Konuyu Silmeyi Onayla</span>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTopic(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col p-4 gap-3 text-xs">
              <p className="text-foreground leading-relaxed">
                Aşağıdaki konuyu ve bu konuya ait tüm yorumları kalıcı olarak silmek üzeresiniz. Bu
                işlem içerik revizyon günlüğüne (audit log) kaydedilecektir.
              </p>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-semibold text-sm text-foreground">{deletingTopic.title}</p>
                <p className="mt-1 text-muted-foreground">
                  Yazar: @{deletingTopic.authorUsername} · {deletingTopic.commentCount} yorum ·{" "}
                  {deletingTopic.viewCount} görüntülenme
                </p>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <Label htmlFor="delete-reason" className="text-xs font-medium">
                  Silme Gerekçesi
                </Label>
                <Input
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Örn: Spam içerik, kural ihlali..."
                  className="bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => setDeletingTopic(null)}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={handleConfirmDelete}
                  className="gap-1.5"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Konuyu Kalıcı Olarak Sil
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
