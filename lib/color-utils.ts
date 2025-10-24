/**
 * Color utility functions for dynamic category colors
 * Handles color accessibility and contrast calculations
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Get appropriate text color (black or white) for a given background color
 */
export function getTextColorForBackground(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000'; // Default to black if can't parse
  
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  
  const whiteContrast = getContrastRatio(rgb, white);
  const blackContrast = getContrastRatio(rgb, black);
  
  // Return white text if it has better contrast, otherwise black
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Generate a lighter version of a color for backgrounds
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const lighten = (color: number) => {
    return Math.min(255, Math.round(color + (255 - color) * (percent / 100)));
  };
  
  const newR = lighten(rgb.r);
  const newG = lighten(rgb.g);
  const newB = lighten(rgb.b);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate a darker version of a color
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const darken = (color: number) => {
    return Math.max(0, Math.round(color * (1 - percent / 100)));
  };
  
  const newR = darken(rgb.r);
  const newG = darken(rgb.g);
  const newB = darken(rgb.b);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate an alpha version of a color
 */
export function addAlphaToColor(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Generate category color styles for use with database colors
 */
export interface CategoryColorStyles {
  backgroundColor: string;
  color: string;
  lightBackground: string;
  borderColor: string;
  accentBackground: string;
}

export function generateCategoryStyles(categoryColor: string): CategoryColorStyles {
  const textColor = getTextColorForBackground(categoryColor);
  const lightBackground = lightenColor(categoryColor, 70); // More visible light version
  const accentBackground = lightenColor(categoryColor, 50); // Medium version for accents
  const borderColor = lightenColor(categoryColor, 40); // Slightly darker for borders
  
  return {
    backgroundColor: categoryColor,
    color: textColor,
    lightBackground,
    borderColor,
    accentBackground
  };
}