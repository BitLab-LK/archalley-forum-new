# Fonts Directory

## Installation Instructions

1. **Copy your font files to this directory:**
   - `Aquire.otf` (regular weight)
   - `AquireBold.otf` (bold weight)
   - `AquireLight.otf` (light weight)

2. **After copying the files, the fonts will be automatically available in your Next.js application.**

## Usage

The Aquire font family is configured in `app/layout.tsx` and can be used in two ways:

### Method 1: Using Tailwind CSS Classes
```tsx
<h1 className="font-aquire">This uses Aquire font</h1>
<p className="font-aquire font-light">Light weight</p>
<p className="font-aquire font-normal">Regular weight</p>
<p className="font-aquire font-bold">Bold weight</p>
```

### Method 2: Using CSS Variable
```tsx
<div style={{ fontFamily: 'var(--font-aquire)' }}>
  This uses Aquire font
</div>
```

### Method 3: Using Inline Styles
```tsx
<div style={{ fontFamily: 'var(--font-aquire), sans-serif' }}>
  Aquire font with fallback
</div>
```

## Font Weights Available
- **Light (300)**: Use `font-light` or `fontWeight: 300`
- **Regular (400)**: Use `font-normal` or `fontWeight: 400`
- **Bold (700)**: Use `font-bold` or `fontWeight: 700`

## Notes
- The fonts are automatically optimized by Next.js
- Font display is set to "swap" for better performance
- The font variable `--font-aquire` is available globally

