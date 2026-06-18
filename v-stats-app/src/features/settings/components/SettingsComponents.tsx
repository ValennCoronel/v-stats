import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useStyles } from '../../../hooks/useStyles';

export function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const { styles } = useStyles();
  return (
    <View>
      <View style={styles`flex-row items-center gap-1.5 mb-2 px-1`}>
        {icon}
        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>{title}</Text>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {children}
      </View>
    </View>
  );
}

export function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { styles } = useStyles();
  return (
    <TouchableOpacity onPress={onPress} style={styles`w-full flex-row items-center justify-between px-4 py-3.5`}>
      <Text style={{ fontSize: 15, color: '#0D1F33' }}>{label}</Text>
      <View style={styles`flex-row items-center gap-2`}>
        <Text style={{ fontSize: 14, color: '#64748B' }} numberOfLines={1}>{value}</Text>
        <ChevronRight size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

export function SwitchRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  const { styles } = useStyles();
  return (
    <View style={styles`flex-row items-center justify-between px-4 py-3.5`}>
      <View style={styles`flex-1 pr-3`}>
        <Text style={{ fontSize: 15, color: '#0D1F33' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{desc}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onChange} 
        trackColor={{ false: '#E2E8F0', true: '#1E6FD9' }}
        thumbColor="#fff"
      />
    </View>
  );
}

export type AccessRole = 'admin' | 'coach' | 'assistant';

export function RolePill({ role, small }: { role: AccessRole; small?: boolean }) {
  const map: Record<AccessRole, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: '#1E6FD9', bg: 'rgba(30,111,217,0.1)' },
    coach: { label: 'Entrenador', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
    assistant: { label: 'Asistente', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  };
  const { label, color, bg } = map[role];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: small ? 11 : 12, letterSpacing: 0.5, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
