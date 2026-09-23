"use client"

import { useRef, useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  KeyRound,
  Trash2,
  RotateCcw,
  Pause,
  Play,
  DatabaseZap,
} from "lucide-react"
import {
  addApiKey,
  toggleApiKey,
  deleteApiKey,
  resetApiKeyBench,
  updateAISettings,
  setAIPaused,
  clearAICache,
} from "@/app/actions/admin"
import { timeAgo } from "@/lib/format"

type Settings = {
  dailyActionLimit: number
  isPaused: boolean
  pausedReason: string | null
  cacheTtlMinutes: number
  dailyUsed: number
  usageDate: string
}

type ApiKeyRow = {
  id: number
  name: string
  keyPreview: string
  priority: number
  isActive: boolean
  exhaustedUntil: Date | null
  errorCount: number
  lastUsedAt: Date | null
  createdAt: Date
}

type CacheStats = { entries: number; totalHits: number }

const PAUSE_REASONS: Record<string, string> = {
  manuel: "Admin tarafından manuel duraklatıldı",
  "auto:limit": "Günlük aksiyon limiti aşıldığı için otomatik duraklatıldı",
  "auto:keys": "Tüm API anahtarlarının kotası dolduğu için otomatik duraklatıldı",
}

export function ApiKeyManager({
  settings,
  apiKeys,
  cacheStats,
}: {
  settings: Settings
  apiKeys: ApiKeyRow[]
  cacheStats: CacheStats
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const addFormRef = useRef<HTMLFormElement>(null)

  function run(fn: () => Promise<unknown>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu")
      }
    })
  }

  const usagePct = Math.min(
    100,
    Math.round((settings.dailyUsed / Math.max(1, settings.dailyActionLimit)) * 100),
  )

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------ Status / pause -- */}
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">AI Durumu</h2>
            <p className="text-xs text-muted-foreground">
              {settings.isPaused
                ? (PAUSE_REASONS[settings.pausedReason ?? ""] ?? "Duraklatıldı")
                : "AI aktif — çağrılar normal şekilde işleniyor."}
            </p>
          </div>
          <Button
            size="sm"
            variant={settings.isPaused ? "default" : "outline"}
            disabled={pending}
            onClick={() => run(() => setAIPaused(!settings.isPaused))}
          >
            {settings.isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {settings.isPaused ? "Devam Ettir" : "Duraklat"}
          </Button>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              Bugünkü kullanım: {settings.dailyUsed} / {settings.dailyActionLimit}
            </span>
            <span>{usagePct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={usagePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Günlük AI kullanımı"
            className="h-2 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className={`h-full rounded-full transition-all ${
                usagePct >= 90 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------ Settings -- */}
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Kota Ayarları</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            run(() => updateAISettings(fd))
          }}
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[auto_auto_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dailyActionLimit">Günlük AI Aksiyon Limiti</Label>
            <Input
              id="dailyActionLimit"
              name="dailyActionLimit"
              type="number"
              min={1}
              max={10000}
              defaultValue={settings.dailyActionLimit}
              className="sm:w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cacheTtlMinutes">Cache Süresi (dakika)</Label>
            <Input
              id="cacheTtlMinutes"
              name="cacheTtlMinutes"
              type="number"
              min={0}
              max={43200}
              defaultValue={settings.cacheTtlMinutes}
              className="sm:w-40"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Kaydet
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <DatabaseZap className="size-4" />
          <span>
            Cache: {cacheStats.entries} kayıt, toplam {cacheStats.totalHits} isabet
            (her isabet 1 API çağrısı tasarrufu)
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(clearAICache)}
          >
            Cache&apos;i Temizle
          </Button>
        </div>
      </Card>

      {/* ------------------------------------------------------ Add key -- */}
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Yeni API Anahtarı Ekle</h2>
        <p className="text-xs text-muted-foreground">
          Birden fazla Gemini API anahtarı ekleyebilirsin. Anahtarlar öncelik sırasına göre
          denenir; kotası dolan anahtar 6 saat dinlendirilir ve sıradaki anahtar devreye girer.
        </p>
        <form
          ref={addFormRef}
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            run(async () => {
              await addApiKey(fd)
              addFormRef.current?.reset()
            })
          }}
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_2fr_auto_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="key-name">İsim</Label>
            <Input id="key-name" name="name" placeholder="Ana hesap" required />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="key-value">API Anahtarı</Label>
            <Input
              id="key-value"
              name="apiKey"
              type="password"
              placeholder="AIza..."
              required
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="key-priority">Öncelik</Label>
            <Input
              id="key-priority"
              name="priority"
              type="number"
              min={0}
              defaultValue={apiKeys.length}
              className="sm:w-24"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Ekle
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </Card>

      {/* ----------------------------------------------------- Key list -- */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">API Anahtarları ({apiKeys.length})</h2>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz anahtar eklenmedi. Ortam değişkenindeki GOOGLE_GENERATIVE_AI_API_KEY yedek
            olarak kullanılıyor.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {apiKeys.map((k) => {
              const benched =
                k.exhaustedUntil != null && new Date(k.exhaustedUntil) > new Date()
              return (
                <li key={k.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{k.name}</p>
                      <Badge variant="outline" className="font-mono text-xs">
                        {k.keyPreview}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        öncelik {k.priority}
                      </Badge>
                      {benched ? (
                        <Badge variant="destructive" className="text-xs">
                          kota doldu — {timeAgo(k.exhaustedUntil!)} dinlenmede
                        </Badge>
                      ) : k.isActive ? (
                        <Badge className="bg-primary/15 text-primary text-xs">hazır</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">pasif</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {k.errorCount} kota hatası
                      {k.lastUsedAt ? ` · son kullanım ${timeAgo(k.lastUsedAt)}` : " · hiç kullanılmadı"}
                    </p>
                  </div>
                  {benched && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(() => resetApiKeyBench(k.id))}
                      aria-label={`${k.name} dinlenmeyi sıfırla`}
                    >
                      <RotateCcw className="size-4" />
                      Sıfırla
                    </Button>
                  )}
                  <Switch
                    checked={k.isActive}
                    onCheckedChange={(v) => run(() => toggleApiKey(k.id, v))}
                    aria-label={`${k.name} aktif/pasif`}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`"${k.name}" anahtarı silinsin mi?`)) {
                        run(() => deleteApiKey(k.id))
                      }
                    }}
                    aria-label={`${k.name} sil`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
