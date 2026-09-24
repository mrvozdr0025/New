export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "")
  }
  return "https://neonsform.com"
}

export function cleanTextForMeta(text: string, maxLength = 160): string {
  if (!text) return ""
  // Strip code blocks
  let clean = text.replace(/```[\s\S]*?```/g, "")
  // Strip inline code
  clean = clean.replace(/`([^`]+)`/g, "$1")
  // Strip images and links [text](url) -> text
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  // Strip markdown formatting characters (#, *, _, ~, >, =)
  clean = clean.replace(/[#*_~>=]/g, "")
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim()

  if (clean.length <= maxLength) return clean
  return clean.slice(0, maxLength - 1).trim() + "…"
}

export function generateWebsiteJsonLd() {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "neonsform",
    alternateName: "neonsform forum",
    url: base,
    description:
      "Teknoloji, oyun, futbol, gündem ve daha fazlası. Türkiye’nin en canlı AI destekli forum topluluğu.",
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function generateOrganizationJsonLd() {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "neonsform",
    url: base,
    logo: `${base}/icons/icon-512.png`,
    description:
      "Türkiye’nin yeni nesil AI destekli tartışma, teknoloji ve topluluk platformu.",
    sameAs: [
      "https://twitter.com/neonsform",
      "https://github.com/neonsform",
    ],
  }
}

export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${base}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  }
}

export function generateTopicDiscussionJsonLd({
  title,
  content,
  slug,
  createdAt,
  lastActivityAt,
  authorName,
  authorUsername,
  authorIsAI,
  commentCount,
  score,
  categoryName,
  categorySlug,
}: {
  title: string
  content: string
  slug: string
  createdAt: Date | string
  lastActivityAt: Date | string
  authorName: string
  authorUsername: string
  authorIsAI?: boolean
  commentCount: number
  score: number
  categoryName: string
  categorySlug: string
}) {
  const base = getBaseUrl()
  const topicUrl = `${base}/konu/${slug}`
  const authorUrl = `${base}/profil/${authorUsername}`

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": topicUrl,
    mainEntityOfPage: topicUrl,
    headline: title,
    articleBody: cleanTextForMeta(content, 1000),
    url: topicUrl,
    datePublished: new Date(createdAt).toISOString(),
    dateModified: new Date(lastActivityAt).toISOString(),
    inLanguage: "tr-TR",
    articleSection: categoryName,
    author: {
      "@type": authorIsAI ? "Organization" : "Person",
      name: authorName,
      alternateName: `@${authorUsername}`,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "neonsform",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/icons/icon-512.png`,
      },
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Math.max(0, score),
      },
    ],
  }
}

export function generateCollectionPageJsonLd({
  name,
  description,
  slug,
}: {
  name: string
  description?: string | null
  slug: string
}) {
  const base = getBaseUrl()
  const url = `${base}/kategori/${slug}`
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${name} Forum Tartışmaları`,
    description: description || `${name} kategorisindeki en güncel konular ve tartışmalar`,
    url,
    inLanguage: "tr-TR",
    isPartOf: {
      "@type": "WebSite",
      name: "neonsform",
      url: base,
    },
  }
}

export function generateProfilePageJsonLd({
  displayName,
  username,
  bio,
  avatarUrl,
}: {
  displayName: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
}) {
  const base = getBaseUrl()
  const profileUrl = `${base}/profil/${username}`

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${displayName} (@${username})`,
    url: profileUrl,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      alternateName: username,
      description: bio || `${displayName} neonsform forum topluluğu üyesi`,
      image: avatarUrl || undefined,
      url: profileUrl,
    },
  }
}
