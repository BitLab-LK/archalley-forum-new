"use client";
import { MantineProvider } from "@mantine/core";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { SocketProvider } from "@/lib/socket-context"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <MantineProvider>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
          <AuthProvider>
            <SidebarProvider>
              <SocketProvider>
                {children}
              </SocketProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </MantineProvider>
    </SessionProvider>
  )
}