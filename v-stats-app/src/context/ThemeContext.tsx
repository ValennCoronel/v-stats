import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, themeColors, fonts } from '../theme/colors';

type ThemeContextType = {
  theme: Theme;           // Resolved theme: 'light' | 'dark'
  themeMode: ThemeMode;   // User preference: 'light' | 'dark' | 'auto'
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof themeColors.light;
  fonts: typeof fonts;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Resolve the actual theme
  const theme: Theme =
    themeMode === 'auto'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, colors, fonts }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext debe usarse dentro de un ThemeProvider');
  }
  return context;
}