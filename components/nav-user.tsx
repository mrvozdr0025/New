"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { Bell, Bookmark, LogOut, Mail, Newspaper, Shield, Sliders, Trophy, User } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function NavUser({
  username,
  displayName,
  avatarUrl,
  isAdmin,
  unread: initialUnread,
}: {
  username: string
  displayName: string
  avatarUrl: string | null
  isAdmin: boolean
  unread: number
}) {
  const router = useRouter()
  // Live unread count: poll every 30s, refresh on tab focus
  const { data } = useSWR<{ unread: number }>("/api/notifications/unread", fetcher, {
    refreshInterval: 30000,
    fallbackData: { unread: initialUnread },
  })
  const unread = data?.unread ?? initialUnread

  async function signOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-full outline-none ring-primary focus-visible:ring-2">
        <Avatar className="size-8 border border-border">
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <span className="sr-only">Hesap menüsü</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-mono">@{username}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/profil/${username}`} />}>
          <User className="size-4" /> Profilim
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/mesajlar" />}>
          <Mail className="size-4" /> Mesajlar
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/kaydedilenler" />}>
          <Bookmark className="size-4" /> Kaydedilenler
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/liderler" />}>
          <Trophy className="size-4" /> Liderler
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/bulten" />}>
          <Newspaper className="size-4" /> Haftalık Bülten
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/bildirimler" />}>
          <Bell className="size-4" /> Bildirimler
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/ayarlar/bildirimler" />}>
          <Sliders className="size-4" /> Bildirim Tercihleri
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield className="size-4" /> Admin Paneli
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} variant="destructive">
          <LogOut className="size-4" /> Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
