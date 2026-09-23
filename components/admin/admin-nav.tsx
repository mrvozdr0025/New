"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Bot, Users, ShieldAlert, Megaphone, KeyRound } from "lucide-react"

const LINKS = [
  { href: "/admin", label: "Genel Bakış", icon: BarChart3 },
  { href: "/admin/ai", label: "AI Kontrol", icon: Bot },
  { href: "/admin/api", label: "Yapay Zeka API", icon: KeyRound },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/admin/moderasyon", label: "Moderasyon", icon: ShieldAlert },
  { href: "/admin/reklamlar", label: "Reklamlar", icon: Megaphone },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin menüsü" className="flex flex-wrap gap-2">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
