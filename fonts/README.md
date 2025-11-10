# Fonts Directory

## Installation Instructions

1. **Copy your font files to this directory:**
   - `Aquire.otf` (regular weight)
   - `AquireBold.otf` (bold weight)  
   - `AquireLight.otf` (light weight)

2. **After copying the files, restart your Next.js development server:**
   ```bash
   npm run dev
   ```

## File Structure
```
your-project/
├── app/
│   └── layout.tsx (font configuration)
├── fonts/          ← Place your .otf files here
│   ├── Aquire.otf
│   ├── AquireBold.otf
│   └── AquireLight.otf
└── ...
```

## Usage in Your Components

### Method 1: Using Tailwind CSS Classes (Recommended)
```tsx
<h1 className="font-aquire font-bold">Bold Aquire Font</h1>
<p className="font-aquire font-light">Light Aquire Font</p>
<p className="font-aquire">Regular Aquire Font</p>
```

### Method 2: Using CSS Variable
```tsx
<div style={{ fontFamily: 'var(--font-aquire)' }}>
  Aquire font text
</div>
```

### Method 3: In CSS/globals.css
```css
.my-custom-class {
  font-family: var(--font-aquire), sans-serif;
}
```

## Available Font Weights
- **Light (300)**: `font-light` class or `fontWeight: 300`
- **Regular (400)**: `font-normal` class or `fontWeight: 400` (default)
- **Bold (700)**: `font-bold` class or `fontWeight: 700`

## Notes
- Fonts are automatically optimized by Next.js
- Font display strategy is set to "swap" for better performance
- The CSS variable `--font-aquire` is available globally
- Fonts are self-hosted, so no external requests needed

