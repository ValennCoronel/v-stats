import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useStyles } from '../../hooks/useStyles';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  textClassName?: string;
  className?: string; // Optional custom classes
}

export function Button({ 
  variant = 'primary', 
  isLoading, 
  leftIcon, 
  rightIcon, 
  children, 
  style, 
  textClassName,
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const { styles, colors } = useStyles();

  let containerClasses = 'w-full h-12 justify-center items-center flex-row rounded-lg gap-2 px-4 ';
  let textClasses = '';
  let spinnerColor = '#ffffff';

  switch (variant) {
    case 'primary':
      containerClasses += 'bg-brand';
      textClasses = 'text-white';
      break;
    case 'secondary':
      containerClasses += 'bg-surface border border-gray';
      textClasses = 'text-main';
      spinnerColor = colors.textMain;
      break;
    case 'outline':
      containerClasses += 'bg-transparent border border-brand';
      textClasses = 'text-brand';
      spinnerColor = colors.brand;
      break;
    case 'danger':
      containerClasses += 'bg-transparent';
      textClasses = 'text-white';
      break;
    case 'ghost':
      containerClasses += 'bg-transparent';
      textClasses = 'text-brand';
      spinnerColor = colors.brand;
      break;
  }
  
  if (className) {
    containerClasses += ` ${className}`;
  }

  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[
        styles`${containerClasses}`,
        isDanger && { backgroundColor: '#EF4444' },
        (disabled || isLoading) && { opacity: 0.6 },
        style
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={[
            styles`text-bold ${textClasses} ${textClassName || ''}`,
            { fontFamily: 'Gotham Rounded', fontSize: 14, letterSpacing: 0.5, marginTop: 1 }
          ]}>
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
