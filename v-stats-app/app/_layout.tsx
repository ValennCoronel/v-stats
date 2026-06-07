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
    'Gotham Rounded': require('../assets/fonts/gothamrnd_book.otf'),
    'Gotham Rounded Medium': require('../assets/fonts/gothamrnd_medium.otf'),
    'Gotham Rounded Bold': require('../assets/fonts/gothamrnd_bold.otf'),
    'Gotham Rounded Light': require('../assets/fonts/gothamrnd_light.otf'),
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