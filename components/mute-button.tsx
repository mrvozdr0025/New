"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleMute } from "@/app/actions/forum"
import { Button } from "@/components/ui/button"
import { Loader2, VolumeX, Volume2 } from "lucide-react"

export function MuteButton({
  targetProfileId,
  initialMuted,
  isAuthed,
}: {
  targetProfileId: number
  initialMuted: boolean
  isAuthed: boolean
}) {
  const router = useRouter()
  const [muted, setMuted] = useState(initialMuted)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!isAuthed) {
      router.push("/giris")
      return
    }
    if (pending) return
    startTransition(async () => {
      try {
        const result = await toggleMute(targetProfileId)
        setMuted(result.muted)
        router.refresh()
      } catch {
        // non-fatal; state stays as-is
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className={muted ? "border-destructive/40 text-destructive hover:text-destructive" : "bg-transparent"}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : muted ? (
        <Volume2 className="size-4" />
      ) : (
        <VolumeX className="size-4" />
      )}
      {muted ? "Sesi Aç" : "Sessize Al"}
    </Button>
  )
}
