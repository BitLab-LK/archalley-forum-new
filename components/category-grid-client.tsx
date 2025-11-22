"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { getFeaturedImageAlt, getFeaturedImageUrl, cleanText, type WordPressPost } from "@/lib/wordpress-api"

interface CategoryGridClientProps {
  posts: WordPressPost[]
  currentPage: number
  totalPages: number
  basePath: string
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(" ") + "..."
}

export default function CategoryGridClient({ posts, currentPage, totalPages, basePath }: CategoryGridClientProps) {
  const pageItems = useMemo(() => posts, [posts])
  const prevHref = currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : undefined
  const nextHref = currentPage < totalPages ? `${basePath}?page=${currentPage + 1}` : undefined

  return (
    <div className="space-y-10">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pageItems.map((post) => {
          const imageUrl = getFeaturedImageUrl(post, 'large')
          const imageAlt = getFeaturedImageAlt(post)
          const title = cleanText(post.title.rendered)
          const excerpt = truncateWords(cleanText(post.excerpt.rendered), 20)
          return (
            <Card key={post.id} className="overflow-hidden rounded-none border-0">
              <Link href={`/${post.slug}`}>
                <div className="aspect-[7/5] relative">
                  <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              </Link>
              <div className="p-5 space-y-3">
                <Link href={`/${post.slug}`} className="block">
                  <h3 className="text-xl font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">{title}</h3>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{excerpt}</p>
                <Link
                  href={`/${post.slug}`}
                  className="inline-block uppercase tracking-wider text-[11px] mt-[15px] px-[18px] py-[6px] border border-[#e0e0e0] transition-all duration-300 whitespace-nowrap text-[#1f2026] no-underline mb-[5px] hover:border-[#FFA000] hover:text-[#FFA000]"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Read More
                </Link>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div>
            {prevHref ? (
              <Link href={prevHref} className="text-sm text-primary hover:underline">← Previous</Link>
            ) : <span className="text-sm text-muted-foreground">← Previous</span>}
          </div>
          <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
          <div>
            {nextHref ? (
              <Link href={nextHref} className="text-sm text-primary hover:underline">Next →</Link>
            ) : <span className="text-sm text-muted-foreground">Next →</span>}
          </div>
        </div>
      )}
    </div>
  )
}


