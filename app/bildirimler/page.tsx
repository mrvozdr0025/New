import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { markNotificationsRead } from "@/app/actions/forum"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { PushToggle } from "@/components/push-toggle"
import { db } from "@/lib/db"
import { notifications, topics } from "@/lib/db/schema"
import { timeAgo } from "@/lib/format"
import { getCurrentProfile } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { AtSign, Award, Bell, BellRing, Mail, MessageCircle, Sliders, Smile } from "lucide-react"

export const metadata: Metadata = { title: "Bildirimler | neonsform" }

function getNotificationIcon(type: string) {
  switch (type) {
    case "badge":
      return <Award className="size-4 text-amber-400" />
    case "message":
      return <Mail className="size-4 text-cyan-400" />
    case "mention":
      return <AtSign className="size-4 text-primary" />
    case "reaction":
      return <Smile className="size-4 text-rose-400" />
    case "topic_update":
      return <BellRing className="size-4 text-purple-400" />
    case "reply":
      return <MessageCircle className="size-4 text-blue-400" />
    default:
      return <Bell className="size-4 text-primary" />
  }
}

export default async function NotificationsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/giris?next=/bildirimler")

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      message: notifications.message,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      topicSlug: topics.slug,
    })
    .from(notifications)
    .leftJoin(topics, eq(notifications.topicId, topics.id))
    .where(eq(notifications.profileId, profile.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-foreground">Bildirimler</h1>
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/ayarlar/bildirimler" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Sliders className="size-3.5" />
              <span>Tercihler</span>
            </Button>
            <PushToggle />
            {rows.some((n) => !n.isRead) && (
              <form action={markNotificationsRead}>
                <Button type="submit" variant="outline" size="sm">
                  Tümünü okundu işaretle
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((n) => {
            const inner = (
              <div
                className={`glass flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  n.isRead ? "border-border" : "border-primary/40 bg-primary/5"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {getNotificationIcon(n.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground text-pretty">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Okunmadı" />
                )}
              </div>
            )

            if (n.type === "message") {
              return (
                <Link key={n.id} href="/mesajlar">
                  {inner}
                </Link>
              )
            }

            return n.topicSlug ? (
              <Link key={n.id} href={`/konu/${n.topicSlug}`}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            )
          })}
          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Henüz bildirim yok.
            </p>
          )}
        </div>
      </main>
    </>
  )
}
