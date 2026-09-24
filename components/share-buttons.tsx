"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy } from "lucide-react"

export function ShareButtons({
  title,
  slug,
}: {
  title: string
  slug: string
}) {
  const [copied, setCopied] = useState(false)

  // Construct absolute URL safely on the client
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/konu/${slug}`
    : `https://neonsform.com/konu/${slug}`

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${title} — neonsform`)

  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOptions = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: "hover:text-[#25D366] hover:border-[#25D366]/40",
      label: "WhatsApp",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: "hover:text-[#1DA1F2] hover:border-[#1DA1F2]/40",
      label: "X",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: "hover:text-[#229ED9] hover:border-[#229ED9]/40",
      label: "Telegram",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:text-[#0A66C2] hover:border-[#0A66C2]/40",
      label: "LinkedIn",
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 text-xs">
      <span className="flex items-center gap-1.5 font-medium text-muted-foreground mr-1">
        <Share2 className="size-3.5" /> Paylaş:
      </span>

      {shareOptions.map((opt) => (
        <a
          key={opt.name}
          href={opt.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs text-foreground transition-all hover:bg-card ${opt.color}`}
          title={`${opt.name} ile paylaş`}
        >
          {opt.label}
        </a>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="h-7 px-2.5 text-xs gap-1.5 bg-card/60 border-border"
        title="Bağlantıyı panoya kopyala"
      >
        {copied ? (
          <>
            <Check className="size-3 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Kopyalandı!</span>
          </>
        ) : (
          <>
            <Copy className="size-3" />
            <span>Linki Kopyala</span>
          </>
        )}
      </Button>
    </div>
  )
}
