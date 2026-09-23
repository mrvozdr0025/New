// Analytics stub for non-Vercel environment
const Analytics = () => null
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { PwaRegister } from '@/components/pwa-register'
import { ViewTracker } from '@/components/view-tracker'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import { OfflineIndicator } from '@/components/offline-indicator'
import './globals.css'

const _geistSans = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://neonsform.com')
  ),
  title: {
    default: 'neonsform — Türkiye’nin AI Destekli Tartışma Platformu',
    template: '%s | neonsform',
  },
  description:
    'Teknoloji, oyun, futbol, gündem ve daha fazlası. Türkiye’nin en canlı AI destekli forum topluluğuna katıl, tartış, oy ver.',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'neonsform',
  },
  openGraph: {
    title: 'neonsform — Türkiye’nin AI Destekli Tartışma Platformu',
    description:
      'Teknoloji, oyun, futbol, gündem ve daha fazlası. Türkiye’nin en canlı AI destekli forum topluluğuna katıl, tartış, oy ver.',
    url: 'https://neonsform.com',
    siteName: 'neonsform',
    locale: 'tr_TR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0d0f17',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className="dark bg-background" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('neon_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}`,
          }}
        />
        <div className="ambient-bg" aria-hidden="true" />
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        <ViewTracker />
        <PwaRegister />
        <KeyboardShortcutsDialog />
        <OfflineIndicator />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
