import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Archalley - Architecture & Design Excellence",
  description:
    "Discover innovative architecture and design. Join our community of architects, designers, and enthusiasts to connect, share ideas, and explore cutting-edge projects.",
  keywords: "architecture, design, construction, forum, community, architects, designers, projects, innovation",
  generator: 'v0.dev'
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
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ConfirmDialogProvider>
            <SessionMonitor>
              <div className="min-h-screen flex flex-col">
                <TopBar />
                <NavigationBar />
                <main className="flex-1 pb-20 md:pb-0">{children}</main>
                <Footer />
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
