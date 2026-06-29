import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Play, Shield } from 'lucide-react-native';
import { useThemeContext } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, fonts } = useThemeContext();
  const insets = useSafeAreaInsets();

  // On Android, if insets.bottom is 0 (meaning navigation bar is not translucent or is hidden), 
  // we still want some padding for visual balance.
  const bottomPadding = Math.max(insets.bottom, 12);
  const containerHeight = 60 + bottomPadding;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.tabBar, 
        borderTopColor: colors.tabBarBorder,
        height: containerHeight,
        paddingBottom: bottomPadding,
      }
    ]}>
      {state.routes.map((route, index) => {
        // Only render the main tabs
        if (!['index', 'partido', 'club'].includes(route.name)) return null;

        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const activeRouteName = state.routes[state.index].name;
        const isClubFocused = activeRouteName === 'club' || activeRouteName.startsWith('manage-');
        
        const isFocused = state.index === index || (route.name === 'club' && isClubFocused);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        // Determine icon
        let IconComponent;
        if (route.name === 'index') IconComponent = Home;
        else if (route.name === 'partido') IconComponent = Play;
        else if (route.name === 'club') IconComponent = Shield;
        else IconComponent = Home;

        const iconColor = isFocused ? colors.primary : colors.tabInactive;

        if (route.name === 'partido') {
          // Main action button (elevated)
          return (
            <View key={route.key} style={styles.centerTabContainer}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                activeOpacity={0.8}
                style={[
                  styles.centerTabButton,
                  { backgroundColor: colors.primary }
                ]}
              >
                {/* Custom styling for the Play icon specifically */}
                <IconComponent size={28} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: iconColor, marginTop: 4 }}>
                {label as string}
              </Text>
            </View>
          );
        }

        // Regular tabs (Home, Club)
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            <IconComponent size={24} color={iconColor} />
            <Text style={{ 
              fontFamily: fonts.bodyMedium, 
              fontSize: 11, 
              color: iconColor, 
              marginTop: 4 
            }}>
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    elevation: 8, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 50,
    position: 'relative',
  },
  centerTabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -24, // Elevate above the tab bar
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  }
});
