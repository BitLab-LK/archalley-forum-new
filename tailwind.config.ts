import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Use default container settings - DO NOT add custom max-width overrides
    extend: {
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            lineHeight: '1.75',
            p: {
              marginTop: theme('spacing.5'),
              marginBottom: theme('spacing.5'),
              textAlign: 'justify',
            },
            img: { display: 'block', width: '100%', height: 'auto' },
            'picture > img': { display: 'block', width: '100%', height: 'auto' },
            hr: {
              marginTop: '1em',
              marginBottom: '1em',
            },
          },
        },
        sm: {
          css: {
            lineHeight: '1.7',
            p: {
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.4'),
              textAlign: 'justify',
            },
            img: { display: 'block', width: '100%', height: 'auto' },
            'picture > img': { display: 'block', width: '100%', height: 'auto' },
            hr: {
              marginTop: '1em',
              marginBottom: '1em',
            },
          },
        },
        base: {
          css: {
            lineHeight: '1.75',
            p: {
              marginTop: theme('spacing.5'),
              marginBottom: theme('spacing.5'),
              textAlign: 'justify',
            },
            img: { display: 'block', width: '100%', height: 'auto' },
            'picture > img': { display: 'block', width: '100%', height: 'auto' },
            hr: {
              marginTop: '1em',
              marginBottom: '1em',
            },
          },
        },
        lg: {
          css: {
            lineHeight: '1.8',
            p: {
              marginTop: theme('spacing.6'),
              marginBottom: theme('spacing.6'),
              textAlign: 'justify',
            },
            img: { display: 'block', width: '100%', height: 'auto' },
            'picture > img': { display: 'block', width: '100%', height: 'auto' },
            hr: {
              marginTop: '1em',
              marginBottom: '1em',
            },
          },
        },
      }),
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FFA000",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        yellow: {
          400: "#FFA000",
          500: "#FFA000",
          600: "#FFA000",
          700: "#FFA000",
          800: "#FFA000",
        },
        archalley: {
          black: "#000000",
          gray: "#808080",
          "gray-800": "#1f2937",
          "gray-700": "#374151",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        aquire: ["var(--font-aquire)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config

export default config
