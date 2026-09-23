"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createComment } from "@/app/actions/forum"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MentionPopover } from "@/components/mention-popover"
import { useDraft } from "@/hooks/use-draft"
import { AtSign, Bold, ImageIcon, Italic, Loader2, Quote } from "lucide-react"

export function CommentForm({
  topicId,
  parentId = null,
  isAuthed,
  onDone,
  autoFocus = false,
  initialContent = "",
}: {
  topicId: number
  parentId?: number | null
  isAuthed: boolean
  onDone?: () => void
  autoFocus?: boolean
  initialContent?: string
}) {
  const router = useRouter()
  const {
    value: content,
    setValue: setContent,
    clearDraft,
    restored,
  } = useDraft(`comment:${topicId}:${parentId ?? 0}`, initialContent)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const selected = content.slice(s, e) || "metin"
    const next = content.slice(0, s) + before + selected + after + content.slice(e)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + before.length, s + before.length + selected.length)
    })
  }

  function handleContentChange(val: string) {
    setContent(val)
    const el = textareaRef.current
    if (!el) return
    const cursor = el.selectionStart
    const textBefore = val.slice(0, cursor)
    const match = textBefore.match(/@([a-zA-Z0-9_]*)$/)
    if (match) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
    }
  }

  function handleSelectMention(username: string) {
    const el = textareaRef.current
    if (!el) return
    const cursor = el.selectionStart
    const textBefore = content.slice(0, cursor)
    const textAfter = content.slice(cursor)
    const match = textBefore.match(/@([a-zA-Z0-9_]*)$/)
    if (!match) return

    const newBefore = textBefore.slice(0, match.index) + `@${username} `
    const newContent = newBefore + textAfter
    setContent(newContent)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newBefore.length, newBefore.length)
    })
  }

  function insertAtSymbol() {
    const el = textareaRef.current
    if (!el) return
    const cursor = el.selectionStart
    const textBefore = content.slice(0, cursor)
    const textAfter = content.slice(cursor)
    const newBefore = textBefore + "@"
    setContent(newBefore + textAfter)
    setMentionQuery("")
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newBefore.length, newBefore.length)
    })
  }

  async function uploadImage(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız")
      setContent((c) => `${c}${c && !c.endsWith("\n") ? "\n" : ""}![görsel](${data.url})\n`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function submit() {
    if (!isAuthed) {
      router.push("/giris")
      return
    }
    if (!content.trim() || pending) return
    setError(null)
    startTransition(async () => {
      try {
        await createComment(topicId, parentId, content)
        clearDraft()
        onDone?.()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu")
      }
    })
  }

  return (
    <div className="relative flex flex-col gap-2">
      {isAuthed && (
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => wrapSelection("**")}
            aria-label="Kalın"
            title="Kalın (**metin**)"
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => wrapSelection("*")}
            aria-label="İtalik"
            title="İtalik (*metin*)"
          >
            <Italic className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              const el = textareaRef.current
              const sel = el ? content.slice(el.selectionStart, el.selectionEnd) : ""
              setContent((c) => `${c}${c && !c.endsWith("\n") ? "\n" : ""}> ${sel || "alıntı"}\n\n`)
              el?.focus()
            }}
            aria-label="Alıntı"
            title="Alıntı (> metin)"
          >
            <Quote className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={insertAtSymbol}
            aria-label="Bahset"
            title="Kullanıcıdan bahset (@kullanıcı)"
          >
            <AtSign className="size-3.5 text-primary" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Görsel yükle"
            title="Görsel yükle (max 4MB)"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadImage(f)
            }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <span className="ml-auto hidden text-[10px] text-muted-foreground sm:block">
            Markdown ve @bahsetme desteklenir
          </span>
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={isAuthed ? "Düşünceni yaz... (@kullanıcı ile bahsedebilirsin)" : "Yorum yapmak için giriş yap"}
          rows={parentId ? 3 : 4}
          autoFocus={autoFocus}
          aria-label="Yorum"
          className="resize-none bg-background/60"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.metaKey || e.ctrlKey) &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              submit()
            }
          }}
        />

        {mentionQuery !== null && (
          <div className="absolute bottom-full left-0 mb-1">
            <MentionPopover
              query={mentionQuery}
              onSelect={handleSelectMention}
              onClose={() => setMentionQuery(null)}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {restored && content.trim() && (
        <p className="text-xs text-muted-foreground">
          Taslak geri yüklendi.{" "}
          <button type="button" onClick={clearDraft} className="underline hover:text-foreground">
            Temizle
          </button>
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone}>
            Vazgeç
          </Button>
        )}
        <Button size="sm" onClick={submit} disabled={pending || uploading || !content.trim()}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {parentId ? "Cevapla" : "Yorum Yap"}
        </Button>
      </div>
    </div>
  )
}
