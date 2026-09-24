"use client"

import { useState, useTransition } from "react"
import { createTopic } from "@/app/actions/forum"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichMarkdownEditor } from "@/components/rich-markdown-editor"
import { useDraft } from "@/hooks/use-draft"
import { BarChart3, Loader2, Plus, X } from "lucide-react"

export function NewTopicForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string>("")
  const [showPoll, setShowPoll] = useState(false)
  const [pollOptionCount, setPollOptionCount] = useState(2)
  const titleDraft = useDraft("new-topic:title")
  const contentDraft = useDraft("new-topic:content")

  const draftRestored =
    (titleDraft.restored && titleDraft.value.trim()) ||
    (contentDraft.restored && contentDraft.value.trim())

  function handleSubmit(formData: FormData) {
    setError(null)
    if (!categoryId) {
      setError("Bir kategori seçmelisin")
      return
    }
    formData.set("categoryId", categoryId)
    startTransition(async () => {
      try {
        await createTopic(formData)
        titleDraft.clearDraft()
        contentDraft.clearDraft()
      } catch (e) {
        // redirect() throws internally; only surface real errors
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          setError(e.message)
        } else {
          // successful redirect: clear drafts
          titleDraft.clearDraft()
          contentDraft.clearDraft()
          throw e
        }
      }
    })
  }

  return (
    <form action={handleSubmit} className="glass flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Kategori</Label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Kategori seç" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={10}
          maxLength={200}
          value={titleDraft.value}
          onChange={(e) => titleDraft.setValue(e.target.value)}
          placeholder="Merak uyandıran bir başlık yaz..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">İçerik</Label>
        <RichMarkdownEditor
          id="content"
          name="content"
          required
          minRows={8}
          maxLength={10000}
          value={contentDraft.value}
          onChange={(val) => contentDraft.setValue(val)}
          placeholder="Düşüncelerini, sorularını veya kodlarını markdown ile detaylandır (sürükle-bırak görsel ve @etiket desteklenir)..."
        />
      </div>

      {draftRestored && (
        <p className="text-xs text-muted-foreground">
          Kaydedilmiş taslağın geri yüklendi.{" "}
          <button
            type="button"
            onClick={() => {
              titleDraft.clearDraft()
              contentDraft.clearDraft()
            }}
            className="underline hover:text-foreground"
          >
            Taslağı temizle
          </button>
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">
          Etiketler <span className="font-normal text-muted-foreground">(isteğe bağlı, virgülle ayır, en fazla 5)</span>
        </Label>
        <Input id="tags" name="tags" maxLength={200} placeholder="örn: zam, market, ekonomi" />
      </div>

      {!showPoll ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start bg-transparent"
          onClick={() => setShowPoll(true)}
        >
          <BarChart3 className="size-4" />
          Anket Ekle
        </Button>
      ) : (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
            <BarChart3 className="size-4 text-primary" /> Anket
          </legend>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pollQuestion">Anket Sorusu</Label>
            <Input id="pollQuestion" name="pollQuestion" maxLength={200} placeholder="örn: Sence hangisi daha iyi?" />
          </div>
          {Array.from({ length: pollOptionCount }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Label htmlFor={`pollOption-${i}`}>Seçenek {i + 1}</Label>
              <Input id={`pollOption-${i}`} name="pollOption" maxLength={100} placeholder={`Seçenek ${i + 1}`} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            {pollOptionCount < 6 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPollOptionCount((c) => c + 1)}
              >
                <Plus className="size-4" /> Seçenek Ekle
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setShowPoll(false)
                setPollOptionCount(2)
              }}
            >
              <X className="size-4" /> Anketi Kaldır
            </Button>
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-end">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Konuyu Yayınla
      </Button>
    </form>
  )
}
