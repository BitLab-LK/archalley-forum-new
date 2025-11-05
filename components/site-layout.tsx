"use client"

import ArchAlleySidebar from "@/components/archalley-sidebar"
import { ReactNode } from "react"

interface SiteLayoutProps {
  children: ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-3/4">
          {children}
        </div>
        <div className="w-full lg:w-1/4">
          <ArchAlleySidebar />
        </div>
      </div>
    </div>
  )
}


