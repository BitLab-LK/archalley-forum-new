import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"
import TopBar from "@/components/top-bar"
import NavigationBar from "@/components/navigation-bar"
import Footer from "@/components/footer"
import { BadgeNotificationHandler } from "@/components/badge-notifications"
import { Toaster } from "@/components/ui/toaster"
import { ConfirmDialogProvider } from "@/hooks/use-confirm-dialog"
import { SessionMonitor } from "@/hooks/use-session-monitor"

const inter = Inter({ subsets: ["latin"] })

// Aquire font family
// Font files should be placed in the root-level 'fonts' directory
// Alternative: You can also place them in 'public/fonts' and update paths accordingly
const aquire = localFont({
  src: [
    {
      path: "../fonts/AquireLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/Aquire.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AquireBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aquire",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Archalley - Architecture & Design Excellence",
  description:
    "Discover innovative architecture and design. Join our community of architects, designers, and enthusiasts to connect, share ideas, and explore cutting-edge projects.",
  keywords: "architecture, design, construction, forum, community, architects, designers, projects, innovation",
  generator: 'bitlab.lk',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          .loading-skeleton {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
        `}</style>
      </head>
      <body className={`${inter.className} ${aquire.variable}`} suppressHydrationWarning>
        <Providers>
          <ConfirmDialogProvider>
            <SessionMonitor>
              <div className="min-h-screen flex flex-col">
                <div className="relative z-50">
                  <TopBar />
                </div>
                <div className="relative z-50">
                  <NavigationBar />
                </div>
                <main className="flex-1 pb-20 md:pb-0 relative z-10">{children}</main>
                <div className="relative z-50">
                  <Footer />
                </div>
                <BadgeNotificationHandler />
                <Toaster />
              </div>
            </SessionMonitor>
          </ConfirmDialogProvider>
        </Providers>
      </body>
    </html>
  )
}
