"use client"

import ArchAlleySidebar from "@/components/archalley-sidebar"
import { ReactNode } from "react"

interface SiteLayoutProps {
  children: ReactNode
  showSidebar?: boolean // Optional prop to control sidebar visibility
}

export default function SiteLayout({ children, showSidebar = true }: SiteLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-3/4">
          {children}
        </div>
        {/* Keep sidebar space but conditionally render sidebar content */}
        <div className="w-full lg:w-1/4">
          {showSidebar ? <ArchAlleySidebar /> : <div className="hidden lg:block" aria-hidden="true" />}
        </div>
      </div>
    </div>
  )
}


