"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  currentTitle: string
}

export default function WordPressBreadcrumb({ items, currentTitle }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-primary transition-colors">
        <Button variant="ghost" size="sm" className="h-auto p-1">
          <Home className="h-4 w-4" />
        </Button>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          <Link 
            href={item.href} 
            className="hover:text-primary transition-colors"
          >
            {item.label}
          </Link>
        </div>
      ))}
      <div className="flex items-center space-x-2">
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium line-clamp-1">{currentTitle}</span>
      </div>
    </nav>
  )
}
