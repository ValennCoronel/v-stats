export type Theme = 'light' | 'dark';

export const themeColors = {
  light: {
    bgMain: '#f8fafc',      // slate-50
    bgSurface: '#ffffff',   // white
    textMain: '#0f172a',    // slate-900
    textMuted: '#64748b',   // slate-500
    primary: '#10b981',     // emerald-500
    border: '#e2e8f0',      // slate-200
    brand: '#1E6FD9',      // El azul de V-Stats
    borderGray: '#E2E8F0', // El borde de los inputs
    headerBg: '#0D1F33',
    screenBg: '#F4F7FB',
    slate500: '#64748B',
    success: '#16A34A', // Verde de victoria
    danger: '#EF4444',  // Rojo de derrota/en vivo
    liveBg: '#0D1F33',  // El fondo oscuro de la tarjeta en vivo
    successLight: '#DCFCE7', // bg-green-100
    successDark: '#15803D',  // text-green-700
    dangerLight: '#FEE2E2',  // bg-red-100
    dangerDark: '#DC2626',   // text-red-600
    warning: '#F97316',      // bg-orange-500
  },
  dark: {
    bgMain: '#020617',      // slate-950
    bgSurface: '#0f172a',   // slate-900
    textMain: '#f8fafc',    // slate-50
    textMuted: '#94a3b8',   // slate-400
    primary: '#10b981',     // emerald-500
    border: '#1e293b',      // slate-800
    brand: '#1E6FD9', 
    borderGray: '#334155', // Un gris más oscuro para la noche
    headerBg: '#0D1F33',
    screenBg: '#F4F7FB',
    slate500: '#64748B',
    success: '#16A34A', // Verde de victoria
    danger: '#EF4444',  // Rojo de derrota/en vivo
    liveBg: '#0D1F33',  // El fondo oscuro de la tarjeta en vivo
    successLight: '#DCFCE7', // bg-green-100
    successDark: '#15803D',  // text-green-700
    dangerLight: '#FEE2E2',  // bg-red-100
    dangerDark: '#DC2626',   // text-red-600
    warning: '#F97316',      // bg-orange-500
  }
};