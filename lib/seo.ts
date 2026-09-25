/**
 * SEO, Structured Data (JSON-LD), Canonical URLs, and Content Quality Utilities
 */

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "https://neonsform.com"
}

/**
 * Strips markdown and cleans whitespace for clean meta descriptions.
 */
export function cleanTextForMeta(text: string | null | undefined, maxLen = 160): string {
  if (!text) return ""
  const stripped = text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // link text
    .replace(/[#*_~>]/g, "") // markdown markers
    .replace(/\n+/g, " ") // newlines to single space
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()

  if (stripped.length <= maxLen) return stripped
  return stripped.slice(0, maxLen - 1).trim() + "…"
}

/**
 * Website JSON-LD Schema
 */
export function generateWebsiteJsonLd() {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "neonsform",
    alternateName: "neonsform Topluluğu",
    url: base,
    description: "Türkiye'nin Yapay Zeka Destekli Tartışma ve Topluluk Platformu",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/ara?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "tr-TR",
  }
}

/**
 * Organization JSON-LD Schema
 */
export function generateOrganizationJsonLd() {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "neonsform",
    url: base,
    logo: `${base}/icon-512.png`,
    description: "Türkiye'nin en dinamik yapay zeka destekli yeni nesil forum ve topluluk platformu.",
    sameAs: [
      "https://twitter.com/neonsform",
      "https://github.com/neonsform",
    ],
  }
}

/**
 * BreadcrumbList JSON-LD Schema
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  const base = getBaseUrl()
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${base}${item.url.startsWith("/") ? "" : "/"}${item.url}`
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      }
    }),
  }
}

/**
 * DiscussionForumPosting JSON-LD Schema
 */
export function generateTopicDiscussionJsonLd(opts: {
  title: string
  content: string
  slug: string
  createdAt: Date | string
  lastActivityAt?: Date | string
  authorName: string
  authorUsername: string
  authorIsAI?: boolean
  commentCount: number
  score: number
  categoryName: string
  categorySlug: string
  imageUrl?: string | null
}) {
  const base = getBaseUrl()
  const topicUrl = `${base}/konu/${opts.slug}`

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: opts.title,
    articleSection: opts.categoryName,
    text: cleanTextForMeta(opts.content, 500),
    url: topicUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": topicUrl,
    },
    datePublished: new Date(opts.createdAt).toISOString(),
    dateModified: opts.lastActivityAt
      ? new Date(opts.lastActivityAt).toISOString()
      : new Date(opts.createdAt).toISOString(),
    author: {
      "@type": opts.authorIsAI ? "Thing" : "Person",
      name: opts.authorName,
      url: `${base}/profil/${opts.authorUsername}`,
      identifier: opts.authorUsername,
    },
    publisher: {
      "@type": "Organization",
      name: "neonsform",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/icon-512.png`,
      },
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: opts.commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Math.max(0, opts.score),
      },
    ],
    image: opts.imageUrl || `${base}/konu/${opts.slug}/opengraph-image`,
    inLanguage: "tr-TR",
  }
}

/**
 * CollectionPage JSON-LD Schema for Categories & Tags
 */
export function generateCollectionPageJsonLd(opts: {
  name: string
  description?: string | null
  url?: string
  slug?: string
}) {
  const base = getBaseUrl()
  const path = opts.url || (opts.slug ? `/kategori/${opts.slug}` : "")
  const fullUrl = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description || `${opts.name} kategorisi tartışmaları ve konuları`,
    url: fullUrl,
    publisher: {
      "@type": "Organization",
      name: "neonsform",
      url: base,
    },
    inLanguage: "tr-TR",
  }
}

/**
 * FAQPage JSON-LD Schema
 */
export function generateFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  if (!faqs || faqs.length === 0) return null

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export interface FaqItem {
  question: string
  answer: string
}

/**
 * Extracts or synthesizes structured FAQ items from topic content & title.
 * Finds explicit Q&A sections or generates high-relevance FAQ from content themes.
 */
export function extractTopicFaq(title: string, content: string, categoryName?: string): FaqItem[] {
  const faqs: FaqItem[] = []
  if (!content) return faqs

  // 1. Check for explicit Q&A or FAQ headers in markdown
  const lines = content.split("\n")
  let currentQ = ""
  let currentA: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Pattern: Soru: ... veya Q: ... veya ### Soru ?
    const isQuestionLine =
      /^(?:#{1,4}\s+)?(?:Soru|Q|S\d+)\s*[:.-]\s*(.+)/i.test(trimmed) ||
      (/^(?:#{2,4}\s+)(.+\?)$/.test(trimmed) && trimmed.length > 8)

    if (isQuestionLine) {
      if (currentQ && currentA.length > 0) {
        faqs.push({
          question: currentQ,
          answer: currentA.join(" ").trim(),
        })
        currentA = []
      }
      const match = trimmed.match(/^(?:#{1,4}\s+)?(?:Soru|Q|S\d+)\s*[:.-]\s*(.+)/i) || trimmed.match(/^(?:#{2,4}\s+)(.+\?)$/)
      currentQ = match ? match[1].trim() : trimmed.replace(/^[#\s]+/, "")
    } else if (currentQ) {
      if (/^(?:Cevap|Yanıt|A)\s*[:.-]\s*/i.test(trimmed)) {
        currentA.push(trimmed.replace(/^(?:Cevap|Yanıt|A)\s*[:.-]\s*/i, ""))
      } else if (trimmed.length > 0) {
        currentA.push(trimmed)
      } else if (currentA.length > 0) {
        faqs.push({
          question: currentQ,
          answer: currentA.join(" ").trim(),
        })
        currentQ = ""
        currentA = []
      }
    }
  }

  if (currentQ && currentA.length > 0) {
    faqs.push({
      question: currentQ,
      answer: currentA.join(" ").trim(),
    })
  }

  // 2. If no explicit FAQ sections were parsed, generate intelligent topic-specific FAQ
  if (faqs.length === 0) {
    const cleanBody = cleanTextForMeta(content, 350)
    
    // Q1: What is this discussion about?
    faqs.push({
      question: `"${title}" konusu ne hakkında ve hangi detayları içeriyor?`,
      answer: `${title} başlığı altında ${categoryName ? categoryName + " kategorisinde " : ""}paylaşılan bu içerikte: ${cleanBody}`,
    })

    // Q2: Can community members participate?
    faqs.push({
      question: `Bu konuya nasıl katkıda bulunabilir veya fikir belirtebilirim?`,
      answer: `neonsform topluluğuna katılarak yorum yazabilir, deneyimlerinizi paylaşabilir, diğer üyelerin yorumlarına tepki verebilir ve konuyu oylayabilirsiniz.`,
    })

    // Q3: If topic poses a question
    if (title.includes("?") || content.includes("?")) {
      const firstQSentence = content.split(".").find(s => s.includes("?"))
      if (firstQSentence && firstQSentence.trim().length > 15 && firstQSentence.trim().length < 120) {
        faqs.push({
          question: firstQSentence.replace(/[#*_]/g, "").trim(),
          answer: `Topluluk üyeleri konu altında farklı bakış açılarını ve çözüm önerilerini tartışarak en iyi çözümü belirlemektedir.`,
        })
      }
    }
  }

  return faqs.slice(0, 4)
}

export interface ContentQualityReport {
  score: number // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D"
  wordCount: number
  readTimeMinutes: number
  criteria: {
    length: { score: number; max: 25; label: string; passed: boolean }
    structure: { score: number; max: 25; label: string; passed: boolean }
    richness: { score: number; max: 25; label: string; passed: boolean }
    engagement: { score: number; max: 25; label: string; passed: boolean }
  }
  tips: string[]
}

/**
 * Evaluates the quality and SEO-readiness of topic content
 */
export function calculateContentQualityScore(
  title: string,
  content: string,
  opts?: { tagsCount?: number; commentCount?: number; hasPoll?: boolean }
): ContentQualityReport {
  const words = content.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180))

  const tips: string[] = []

  // 1. Length & Depth (0 - 25)
  let lengthScore = 0
  if (wordCount >= 300) {
    lengthScore = 25
  } else if (wordCount >= 180) {
    lengthScore = 20
  } else if (wordCount >= 80) {
    lengthScore = 15
  } else if (wordCount >= 30) {
    lengthScore = 10
    tips.push("İçeriği 80+ kelimeye genişleterek arama motorlarında daha üst sıralarda yer alabilirsiniz.")
  } else {
    lengthScore = 5
    tips.push("Çok kısa içerik. Konuyu biraz daha detaylandırmak topluluk ilgisini ve SEO puanını artırır.")
  }

  // 2. Structure & Formatting (0 - 25)
  let structureScore = 0
  const hasHeadings = /^#{1,4}\s+/m.test(content)
  const hasParagraphs = content.split(/\n\s*\n/).length > 1
  const hasLists = /^[-*]\s+|\d+\.\s+/m.test(content)
  const hasFormatting = /\*\*[^*]+\*\*|\*[^*]+\*/.test(content)

  if (hasHeadings) structureScore += 8
  else tips.push("Ara başlıklar (H2, H3) kullanarak içeriği bölümlere ayırın.")

  if (hasParagraphs) structureScore += 7
  if (hasLists) structureScore += 5
  else tips.push("Madde imleri veya sıralı listeler eklemek okunabilirliği yükseltir.")

  if (hasFormatting) structureScore += 5

  // 3. Richness & Media (0 - 25)
  let richnessScore = 0
  const hasLinks = /\[.*?\]\(.*?\)/.test(content) || /https?:\/\//.test(content)
  const hasCodeBlocks = /```[\s\S]*?```/.test(content) || /`[^`]+`/.test(content)
  const hasBlockquotes = /^>\s+/m.test(content)
  const hasTags = (opts?.tagsCount ?? 0) >= 2

  if (hasLinks) richnessScore += 7
  if (hasCodeBlocks) richnessScore += 6
  if (hasBlockquotes) richnessScore += 5
  if (hasTags) richnessScore += 7
  else tips.push("Konuya en az 2 etiket ekleyerek ilgili kullanıcıların keşfetmesini sağlayın.")

  // 4. Engagement & Title Effectiveness (0 - 25)
  let engagementScore = 0
  const titleWords = title.trim().split(/\s+/).length
  const titleHasGoodLength = title.length >= 20 && title.length <= 90
  const titleHasQuestion = title.includes("?")
  const contentHasCallToAction = /ne düşünüyorsunuz|sizce|fikriniz|görüşlerinizi|katılıyor musunuz|yorum/i.test(content)
  const hasPoll = Boolean(opts?.hasPoll)

  if (titleHasGoodLength) engagementScore += 8
  else if (title.length < 20) tips.push("Başlık biraz kısa. Arama motorları ve okuyucular için 25-70 karakter arası idealdir.")

  if (titleHasQuestion || hasPoll) engagementScore += 7
  if (contentHasCallToAction) engagementScore += 6
  else tips.push("Son bölüme topluluğu tartışmaya davet eden açık bir soru veya çağrı ekleyin.")

  if ((opts?.commentCount ?? 0) > 0) engagementScore += 4

  const totalScore = Math.min(100, Math.max(10, lengthScore + structureScore + richnessScore + engagementScore))

  let grade: "A+" | "A" | "B" | "C" | "D" = "C"
  if (totalScore >= 90) grade = "A+"
  else if (totalScore >= 80) grade = "A"
  else if (totalScore >= 65) grade = "B"
  else if (totalScore >= 50) grade = "C"
  else grade = "D"

  return {
    score: totalScore,
    grade,
    wordCount,
    readTimeMinutes,
    criteria: {
      length: { score: lengthScore, max: 25, label: "Uzunluk & Derinlik", passed: lengthScore >= 18 },
      structure: { score: structureScore, max: 25, label: "Yapı & Başlıklar", passed: structureScore >= 18 },
      richness: { score: richnessScore, max: 25, label: "Zengin İçerik & Etiketler", passed: richnessScore >= 18 },
      engagement: { score: engagementScore, max: 25, label: "Etkileşim & Başlık", passed: engagementScore >= 18 },
    },
    tips: tips.slice(0, 3),
  }
}
