"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, User, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Crown, Shield, LogOut } from "lucide-react"

export default function TopBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSignOut = async () => {
    try {
      // In production, use the logout page for more reliable logout
      if (process.env.NODE_ENV === 'production') {
        window.location.href = "/auth/logout"
        return
      }

      // For development, use the direct approach
      await fetch('/api/auth/manual-logout', {
        method: 'POST',
        credentials: 'include',
      })

      // Force complete logout
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: force complete logout
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = "/"
      }
    }
  }

  return (
    <div className="bg-gray-800 text-white py-2 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-row justify-between items-center">
          {/* Top Menu - Left side on mobile */}
          <div className="flex space-x-4 text-sm flex-1 md:flex-none justify-start">
            <Link 
              href="/about" 
              className={`transition-colors ${
                pathname === "/about" ? "text-[#FFA000]" : "text-white hover:text-[#FFA000]"
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`transition-colors ${
                pathname === "/contact" ? "text-[#FFA000]" : "text-white hover:text-[#FFA000]"
              }`}
            >
              Contact
            </Link>
            <Link 
              href="/terms-conditions" 
              className={`transition-colors ${
                pathname === "/terms-conditions" ? "text-[#FFA000]" : "text-white hover:text-[#FFA000]"
              }`}
            >
              T&C
            </Link>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFA000]"></div>
            ) : isAuthenticated ? (
              <div className="relative group">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:text-[#FFA000] hover:bg-gray-700 p-0 h-auto">
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        <span>{user?.name?.split(" ")[0] || "User"}</span>
                        <ChevronDown size={14} />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium leading-none">{user?.name}</p>
                          {user?.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        <Badge className={`text-xs w-fit flex items-center gap-1 ${
                          user?.role === "SUPER_ADMIN" ? "bg-red-500 text-white hover:bg-red-600" :
                          user?.role === "ADMIN" ? "bg-yellow-500 text-white hover:bg-yellow-600" :
                          user?.role === "MODERATOR" ? "bg-blue-500 text-white hover:bg-blue-600" :
                          "bg-gray-500 text-white"
                        }`}>
                          {user?.role === "SUPER_ADMIN" && <Crown className="h-3 w-3" />}
                          {user?.role === "SUPER_ADMIN" ? "Super Admin" :
                           user?.role === "ADMIN" ? "Admin" :
                           user?.role === "MODERATOR" ? "Moderator" :
                           user?.role === "VIEWER" ? "Viewer" : "Member"}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Account</span>
                      </Link>
                    </DropdownMenuItem>
                    {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link 
                href="/auth/register?tab=login" 
                className={`transition-colors ${
                  pathname?.includes("/auth") ? "text-[#FFA000]" : "text-white hover:text-[#FFA000]"
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Search Icon on Mobile - Right side */}
          <div className="md:hidden ml-4">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="text-white hover:text-[#FFA000] transition-colors p-2"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Search Box - Desktop always visible, Mobile only when icon clicked */}
          <div className={`w-full md:w-auto mb-2 md:mb-0 absolute md:relative top-full left-0 right-0 md:top-auto md:left-auto md:right-auto bg-gray-800 px-4 py-2 md:bg-transparent md:px-0 md:py-0 ${showMobileSearch ? 'block' : 'hidden md:block'}`}>
            <form onSubmit={(e) => {
              handleSearch(e)
              setShowMobileSearch(false)
            }} className="flex items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-700 text-white px-3 h-8 rounded-none focus:outline-none text-sm w-full md:w-64"
                autoFocus={showMobileSearch}
              />
              <button 
                type="submit" 
                className="bg-gray-700 text-white px-2 h-8 rounded-none hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
