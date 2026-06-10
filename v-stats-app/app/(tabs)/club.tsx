import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Shield, Users, Building2, UserPlus, Settings, User } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';

export default function ClubScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { activeProfile, coach } = useProfile();
  const { logout } = useAuth();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles`px-4`, { paddingTop: 60, paddingBottom: 16, backgroundColor: colors.bgMain }]}>
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
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary }}>
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
              onPress={() => router.push('/manage-club')}
              isFirst
            />
            <MenuRow 
              icon={<Users size={20} color={colors.success} />} 
              title="Jugadores" 
              subtitle="Administrá los jugadores del club" 
              badge={activeProfile?.players?.length || 0}
              onPress={() => router.push('/manage-club')}
            />
            <MenuRow 
              icon={<Building2 size={20} color={colors.danger} />} 
              title="Clubes" 
              subtitle="Creá o administrá tus clubes" 
              onPress={() => router.push('/manage-settings')}
            />
            <MenuRow 
              icon={<UserPlus size={20} color={colors.warning} />} 
              title="Invitaciones" 
              subtitle="Gestioná usuarios del club" 
              onPress={() => {}} 
              isLast
            />
          </View>
        </View>

        {/* CONFIGURACIÓN */}
        <View>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase', marginLeft: 4 }}>
            CONFIGURACIÓN
          </Text>
          <View style={[styles`bg-surface rounded-2xl border overflow-hidden`, { borderColor: colors.borderLight }]}>
            <MenuRow 
              icon={<Settings size={20} color={colors.textSecondary} />} 
              title="Configuración general" 
              subtitle="Preferencias de la app" 
              onPress={() => router.push('/manage-settings')} 
              isFirst
            />
            <MenuRow 
              icon={<User size={20} color={colors.textSecondary} />} 
              title="Perfil" 
              subtitle="Mi cuenta y datos personales" 
              onPress={() => router.push('/manage-settings')} 
              isLast
            />
          </View>
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity 
          onPress={() => setShowLogoutModal(true)}
          style={[styles`flex-row items-center justify-center gap-2 py-4 rounded-xl border mt-2`, { borderColor: colors.dangerLight, backgroundColor: themeMode === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.danger }}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, alignItems: 'center' }}>
             <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeMode === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <LogOut size={24} color={colors.danger} />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain, marginBottom: 8, letterSpacing: 1 }}>¿CERRAR SESIÓN?</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              Vas a salir de tu cuenta. Tus datos quedarán guardados.
            </Text>
            <View style={styles`flex-row gap-3`}>
              <TouchableOpacity onPress={() => setShowLogoutModal(false)} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.textMain }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { logout(); router.replace('/'); }} style={{ flex: 1, backgroundColor: colors.danger, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: '#FFF' }}>SALIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
