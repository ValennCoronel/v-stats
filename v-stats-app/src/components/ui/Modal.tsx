import React from 'react';
import { Modal as RNModal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useStyles } from '../../hooks/useStyles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
  contentStyle?: any;
}

export function Modal({ visible, onClose, children, position = 'center', contentStyle }: ModalProps) {
  const { colors } = useStyles();

  return (
    <RNModal visible={visible} transparent animationType={position === 'bottom' ? 'slide' : 'fade'}>
      <TouchableOpacity 
        style={[
          StyleSheet.absoluteFill, 
          { 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            justifyContent: position === 'bottom' ? 'flex-end' : 'center', 
            alignItems: 'center', 
            padding: position === 'center' ? 24 : 0,
            zIndex: 100 
          }
        ]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[{ 
            backgroundColor: colors.bgSurface, 
            width: '100%', 
            borderRadius: position === 'bottom' ? 0 : 24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: position === 'bottom' ? 40 : 24
          }, contentStyle]}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
