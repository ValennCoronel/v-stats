import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useStyles } from '../../hooks/useStyles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const { styles, colors } = useStyles();

  return (
    <View style={[styles`w-full`, containerStyle]}>
      {label && (
        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>
          {label.toUpperCase()}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[
          styles`w-full h-12 bg-surface border rounded-lg px-4 text-main`,
          { borderColor: error ? '#EF4444' : colors.borderLight },
          style
        ]}
        {...props}
      />
      {error && (
        <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
