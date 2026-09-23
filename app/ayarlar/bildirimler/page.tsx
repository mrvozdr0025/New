import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, ArrowLeft, Shield, Sliders } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { NotificationPreferencesForm } from "@/components/notification-preferences-form"
import { getNotificationPreferences } from "@/app/actions/notification-settings"
import { getCurrentProfile } from "@/lib/session"

export const metadata: Metadata = {
  title: "Bildirim Tercihleri | neonsform",
  description: "Hangi olaylar ve aktiviteler için bildirim almak istediğinizi özelleştirin.",
}

export default async function NotificationSettingsPage() {
  const profile = await getCurrentProfile()
  if (!profile) {
    redirect("/giris?redirect=/ayarlar/bildirimler")
  }

  const preferences = await getNotificationPreferences()

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/bildirimler"
              className="p-2 rounded-xl bg-muted/60 border border-border/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Bildirimlere dön"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bell className="size-5 text-primary" /> Bildirim Tercihleri
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hangi etkileşimlerde forum bildirimleri almak istediğinizi seçin
              </p>
            </div>
          </div>
        </div>

        <NotificationPreferencesForm initialPreferences={preferences} />
      </main>
    </div>
  )
}
