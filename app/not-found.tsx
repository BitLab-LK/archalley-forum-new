import type { Metadata } from "next"
import Link from "next/link"
import { Home, Search, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import BackButton from "./not-found-back-button"

export const metadata: Metadata = {
  title: "404 - Page Not Found | Archalley",
  description: "The page you're looking for doesn't exist. Return to Archalley to explore architecture and design content.",
}

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="container mx-auto max-w-2xl text-center">
        {/* 404 Number with Icon */}
        <div className="mb-8 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="text-9xl md:text-[12rem] font-bold text-gray-200 dark:text-gray-800 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-24 h-24 md:w-32 md:h-32 text-[#FFA000] opacity-20" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for seems to have been moved, deleted, or doesn't exist. 
            Let's get you back on track to exploring amazing architecture and design.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            asChild 
            className="bg-[#FFA000] hover:bg-[#e08f00] text-white px-8 py-6 text-base font-medium rounded-md transition-colors"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span>Go to Homepage</span>
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline"
            className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-8 py-6 text-base font-medium rounded-md transition-colors"
          >
            <Link href="/search" className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Search Content</span>
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Popular destinations:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/projects" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              Projects
            </Link>
            <Link 
              href="/articles" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              Articles
            </Link>
            <Link 
              href="/news" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              News
            </Link>
            <Link 
              href="/events" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              Events
            </Link>
            <Link 
              href="/categories" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              Categories
            </Link>
            <Link 
              href="/about" 
              className="text-[#FFA000] hover:text-[#e08f00] hover:underline transition-colors"
            >
              About
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>
      </div>
    </div>
  )
}

