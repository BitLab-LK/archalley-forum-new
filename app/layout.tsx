import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
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
import GTMHead from "@/components/gtm-head"
import GTMBody from "@/components/gtm-body"
import GoogleAnalytics from "@/components/google-analytics"

const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] })

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
  openGraph: {
    title: "Archalley - Architecture & Design Excellence",
    url: 'https://forum-dev.archalley.com',
    siteName: 'Archalley',
    images: [], // Explicitly prevent any images
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Archalley - Architecture & Design Excellence",
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
        <GTMHead />
        <GoogleAnalytics />
        <script type="text/javascript">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ononimkh1f");
          `}
        </script>
      </head>
      <body className={`${roboto.className} ${aquire.variable}`} suppressHydrationWarning>
        <GTMBody />
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
                <main className="flex-1 pb-8 md:pb-0 relative z-10">{children}</main>
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
