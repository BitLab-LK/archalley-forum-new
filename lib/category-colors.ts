// Category color mappings for consistent styling across the application

export const categoryColors = {
  business: {
    primary: 'bg-blue-500',
    light: 'bg-blue-50',
    lightDark: 'dark:bg-blue-950/20',
    border: 'border-blue-200',
    text: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    accent: 'bg-blue-100',
    accentDark: 'dark:bg-blue-900/30'
  },
  design: {
    primary: 'bg-purple-500',
    light: 'bg-purple-50',
    lightDark: 'dark:bg-purple-950/20',
    border: 'border-purple-200',
    text: 'text-purple-700',
    textDark: 'dark:text-purple-300',
    accent: 'bg-purple-100',
    accentDark: 'dark:bg-purple-900/30'
  },
  career: {
    primary: 'bg-green-500',
    light: 'bg-green-50',
    lightDark: 'dark:bg-green-950/20',
    border: 'border-green-200',
    text: 'text-green-700',
    textDark: 'dark:text-green-300',
    accent: 'bg-green-100',
    accentDark: 'dark:bg-green-900/30'
  },
  construction: {
    primary: 'bg-yellow-500',
    light: 'bg-yellow-50',
    lightDark: 'dark:bg-yellow-950/20',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    textDark: 'dark:text-yellow-300',
    accent: 'bg-yellow-100',
    accentDark: 'dark:bg-yellow-900/30'
  },
  academic: {
    primary: 'bg-indigo-500',
    light: 'bg-indigo-50',
    lightDark: 'dark:bg-indigo-950/20',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    accent: 'bg-indigo-100',
    accentDark: 'dark:bg-indigo-900/30'
  },
  informative: {
    primary: 'bg-cyan-500',
    light: 'bg-cyan-50',
    lightDark: 'dark:bg-cyan-950/20',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    textDark: 'dark:text-cyan-300',
    accent: 'bg-cyan-100',
    accentDark: 'dark:bg-cyan-900/30'
  },
  technology: {
    primary: 'bg-blue-600',
    light: 'bg-blue-50',
    lightDark: 'dark:bg-blue-950/20',
    border: 'border-blue-200',
    text: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    accent: 'bg-blue-100',
    accentDark: 'dark:bg-blue-900/30'
  },
  other: {
    primary: 'bg-gray-500',
    light: 'bg-gray-50',
    lightDark: 'dark:bg-gray-950/20',
    border: 'border-gray-200',
    text: 'text-gray-700',
    textDark: 'dark:text-gray-300',
    accent: 'bg-gray-100',
    accentDark: 'dark:bg-gray-900/30'
  },
  // Default fallback
  default: {
    primary: 'bg-slate-500',
    light: 'bg-slate-50',
    lightDark: 'dark:bg-slate-950/20',
    border: 'border-slate-200',
    text: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    accent: 'bg-slate-100',
    accentDark: 'dark:bg-slate-900/30'
  }
};

// Helper function to get category colors
export const getCategoryColors = (categoryId: string) => {
  return categoryColors[categoryId as keyof typeof categoryColors] || categoryColors.default;
};

// Helper function to get category background class for posts
export const getCategoryBackground = (categoryId: string) => {
  const colors = getCategoryColors(categoryId);
  // Use accent colors for better visibility on post backgrounds
  return `${colors.accent} ${colors.accentDark}`;
};

// Helper function to get very light category background for category cards
export const getCategoryLightBackground = (categoryId: string) => {
  const colors = getCategoryColors(categoryId);
  return `${colors.light} ${colors.lightDark}`;
};

// Helper function to get category text colors
export const getCategoryTextColors = (categoryId: string) => {
  const colors = getCategoryColors(categoryId);
  return `${colors.text} ${colors.textDark}`;
};

// Helper function to get category accent colors
export const getCategoryAccentColors = (categoryId: string) => {
  const colors = getCategoryColors(categoryId);
  return `${colors.accent} ${colors.accentDark}`;
};

// Helper function to get category border colors
export const getCategoryBorderColors = (categoryId: string) => {
  const colors = getCategoryColors(categoryId);
  return colors.border;
};
