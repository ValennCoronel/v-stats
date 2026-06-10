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
    </Tabs>
  );
}
