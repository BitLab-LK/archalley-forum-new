"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const allowedThemes = ["system", "light", "dark"] as const;
type SonnerTheme = typeof allowedThemes[number];

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const safeTheme: SonnerTheme = allowedThemes.includes(theme as SonnerTheme)
    ? (theme as SonnerTheme)
    : "system";

  return (
    <Sonner
      theme={safeTheme}
      className="toaster group"
      toastOptions={{
        className:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
      }}
      {...props}
    />
  );
};

export { Toaster }
