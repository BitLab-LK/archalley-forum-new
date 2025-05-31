"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Bell, Menu, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Archalley Forum</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary">
                Home
              </Link>
              <Link href="/categories" className="text-gray-700 dark:text-gray-300 hover:text-primary">
                Categories
              </Link>
              <Link href="/members" className="text-gray-700 dark:text-gray-300 hover:text-primary">
                Members
              </Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary">
                About
              </Link>
            </nav>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input placeholder="Search posts, users..." className="w-64" />
            </div>

            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/admin">Admin Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2">
                Home
              </Link>
              <Link href="/categories" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2">
                Categories
              </Link>
              <Link href="/members" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2">
                Members
              </Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2">
                About
              </Link>
            </nav>
            <div className="mt-4 flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input placeholder="Search posts, users..." />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
