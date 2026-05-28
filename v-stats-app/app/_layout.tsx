import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ProfileProvider } from '../src/context/ProfileContext';

export default function RootLayout() {
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