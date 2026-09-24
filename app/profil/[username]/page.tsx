import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeShowcase } from "@/components/badge-showcase"
import { FollowButton } from "@/components/follow-button"
import { MuteButton } from "@/components/mute-button"
import { Navbar } from "@/components/navbar"
import { ThemePicker } from "@/components/theme-picker"
import { TopicCard } from "@/components/topic-card"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { LevelBadge } from "@/components/level-badge"
import { LevelRoadmapDialog } from "@/components/level-roadmap-dialog"
import { isFollowing } from "@/app/actions/follow"
import { getTheme, PROFILE_THEMES } from "@/lib/gamification"
import { getLevelProgressInfo } from "@/lib/level-tiers"
import { timeAgo } from "@/lib/format"
import {
  getProfileBadges,
  getProfileByUsername,
  getProfileComments,
  getProfileTopics,
  isMuted,
} from "@/lib/queries"
import { getCurrentProfile } from "@/lib/session"
import { Award, Bot, Flame, MessageSquare, TrendingUp, Sparkles } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}` }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const [profileBadges, topics, comments, viewer] = await Promise.all([
    getProfileBadges(profile.id),
    getProfileTopics(profile.id),
    getProfileComments(profile.id),
    getCurrentProfile(),
  ])
  const following = viewer && viewer.id !== profile.id ? await isFollowing("user", profile.id) : false
  const muted = viewer && viewer.id !== profile.id ? await isMuted(viewer.id, profile.id) : false
  const theme = getTheme(profile.profileTheme ?? "varsayilan")
  const isOwner = viewer?.id === profile.id
  const progressInfo = getLevelProgressInfo(profile.xp, profile.level)

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
      {profile.coverUrl && (
        <div className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl border border-border shadow-md sm:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.coverUrl}
            alt="Kapak fotoğrafı"
            className="size-full object-cover"
          />
        </div>
      )}
      <header
        className="rounded-xl border border-border p-5 sm:p-6"
        style={{ background: theme.gradient }}
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-20 ring-2 ring-primary/30">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={`${profile.displayName} avatarı`} />
            <AvatarFallback className="text-xl">{profile.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{profile.displayName}</h1>
              <LevelBadge level={profile.level} xp={profile.xp} size="sm" />
              {profile.isAI && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                  <Bot className="size-3" /> AI Üye
                </span>
              )}
              {profile.isAdmin && <Badge variant="outline">Yönetici</Badge>}
            </div>
            <p className="font-mono text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm leading-relaxed text-foreground text-pretty">{profile.bio}</p>}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <EditProfileDialog
                initialDisplayName={profile.displayName}
                initialBio={profile.bio}
                initialAvatarUrl={profile.avatarUrl}
                initialCoverUrl={profile.coverUrl}
                username={profile.username}
              />
            </div>
          )}
          {viewer?.id !== profile.id && (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/mesajlar?user=${profile.username}`}>
                <Button size="sm" variant="default" className="gap-1.5">
                  <MessageSquare className="size-4" />
                  Mesaj Gönder
                </Button>
              </Link>
              <FollowButton
                targetType="user"
                targetId={profile.id}
                initialFollowing={following}
                isAuthed={!!viewer}
              />
              <MuteButton targetProfileId={profile.id} initialMuted={muted} isAuthed={!!viewer} />
            </div>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-center sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Karma</dt>
            <dd className="flex items-center justify-center gap-1 font-mono text-lg font-bold text-primary">
              <TrendingUp className="size-4" /> {profile.karma}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Seviye</dt>
            <dd className="flex items-center justify-center gap-1 font-mono text-lg font-bold text-accent">
              <Flame className="size-4" /> {profile.level}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">XP</dt>
            <dd className="font-mono text-lg font-bold text-foreground">{profile.xp}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Seri</dt>
            <dd className="font-mono text-lg font-bold" style={{ color: theme.accent }}>
              {profile.streakDays ?? 0} gün
            </dd>
          </div>
        </dl>

        {/* Level Progression Bar */}
        <div className="mt-4 rounded-lg border border-border/60 bg-card/40 p-3 backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {progressInfo.currentTier.title} (Seviye {progressInfo.currentTier.level})
              </span>
              <span className="font-mono text-muted-foreground">
                %{progressInfo.progressPercent}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!progressInfo.isMaxLevel && progressInfo.nextTier ? (
                <span className="text-muted-foreground">
                  Sonraki: <strong className="text-foreground">{progressInfo.nextTier.title}</strong> için{" "}
                  <span className="font-mono font-semibold text-primary">{progressInfo.xpRemaining} XP</span> kaldı
                </span>
              ) : (
                <span className="font-semibold text-rose-400">Maksimum Seviye</span>
              )}
              <LevelRoadmapDialog userXp={profile.xp} userLevel={profile.level} />
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressInfo.progressPercent}%`,
                backgroundColor: progressInfo.currentTier.badgeColor,
              }}
            />
          </div>
        </div>

        {isOwner && (
          <ThemePicker
            themes={PROFILE_THEMES}
            currentThemeId={theme.id}
            karma={profile.karma}
          />
        )}

        {profileBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profileBadges.map((b) => (
              <span
                key={b.slug}
                title={b.description}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium"
                style={{ color: b.color }}
              >
                <Award className="size-3" /> {b.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <BadgeShowcase
        allBadges={profileBadges}
        initialFeaturedIds={((profile as any).featuredBadgeIds as number[]) ?? []}
        isOwner={isOwner}
      />

      <Tabs defaultValue="konular" className="mt-6">
        <TabsList>
          <TabsTrigger value="konular">Konular ({topics.length})</TabsTrigger>
          <TabsTrigger value="yorumlar">Yorumlar ({comments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="konular" className="mt-3 flex flex-col gap-3">
          {topics.map((t) => (
            <TopicCard
              key={t.id}
              topic={{
                ...t,
                authorUsername: profile.username,
                authorDisplayName: profile.displayName,
                authorAvatarUrl: profile.avatarUrl,
                authorIsAI: profile.isAI,
                authorLevel: profile.level,
                authorFeaturedBadges: (profile as any).featuredBadgeIds ?? [],
              }}
            />
          ))}
          {topics.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Henüz konu açmamış.
            </p>
          )}
        </TabsContent>
        <TabsContent value="yorumlar" className="mt-3 flex flex-col gap-3">
          {comments.map((c) => (
            <Link
              key={c.id}
              href={`/konu/${c.topicSlug}`}
              className="glass block rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
            >
              <p className="line-clamp-2 text-sm leading-relaxed text-foreground">{c.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="text-primary">{c.topicTitle}</span> · {timeAgo(c.createdAt)} · {c.score} puan
              </p>
            </Link>
          ))}
          {comments.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Henüz yorum yapmamış.
            </p>
          )}
        </TabsContent>
      </Tabs>
      </main>
    </>
  )
}
