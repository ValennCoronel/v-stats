import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Shield, Users, Building2, UserPlus, Settings, User, Check } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { Modal } from '../../src/components/ui/Modal';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const PROFILE_COLORS = ['#1E6FD9', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2'];

export default function ClubScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  
  // Fusión: Mantenemos insets de dev y updateProfile del fix
  const insets = useSafeAreaInsets();
  const { activeProfile, coach, updateProfile } = useProfile();
  
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditClub, setShowEditClub] = useState(false);
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [color, setColor] = useState('');

  const openEditModal = () => {
    setClubName(activeProfile?.clubName || '');
    setCity(activeProfile?.city || '');
    setColor(activeProfile?.color || PROFILE_COLORS[0]);
    setShowEditClub(true);
  };

  const handleSaveClub = async () => {
    if (!clubName.trim()) return;
    try {
      await updateProfile(activeProfile.id, {
        clubName: clubName.trim(),
        city: city.trim(),
        color: color,
        role: activeProfile.role,
      });
      setShowEditClub(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles`px-4`, { paddingTop: Math.max(insets.top, 16), paddingBottom: 16, backgroundColor: colors.bgMain }]}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 32, color: colors.textMain, letterSpacing: 1, marginBottom: 16 }}>
          CLUB
        </Text>
        
        {/* Active Club Card */}
        <View style={[styles`flex-row items-center justify-between p-4 rounded-2xl bg-surface border`, { borderColor: colors.borderLight }]}>
          <View style={styles`flex-row items-center gap-3`}>
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: activeProfile.color || colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Building2 size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
                {activeProfile?.clubName || 'Mi Club'}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {activeProfile?.city || 'Sede principal'}
              </Text>
            </View>
          </View>
          
          {/* Cambios de fix: Mantenemos el botón para editar */}
          <TouchableOpacity 
            onPress={openEditModal}
            activeOpacity={0.7}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary }}>EDITAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pt-4 pb-24 gap-6`}>
        
        {/* GESTIÓN */}
        <View>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase', marginLeft: 4 }}>
            GESTIÓN
          </Text>
          <View style={[styles`bg-surface rounded-2xl border overflow-hidden`, { borderColor: colors.borderLight }]}>
            <MenuRow 
              icon={<Shield size={20} color={colors.primary} />} 
              title="Equipos" 
              subtitle="Administrá los equipos del club" 
              badge={activeProfile?.teams?.length || 0}
              onPress={() => router.push('/manage-teams')}
              isFirst
            />
            <MenuRow 
              icon={<Users size={20} color={colors.success} />} 
              title="Jugadores" 
              subtitle="Administrá los jugadores del club" 
              badge={activeProfile?.players?.length || 0}
              onPress={() => router.push('/manage-players?from=club')}
            />
            <MenuRow 
              icon={<Building2 size={20} color={colors.danger} />} 
              title="Clubes" 
              subtitle="Creá o administrá tus clubes" 
              onPress={() => router.push('/manage-clubs')}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Edit Club Modal ── */}
      <Modal visible={showEditClub} onClose={() => setShowEditClub(false)}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>
          Editar Club
        </Text>
        
        <Input 
          label="NOMBRE DEL CLUB"
          value={clubName} 
          onChangeText={setClubName} 
          placeholder="Ej: Club Atlético..."
          containerStyle={{ marginBottom: 12 }}
        />
        
        <Input 
          label="CIUDAD / SEDE"
          value={city} 
          onChangeText={setCity} 
          placeholder="Ej: Buenos Aires"
          containerStyle={{ marginBottom: 20 }}
        />

        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginBottom: 8 }}>COLOR PRINCIPAL</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {PROFILE_COLORS.map(c => (
            <TouchableOpacity 
              key={c} 
              onPress={() => setColor(c)} 
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              {color === c && <Check size={16} color="#fff" />}
            </TouchableOpacity>
          ))}
        </View>

        <Button 
          variant="primary"
          disabled={!clubName.trim()} 
          onPress={handleSaveClub}
          style={{ backgroundColor: clubName.trim() ? colors.success : colors.textMuted }}
        >
          GUARDAR CAMBIOS
        </Button>
      </Modal>

    </View>
  );
}

function MenuRow({ icon, title, subtitle, badge, onPress, isFirst, isLast }: any) {
  const { colors, fonts } = useStyles();
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        { flexDirection: 'row', alignItems: 'center', padding: 16 },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }
      ]}
    >
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.bgMain, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMain }}>{title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>{badge}</Text>
        </View>
      )}
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
