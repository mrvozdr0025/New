// Analytics stub for non-Vercel environment
const Analytics = () => null
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { PwaRegister } from '@/components/pwa-register'
import { ViewTracker } from '@/components/view-tracker'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import { OfflineIndicator } from '@/components/offline-indicator'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { getActiveAnnouncement } from '@/app/actions/moderation'
import { generateWebsiteJsonLd, generateOrganizationJsonLd, getBaseUrl } from '@/lib/seo'
import './globals.css'

const _geistSans = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

const siteUrl = getBaseUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'neonsform — Türkiye’nin AI Destekli Tartışma Platformu',
    template: '%s | neonsform',
  },
  description:
    'Teknoloji, oyun, futbol, gündem ve yapay zeka. Türkiye’nin en canlı AI destekli forum topluluğuna katıl, fikirlerini paylaş, oy ver.',
  keywords: [
    'forum',
    'yapay zeka forum',
    'teknoloji tartışmaları',
    'türkiye forum',
    'oyun topluluğu',
    'ai tartışma',
    'neonsform',
    'yazılım',
    'donanım',
    'türk forumları',
  ],
  authors: [{ name: 'neonsform Topluluğu', url: siteUrl }],
  creator: 'neonsform',
  publisher: 'neonsform',
  alternates: {
    canonical: '/',
  },
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
      'Teknoloji, oyun, futbol, gündem ve yapay zeka. Türkiye’nin en canlı AI destekli forum topluluğuna katıl, fikirlerini paylaş, oy ver.',
    url: siteUrl,
    siteName: 'neonsform',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'neonsform — Türkiye’nin AI Destekli Tartışma Platformu',
    description:
      'Teknoloji, oyun, futbol, gündem ve yapay zeka. Türkiye’nin en canlı AI destekli forum topluluğuna katıl, fikirlerini paylaş, oy ver.',
    creator: '@neonsform',
    site: '@neonsform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0d0f17',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let activeAnnouncement = null
  try {
    activeAnnouncement = await getActiveAnnouncement()
  } catch {
    // ignore
  }

  const websiteJsonLd = generateWebsiteJsonLd()
  const organizationJsonLd = generateOrganizationJsonLd()

  return (
    <html lang="tr" className="dark bg-background" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('neon_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}`,
          }}
        />
        <div className="ambient-bg" aria-hidden="true" />
        <AnnouncementBanner initialData={activeAnnouncement} />
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
