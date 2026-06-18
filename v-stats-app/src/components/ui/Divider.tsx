import React from 'react';
import { View, ViewProps } from 'react-native';

interface DividerProps extends ViewProps {
  color?: string;
}

export function Divider({ style, color = '#F4F7FB', ...props }: DividerProps) {
  return <View style={[{ height: 1, backgroundColor: color, marginVertical: 8 }, style]} {...props} />;
}
