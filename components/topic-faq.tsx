"use client"

import { useState } from "react"
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { type FaqItem } from "@/lib/seo"

interface TopicFaqProps {
  faqs: FaqItem[]
}

export function TopicFaq({ faqs }: TopicFaqProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0])

  if (!faqs || faqs.length === 0) return null

  const toggle = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <section
      aria-label="Sıkça Sorulan Sorular"
      className="mt-6 rounded-xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Sıkça Sorulan Sorular & Konu Özeti
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="size-2.5" />
              SEO FAQ
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Bu konu ve tartışmayla ilgili temel sorular ve yanıtlar
          </p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {faqs.map((faq, index) => {
          const isOpen = openIndices.includes(index)
          return (
            <div key={index} className="py-2.5 first:pt-1 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors py-1"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground ml-2" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
