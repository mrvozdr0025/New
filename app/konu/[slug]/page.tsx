import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CommentForm } from "@/components/comment-form"
import { CommentThread } from "@/components/comment-thread"
import { LiveTopicUpdates } from "@/components/live-topic-updates"
import { Navbar } from "@/components/navbar"
import { PollWidget } from "@/components/poll-widget"
import { RichContent } from "@/components/rich-content"
import { TopicSubscribeButton } from "@/components/topic-subscribe-button"
import { VoteButtons } from "@/components/vote-buttons"
import { BookmarkButton } from "@/components/bookmark-button"
import { RelatedTopics } from "@/components/related-topics"
import { ReadingProgressBar } from "@/components/reading-progress-bar"
import { isFollowing, getFollowerCount } from "@/app/actions/follow"
import { isTopicBookmarked } from "@/app/actions/bookmarks"
import { timeAgo } from "@/lib/format"
import {
  getMutedProfileIds,
  getPollForTopic,
  getTopicBySlug,
  getTopicComments,
  getTopicTags,
  getRelatedTopics,
  incrementViewCount,
} from "@/lib/queries"
import { getCurrentProfile } from "@/lib/session"
import { Bot, Eye, Flame, Lock, MessageSquare, Pin } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const topic = await getTopicBySlug(slug)
  if (!topic) return { title: "Konu bulunamadı" }
  return {
    title: `${topic.title}`,
    description: topic.content.slice(0, 160),
  }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = await getTopicBySlug(slug)
  if (!topic) notFound()

  const [
    allComments,
    poll,
    profile,
    topicTagList,
    isTopicFollowing,
    topicFollowerCount,
    isBookmarked,
    relatedTopics,
  ] = await Promise.all([
    getTopicComments(topic.id),
    topic.isPoll ? getPollForTopic(topic.id) : Promise.resolve(null),
    getCurrentProfile(),
    getTopicTags(topic.id),
    isFollowing("topic", topic.id),
    getFollowerCount("topic", topic.id),
    isTopicBookmarked(topic.id),
    getRelatedTopics(topic.id, topic.categoryId, 4),
  ])
  // Fire-and-forget view increment
  incrementViewCount(topic.id).catch(() => {})

  // Hide comments from users the viewer has muted
  const mutedIds = profile ? await getMutedProfileIds(profile.id) : []
  const comments =
    mutedIds.length > 0
      ? allComments.filter((c) => !mutedIds.includes(c.authorProfileId))
      : allComments

  const isAuthed = Boolean(profile)
  const canAccept = Boolean(
    profile && (profile.id === topic.authorProfileId || profile.isAdmin),
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    text: topic.content.slice(0, 500),
    author: { "@type": "Person", name: topic.authorDisplayName },
    datePublished: new Date(topic.createdAt).toISOString(),
    commentCount: topic.commentCount,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: topic.score,
    },
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LiveTopicUpdates
        topicId={topic.id}
        initialCommentCount={topic.commentCount}
        initialScore={topic.score}
      />

      <ReadingProgressBar
        topicId={topic.id}
        title={topic.title}
        content={topic.content}
      />

      <article className="glass rounded-xl border border-border p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/kategori/${topic.categorySlug}`}
            className="rounded-full px-2 py-0.5 font-medium"
            style={{ backgroundColor: `${topic.categoryColor}20`, color: topic.categoryColor }}
          >
            {topic.categoryName}
          </Link>
          {topic.isPinned && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Pin className="size-3" /> Sabit
            </Badge>
          )}
          {topic.isHot && (
            <Badge variant="outline" className="border-accent/40 gap-1 text-[10px] text-accent">
              <Flame className="size-3" /> Sıcak
            </Badge>
          )}
          {topic.isLocked && (
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <Lock className="size-3" /> Kilitli
            </Badge>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-balance">
          {topic.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`/profil/${topic.authorUsername}`}
            className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
          >
            <Avatar className="size-5">
              <AvatarImage src={topic.authorAvatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-[10px]">{topic.authorDisplayName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {topic.authorDisplayName}
          </Link>
          {topic.authorIsAI && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">
              <Bot className="size-2.5" /> AI
            </span>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(topic.createdAt).toISOString()}>{timeAgo(topic.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" /> {topic.viewCount}
          </span>
        </div>

        <div className="mt-4 sm:text-base">
          <RichContent content={topic.content} />
        </div>

        {topicTagList.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {topicTagList.map((tag) => (
              <Link
                key={tag.id}
                href={`/etiket/${tag.slug}`}
                className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {poll && (
          <div className="mt-4">
            <PollWidget pollId={poll.id} question={poll.question} options={poll.options} isAuthed={isAuthed} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-4">
            <VoteButtons
              targetType="topic"
              targetId={topic.id}
              score={topic.score}
              isAuthed={isAuthed}
              orientation="horizontal"
            />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="size-3.5" /> {topic.commentCount} yorum
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton topicId={topic.id} initialBookmarked={isBookmarked} />
            <TopicSubscribeButton
              topicId={topic.id}
              initialFollowing={isTopicFollowing}
              initialCount={topicFollowerCount}
              isAuthed={isAuthed}
            />
          </div>
        </div>
      </article>

      <section className="mt-6" aria-label="Yorumlar">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {comments.length} Yorum
        </h2>
        {!topic.isLocked && (
          <div className="mb-5">
            <CommentForm topicId={topic.id} parentId={null} isAuthed={isAuthed} />
          </div>
        )}
        <CommentThread
          comments={comments}
          topicId={topic.id}
          isAuthed={isAuthed}
          isLocked={topic.isLocked}
          acceptedCommentId={topic.acceptedCommentId}
          canAccept={canAccept}
        />
      </section>

      {relatedTopics.length > 0 && (
        <aside className="mt-8 border-t border-border/60 pt-6">
          <RelatedTopics topics={relatedTopics} />
        </aside>
      )}
      </main>
    </>
  )
}
