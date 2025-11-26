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
import { Search, Moon, Sun, LogOut, User, Shield, Home, Crown, ChevronDown, FolderOpen, Newspaper, ClipboardList } from "lucide-react"
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
      return pathname === "/" && !pathname.startsWith("/forum")
    }
    if (path === "/forum") {
      return pathname === "/forum" || pathname.startsWith("/forum")
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out">
        {/* Align inner header content to match page content max width */}
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-lg">
                <span className="text-white font-bold text-lg transition-transform duration-300 ease-in-out group-hover:scale-110">A</span>
              </div>
              <span className="font-bold text-xl transition-colors duration-300 ease-in-out group-hover:text-primary">Archalley</span>
            </Link>

            <nav className="flex items-center space-x-8">
              <Link 
                href="/" 
                className={`text-sm font-medium transition-all duration-300 ease-in-out py-2 relative overflow-hidden group ${
                  isActivePath("/") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="relative z-10">HOME</span>
                {isActivePath("/") && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
              </Link>

              {/* Projects Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary p-0 h-auto py-2 transition-all duration-300 ease-in-out group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      PROJECTS
                      <ChevronDown className="ml-2 h-3 w-3 transition-transform duration-300 ease-in-out group-hover:rotate-180" />
                    </span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/projects/commercial">Commercial & Offices</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/hospitality">Hospitality Architecture</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/industrial">Industrial & Infrastructure</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/interior">Interior Design</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/landscape">Landscape & Urbanism</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/public">Public Architecture</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/refurbishment">Refurbishment</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/religious">Religious Architecture</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/projects/residential">Residential Architecture</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Academic Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary p-0 h-auto py-2 transition-all duration-300 ease-in-out group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      ACADEMIC
                      <ChevronDown className="ml-2 h-3 w-3 transition-transform duration-300 ease-in-out group-hover:rotate-180" />
                    </span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/academic/research">Research</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/academic/student-projects">Student Projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/academic/submit">Submit</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link 
                href="/news" 
                className={`text-sm font-medium transition-all duration-300 ease-in-out py-2 relative overflow-hidden group ${
                  isActivePath("/news") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="relative z-10">NEWS</span>
                {isActivePath("/news") && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
              </Link>

              <Link 
                href="/articles" 
                className={`text-sm font-medium transition-all duration-300 ease-in-out py-2 relative overflow-hidden group ${
                  isActivePath("/articles") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="relative z-10">ARTICLES</span>
                {isActivePath("/articles") && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
              </Link>

              <Link 
                href="/events" 
                className="text-sm font-medium transition-all duration-300 ease-in-out px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: '#FFA000' }}
              >
                EVENTS
              </Link>

              <Link 
                href="/about" 
                className={`text-sm font-medium transition-all duration-300 ease-in-out py-2 relative overflow-hidden group ${
                  isActivePath("/about") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="relative z-10">ABOUT</span>
                {isActivePath("/about") && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
              </Link>

              <Link 
                href="/contact" 
                className={`text-sm font-medium transition-all duration-300 ease-in-out py-2 relative overflow-hidden group ${
                  isActivePath("/contact") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="relative z-10">CONTACT</span>
                {isActivePath("/contact") && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary/50 transition-all duration-300 ease-in-out group-hover:w-full"></div>
              </Link>
            </nav>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-8">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-all duration-300 ease-in-out group-focus-within:text-primary group-focus-within:scale-110" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-muted/50 focus:bg-background transition-all duration-300 ease-in-out focus:shadow-md focus:scale-105 hover:bg-muted/70 rounded-none"
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
                           user?.role === "MODERATOR" ? "Moderator" :
                           user?.role === "VIEWER" ? "Viewer" : "Member"}
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
                    <DropdownMenuItem asChild>
                      <Link href="/profile/registrations">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>My Registrations</span>
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
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/competitions/registrations">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Manage Registrations</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
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
            <span className="font-bold text-lg sm:text-xl">Archalley</span>
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
                    <DropdownMenuItem asChild>
                      <Link href="/profile/registrations">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>My Registrations</span>
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
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/competitions/registrations">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Manage Registrations</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 text-base rounded-none border-2 focus:border-primary transition-colors"
            />
          </form>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t safe-area-inset-bottom transition-all duration-300 ease-in-out">
        <div className="grid grid-cols-4 h-18">
          {/* Home */}
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-300 ease-in-out py-2 px-1 min-h-[44px] transform hover:scale-105 ${
              isActivePath("/") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Home className={`h-4 w-4 transition-all duration-300 ease-in-out ${isActivePath("/") ? "fill-current scale-110" : "hover:scale-110"}`} />
            <span className="text-[9px] transition-all duration-300 ease-in-out">Home</span>
          </Link>

          {/* Projects */}
          <Link 
            href="/projects" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-300 ease-in-out py-2 px-1 min-h-[44px] transform hover:scale-105 ${
              isActivePath("/projects") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <FolderOpen className={`h-4 w-4 transition-all duration-300 ease-in-out ${isActivePath("/projects") ? "fill-current scale-110" : "hover:scale-110"}`} />
            <span className="text-[9px] transition-all duration-300 ease-in-out">Projects</span>
          </Link>

          {/* News */}
          <Link 
            href="/news" 
            className={`flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-300 ease-in-out py-2 px-1 min-h-[44px] transform hover:scale-105 ${
              isActivePath("/news") 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Newspaper className={`h-4 w-4 transition-all duration-300 ease-in-out ${isActivePath("/news") ? "fill-current scale-110" : "hover:scale-110"}`} />
            <span className="text-[9px] transition-all duration-300 ease-in-out">News</span>
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
                <User className={`h-4 w-4 ${isActivePath("/profile") ? "fill-current" : ""}`} />
                {user?.isVerified && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full border border-background"></div>
                )}
              </div>
              <span className="text-[9px]">Profile</span>
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
              <User className={`h-4 w-4 ${isActivePath("/auth") ? "fill-current" : ""}`} />
              <span className="text-[9px]">Login</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
