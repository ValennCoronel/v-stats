import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
  onPress?: () => void;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
}

export function Avatar({ 
  name, 
  size = 40, 
  onPress, 
  borderWidth = 0, 
  borderColor = 'transparent',
  backgroundColor = '#1E6FD9'
}: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const fontSize = size * 0.4;

  const Container = onPress ? TouchableOpacity : (View as any);

  return (
    <Container
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth,
        borderColor
      }}
    >
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize, fontWeight: '700', color: '#fff', marginTop: size > 40 ? 4 : 2 }}>
        {initials}
      </Text>
    </Container>
  );
}
