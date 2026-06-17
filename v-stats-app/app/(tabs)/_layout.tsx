import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../src/components/BottomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="partido"
        options={{
          title: 'Partido',
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          title: 'Club',
        }}
      />
      <Tabs.Screen
        name="manage-teams"
        options={{
          title: 'Equipos',
          href: null,
        }}
      />
      <Tabs.Screen
        name="manage-players"
        options={{
          title: 'Jugadores',
          href: null,
        }}
      />
      <Tabs.Screen
        name="manage-clubs"
        options={{
          title: 'Clubes',
          href: null,
        }}
      />
    </Tabs>
  );
}
