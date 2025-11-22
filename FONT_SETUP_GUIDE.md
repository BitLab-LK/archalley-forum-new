# Aquire Font Setup Guide

## Quick Start

Your Aquire fonts have been configured in the Next.js application. Follow these steps to complete the installation:

## Step 1: Copy Font Files

Copy your three font files to the `fonts` directory at the root of your project:

```
fonts/
├── Aquire.otf
├── AquireBold.otf
└── AquireLight.otf
```

**Location:** `C:\inetpub\wwwroot\archalley-forum-new\fonts\`

## Step 2: Verify Installation

After copying the files, restart your development server:

```bash
npm run dev
```

## Step 3: Use the Fonts

The Aquire font is now available throughout your application. Here's how to use it:

### Option 1: Tailwind CSS Classes (Recommended)

```tsx
// Light weight
<h1 className="font-aquire font-light">Light Text</h1>

// Regular weight (default)
<p className="font-aquire">Regular Text</p>

// Bold weight
<h2 className="font-aquire font-bold">Bold Text</h2>
```

### Option 2: CSS Variable

```tsx
<div style={{ fontFamily: 'var(--font-aquire)' }}>
  Aquire font text
</div>
```

### Option 3: Inline Styles with Weight

```tsx
<div style={{ 
  fontFamily: 'var(--font-aquire), sans-serif',
  fontWeight: 700 
}}>
  Bold Aquire font
</div>
```

### Option 4: CSS Classes

Add to your `globals.css` or component CSS:

```css
.my-heading {
  font-family: var(--font-aquire), sans-serif;
  font-weight: 700; /* Bold */
}
```

## Font Weights Available

- **300 (Light)**: Use `font-light` class or `fontWeight: 300`
- **400 (Regular)**: Use `font-normal` class or `fontWeight: 400`
- **700 (Bold)**: Use `font-bold` class or `fontWeight: 700`

## Example: Using in Competition Page

You can now use the Aquire font in your competition page:

```tsx
// In competition-page-client.tsx
<h1 className="font-aquire font-bold text-4xl">
  Archalley Competition 2025
</h1>
```

## Configuration Details

The font is configured in:
- **File**: `app/layout.tsx`
- **Tailwind Config**: `tailwind.config.ts` (added `font-aquire` utility)
- **CSS Variable**: `--font-aquire` (available globally)

## Troubleshooting

### Fonts not loading?

1. **Check file paths**: Ensure the font files are in the `fonts/` directory at the root level
2. **Check file names**: File names must match exactly (case-sensitive):
   - `Aquire.otf`
   - `AquireBold.otf`
   - `AquireLight.otf`
3. **Restart server**: After adding fonts, restart your Next.js development server
4. **Clear cache**: Clear your browser cache and restart the dev server

### Alternative: Using Public Folder

If you prefer to use the `public/fonts` folder instead:

1. Move fonts to `public/fonts/`
2. Update `app/layout.tsx` font paths to:
   ```typescript
   path: "../public/fonts/Aquire.otf",
   ```

## Notes

- Fonts are automatically optimized by Next.js
- Font display strategy is set to "swap" for better performance
- The font variable is available globally via `--font-aquire`
- Fonts are self-hosted, so no external CDN requests needed

## Next Steps

1. ✅ Copy font files to `fonts/` directory
2. ✅ Restart development server
3. ✅ Start using `font-aquire` class in your components
4. ✅ Test on different pages to see the font in action

Happy styling! 🎨

