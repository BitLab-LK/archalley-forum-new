"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Search, Moon, Sun, LogOut, User, Shield, Home, Users, Crown } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import NotificationDropdown from "@/components/notification-dropdown"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
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

      await signOut({ 
        callbackUrl: "/",
        redirect: false
      })

      window.location.href = "/"
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



  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Align inner header content to match page content max width */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-[80rem] mx-auto h-16 flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl">Archalley Forum</span>
            </Link>

            <nav className="flex items-center space-x-6">
              <Link 
                href="/" 
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/") 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Home
              </Link>
              {/* Categories - Temporarily Removed */}
              {/* <Link 
                href="/categories" 
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/categories") 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Categories
              </Link> */}
              <Link 
                href="/members" 
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/members") 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Members
              </Link>
            </nav>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search posts, members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </form>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle - Temporarily Removed */}
            {/* <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button> */}

            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10" key={user?.image || 'default'}>
                        <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
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
                           user?.role === "MODERATOR" ? "Moderator" : "Member"}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* Settings - Temporarily Removed */}
                    {/* <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem> */}
                    {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/register?tab=login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register?tab=register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Mobile Header - Top bar with logo and search */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">A</span>
            </div>
            <span className="font-bold text-lg sm:text-xl">Archalley Forum</span>
          </Link>

          {/* Right Side - Auth buttons or user menu */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="text-sm font-medium">{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* Settings - Temporarily Removed */}
                    {/* <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                      <div className="mr-2 h-4 w-4 relative">
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute top-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/register?tab=login">Sign In</Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search posts, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 text-base rounded-xl border-2 focus:border-primary transition-colors"
            />
          </form>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t safe-area-inset-bottom">
        <div className="grid grid-cols-3 h-18">
          {/* Home */}
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-2 px-1 min-h-[44px] ${
              isActivePath("/") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Home className={`h-6 w-6 ${isActivePath("/") ? "fill-current" : ""}`} />
            <span className="text-[11px]">Home</span>
          </Link>

          {/* Categories - Temporarily Removed */}
          {/* <Link 
            href="/categories" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-2 px-1 min-h-[44px] ${
              isActivePath("/categories") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <FolderOpen className={`h-6 w-6 ${isActivePath("/categories") ? "fill-current" : ""}`} />
            <span className="text-[11px]">Categories</span>
          </Link> */}

          {/* Members */}
          <Link 
            href="/members" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-2 px-1 min-h-[44px] ${
              isActivePath("/members") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Users className={`h-6 w-6 ${isActivePath("/members") ? "fill-current" : ""}`} />
            <span className="text-[11px]">Members</span>
          </Link>

          {/* Profile/Login */}
          {isAuthenticated ? (
            <Link 
              href={`/profile/${user?.id}`}
              className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-2 px-1 min-h-[44px] ${
                isActivePath("/profile") 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <div className="relative">
                <User className={`h-6 w-6 ${isActivePath("/profile") ? "fill-current" : ""}`} />
                {user?.isVerified && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-background"></div>
                )}
              </div>
              <span className="text-[11px]">Profile</span>
            </Link>
          ) : (
            <Link 
              href="/auth/register?tab=login"
              className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-2 px-1 min-h-[44px] ${
                isActivePath("/auth") 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <User className={`h-6 w-6 ${isActivePath("/auth") ? "fill-current" : ""}`} />
              <span className="text-[11px]">Login</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
