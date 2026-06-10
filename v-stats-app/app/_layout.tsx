import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ProfileProvider } from '../src/context/ProfileContext';

// Evita que la pantalla de splash se oculte automáticamente antes de cargar fuentes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Legacy — Gotham Rounded (kept during migration)
    'Gotham Rounded': require('../assets/fonts/gothamrnd_book.otf'),
    'Gotham Rounded Medium': require('../assets/fonts/gothamrnd_medium.otf'),
    'Gotham Rounded Bold': require('../assets/fonts/gothamrnd_bold.otf'),
    'Gotham Rounded Light': require('../assets/fonts/gothamrnd_light.otf'),
    // New design system
    'BebasNeue': require('../assets/fonts/BebasNeue-Regular.ttf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}