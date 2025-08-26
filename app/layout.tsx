import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { BadgeNotificationHandler } from "@/components/badge-notifications"
import { Toaster } from "@/components/ui/toaster"
import { ConfirmDialogProvider } from "@/hooks/use-confirm-dialog"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Archalley Forum - Architecture & Design Community",
  description:
    "A dedicated space for architects, designers, and enthusiasts to connect, share ideas, and discuss all things architecture, design and construction.",
  keywords: "architecture, design, construction, forum, community, architects, designers",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ConfirmDialogProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <BadgeNotificationHandler />
              <Toaster />
            </div>
          </ConfirmDialogProvider>
        </Providers>
      </body>
    </html>
  )
}
