"use client"

import { memo, useMemo } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import useSWR from "swr"
import { ExternalLink, AtSign } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Preview = {
  url: string
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

function LinkPreviewCard({ href }: { href: string }) {
  const { data } = useSWR<Preview>(`/api/link-preview?url=${encodeURIComponent(href)}`, fetcher, {
    revalidateOnFocus: false,
  })
  if (!data?.title) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="not-prose mt-1.5 flex max-w-md gap-3 overflow-hidden rounded-lg border border-border bg-card/50 p-2.5 transition-colors hover:border-primary/40"
    >
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.imageUrl || "/placeholder.svg"}
          alt=""
          className="size-14 shrink-0 rounded-md object-cover"
          loading="lazy"
        />
      )}
      <span className="min-w-0">
        <span className="line-clamp-1 text-xs font-medium text-foreground">{data.title}</span>
        {data.description && (
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {data.description}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <ExternalLink className="size-2.5" />
          {data.siteName ?? new URL(href).hostname}
        </span>
      </span>
    </a>
  )
}

function formatMentions(text: string): string {
  if (!text) return ""
  // Replace bare @username (avoiding already formatted links or emails)
  return text.replace(/(^|[\s(])@([a-zA-Z0-9_]{2,24})(?![\w@.])/g, "$1[@$2](/profil/$2)")
}

// Renders user-generated markdown safely (react-markdown escapes raw HTML by
// default). Supports bold/italic/code, quotes, lists, images, link previews, and @mentions.
export const RichContent = memo(function RichContent({
  content,
  withPreviews = true,
}: {
  content: string
  withPreviews?: boolean
}) {
  const processedContent = useMemo(() => formatMentions(content), [content])

  return (
    <div className="rich-content text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (!href) return <>{children}</>

            // Render @mention links with distinctive styling
            if (href.startsWith("/profil/") && typeof children === "string" && children.startsWith("@")) {
              return (
                <Link
                  href={href}
                  className="inline-flex items-center gap-0.5 rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/25 hover:underline"
                >
                  <AtSign className="size-3 shrink-0" />
                  <span>{children.slice(1)}</span>
                </Link>
              )
            }

            const isBare = typeof children === "string" && children === href
            return (
              <>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="break-all text-primary underline underline-offset-2 hover:opacity-80"
                >
                  {children}
                </a>
                {withPreviews && isBare && <LinkPreviewCard href={href} />}
              </>
            )
          },
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") return null
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src || "/placeholder.svg"}
                alt={alt ?? "Yorum görseli"}
                loading="lazy"
                className="my-2 max-h-96 max-w-full rounded-lg border border-border object-contain"
              />
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-primary/50 bg-muted/40 py-1 pl-3 pr-2 text-muted-foreground [&_p]:my-0.5">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-")
            return isBlock ? (
              <code className="block overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">{children}</code>
            ) : (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">{children}</code>
            )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
})
