export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'auto';

export const themeColors = {
  light: {
    // Backgrounds
    bgMain: '#F7F9FC',
    bgSurface: '#FFFFFF',
    bgCard: '#FFFFFF',

    // Primary brand
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: 'rgba(37, 99, 235, 0.1)',

    // Text
    textMain: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Header (kept for gradients / hero areas)
    headerBg: '#2563EB',

    // Screen background
    screenBg: '#F7F9FC',

    // Semantic
    success: '#16A34A',
    successLight: '#DCFCE7',
    successDark: '#15803D',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    dangerDark: '#DC2626',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabInactive: '#9CA3AF',

    // Legacy aliases
    brand: '#2563EB',
    borderGray: '#E5E7EB',
    slate500: '#6B7280',
    liveBg: '#071A35',
  },
  dark: {
    // Backgrounds
    bgMain: '#071A35',
    bgSurface: '#0F2747',
    bgCard: '#0F2747',

    // Primary brand
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: 'rgba(59, 130, 246, 0.15)',

    // Text
    textMain: '#FFFFFF',
    textSecondary: '#B8C4D9',
    textMuted: '#7B8BA3',

    // Borders
    border: '#1E3A5F',
    borderLight: '#15304D',

    // Header
    headerBg: '#0F2747',

    // Screen background
    screenBg: '#071A35',

    // Semantic
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.15)',
    successDark: '#16A34A',
    danger: '#F87171',
    dangerLight: 'rgba(248, 113, 113, 0.15)',
    dangerDark: '#EF4444',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',

    // Tab bar
    tabBar: '#0A1E38',
    tabBarBorder: '#1E3A5F',
    tabInactive: '#7B8BA3',

    // Legacy aliases
    brand: '#3B82F6',
    borderGray: '#1E3A5F',
    slate500: '#B8C4D9',
    liveBg: '#071A35',
  },
};

// Typography constants
export const fonts = {
  // Titles, scores, big numbers
  heading: 'BebasNeue',
  // Body text, forms, labels
  body: 'Inter',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  // Legacy (for gradual migration)
  legacy: 'Gotham Rounded',
  legacyBold: 'Gotham Rounded Bold',
};