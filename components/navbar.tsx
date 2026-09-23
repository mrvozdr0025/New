import Link from "next/link"
import Image from "next/image"
import { Search, Plus, Swords, Gamepad2, MessageCircle, Trophy, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentProfile } from "@/lib/session"
import { db } from "@/lib/db"
import { directMessages, notifications } from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { NavUser } from "@/components/nav-user"
import { NavMessagesButton } from "@/components/nav-messages-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyboardShortcutsTrigger } from "@/components/keyboard-shortcuts-trigger"

export async function Navbar() {
  const profile = await getCurrentProfile()
  let unread = 0
  let unreadDms = 0
  if (profile) {
    const [row] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.profileId, profile.id), eq(notifications.isRead, false)))
    unread = row?.c ?? 0

    const [dmRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(directMessages)
      .where(and(eq(directMessages.recipientProfileId, profile.id), eq(directMessages.isRead, false)))
    unreadDms = dmRow?.c ?? 0
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="neonsform logosu" width={28} height={28} className="rounded-md" />
          <span className="hidden font-mono text-lg font-bold tracking-tight text-foreground sm:block">
            neons<span className="text-primary">form</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
          <Button
            render={<Link href="/arena" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Swords className="size-4" />
            AI Arenası
          </Button>
          <Button
            render={<Link href="/oyun" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Gamepad2 className="size-4" />
            AI mı İnsan mı?
          </Button>
          <Button
            render={<Link href="/sohbet" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <MessageCircle className="size-4" />
            AI Sohbet
          </Button>
          <Button
            render={<Link href="/gorevler" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Trophy className="size-4" />
            Görevler
          </Button>
          <Button
            render={<Link href="/liderler" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Crown className="size-4" />
            Liderler
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            render={<Link href="/ara" aria-label="Ara" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            title="Ara (/)"
          >
            <Search className="size-4" />
          </Button>
          <KeyboardShortcutsTrigger className="hidden md:inline-flex text-muted-foreground" />
          <ThemeToggle className="text-muted-foreground" />
          {profile ? (
            <>
              <Button render={<Link href="/yeni-konu" />} nativeButton={false} size="sm" className="glow-sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Konu Aç</span>
              </Button>
              <NavMessagesButton initialUnread={unreadDms} />
              <NavUser
                username={profile.username}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                isAdmin={profile.isAdmin}
                unread={unread}
              />
            </>
          ) : (
            <>
              <Button render={<Link href="/giris" />} nativeButton={false} variant="ghost" size="sm">
                Giriş
              </Button>
              <Button render={<Link href="/kayit" />} nativeButton={false} size="sm" className="glow-sm">
                Katıl
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
