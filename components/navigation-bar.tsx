"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
  parent: number
}

interface NavigationBarProps {
  categories?: Category[]
}

export default function NavigationBar({ categories: _categories = [] }: NavigationBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const pathname = usePathname()

  // Organize categories into a menu structure
  const menuItems = [
    {
      title: "Home",
      path: "/",
      submenu: [],
    },
    {
      title: "Projects",
      path: "/projects",
      submenu: [
        { title: "Commercial & Offices", path: "/projects/commercial" },
        { title: "Hospitality Architecture", path: "/projects/hospitality" },
        { title: "Industrial & Infrastructure", path: "/projects/industrial" },
        { title: "Interior Design", path: "/projects/interior" },
        { title: "Landscape & Urbanism", path: "/projects/landscape" },
        { title: "Public Architecture", path: "/projects/public" },
        { title: "Refurbishment", path: "/projects/refurbishment" },
        { title: "Religious Architecture", path: "/projects/religious" },
        { title: "Residential Architecture", path: "/projects/residential" },
      ],
    },
    {
      title: "Academic",
      path: "/academic",
      submenu: [
        { title: "Research", path: "/academic/research" },
        { title: "Student Projects", path: "/academic/student-projects" },
        { title: "Submit Projects", path: "/academic/submit" },
      ],
    },
    {
      title: "News",
      path: "/news",
      submenu: [],
    },
    {
      title: "Articles",
      path: "/articles",
      submenu: [],
    },
    {
      title: "Events",
      path: "/events",
      submenu: [],
    },
    {
      title: "Competition",
      path: "/events/archalley-competition-2025",
      submenu: [],
    },
  ]

  const toggleSubmenu = (title: string) => {
    if (activeSubmenu === title) {
      setActiveSubmenu(null)
    } else {
      setActiveSubmenu(title)
    }
  }

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
    <nav className="bg-black text-white py-[30px]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/archalley-logo-whte-cropped.svg"
              alt="Archalley Logo"
              width={85}
              height={30}
              className="h-[90px] w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-8">
            {menuItems.map((item) => (
              <div key={item.title} className="relative group">
                <Link 
                  href={item.path} 
                  className={`py-3 flex items-center relative transition-all duration-300 font-bold uppercase ${
                    item.title === "Competition" 
                      ? "px-4 text-white"
                      : item.title === "Events"
                      ? "text-white border-t-[3px] border-transparent hover:border-[#FFA000]"
                      : `text-white border-t-[3px] ${
                          isActivePath(item.path)
                            ? "border-[#FFA000]"
                            : "border-transparent hover:border-[#FFA000]"
                        }`
                  }`}
                  style={item.title === "Competition" ? { backgroundColor: '#FFA000' } : {}}
                >
                  {item.title}
                  {item.submenu.length > 0 && <ChevronDown size={16} className="ml-1" />}
                </Link>

                {item.submenu.length > 0 && (
                  <div className="absolute left-0 top-full pt-2 w-64 z-50 hidden group-hover:block">
                    <div className="bg-black shadow-lg border border-gray-800 rounded-md py-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.path}
                          className="block px-4 py-2 hover:bg-gray-800 hover:text-[#FFA000] transition-colors"
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4">
            {menuItems.map((item) => (
              <div key={item.title} className="py-2">
                <div
                  className="flex justify-between items-center"
                  onClick={() => item.submenu.length > 0 && toggleSubmenu(item.title)}
                >
                  <Link
                    href={item.path}
                    className={`block relative transition-all duration-300 font-bold uppercase ${
                      item.title === "Competition"
                        ? "px-4 py-2 text-white"
                        : item.title === "Events"
                        ? "text-white border-t-[3px] border-transparent hover:border-[#FFA000]"
                        : `text-white border-t-[3px] ${
                            isActivePath(item.path)
                              ? "border-[#FFA000]"
                              : "border-transparent hover:border-[#FFA000]"
                          }`
                    }`}
                    style={item.title === "Competition" ? { backgroundColor: '#FFA000' } : {}}
                    onClick={(e) => item.submenu.length > 0 && e.preventDefault()}
                  >
                    {item.title}
                  </Link>
                  {item.submenu.length > 0 && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${activeSubmenu === item.title ? "rotate-180" : ""}`}
                    />
                  )}
                </div>

                {item.submenu.length > 0 && activeSubmenu === item.title && (
                  <div className="mt-2 ml-4 border-l border-gray-700 pl-4">
                    {item.submenu.map((subItem) => (
                      <Link 
                        key={subItem.title} 
                        href={subItem.path} 
                        className="block py-2 hover:text-[#FFA000] transition-colors"
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
