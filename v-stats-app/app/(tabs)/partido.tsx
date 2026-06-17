import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Users, Calendar, BarChart3, ChevronDown, Shield, Shirt, History } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';

export default function PartidoScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { activeProfile, profiles, switchProfile } = useProfile();
  
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);

  // Auto-select first team if available
  useEffect(() => {
    if (activeProfile?.teams && activeProfile.teams.length > 0 && !activeTeamId) {
      setActiveTeamId(activeProfile.teams[0].id);
    }
  }, [activeProfile, activeTeamId]);

  const activeTeam = activeProfile?.teams?.find(t => t.id === activeTeamId) || activeProfile?.teams?.[0];

  const handleStartMatch = () => {
    if (!activeTeam) return;
    router.push(`/team/${activeTeam.id}`);
  };

  const imageSource = themeMode === 'dark' 
    ? require('../../assets/SaltoJugadorDarkMode.png')
    : require('../../assets/SaltoJugadorWhiteMode.png');

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles`px-5 pb-24 gap-6`}>
        {/* Header */}
        <View style={{ paddingTop: 32, paddingBottom: 8 }}>
          <View style={styles`flex-row items-center justify-between`}>
            <View style={{ width: 24 }} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain, letterSpacing: 1 }}>
              PARTIDO
            </Text>
            <TouchableOpacity onPress={() => activeTeam?.id && router.push(`/team/${activeTeam.id}`)}>
              <History size={24} color={colors.textMain} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Decorative Image */}
        <View style={styles`items-center justify-center`}>
          <Image 
            source={imageSource}
            style={{ width: '90%', height: 240, resizeMode: 'contain' }}
          />
        </View>

        {!hasActiveMatch ? (
          <>
            <View style={styles`items-center mb-6`}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, letterSpacing: 1, marginBottom: 8 }}>
                SIN PARTIDO ACTIVO
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                Seleccioná el club y equipo para{'\n'}iniciar un nuevo partido.
              </Text>
            </View>

            {/* Selectors */}
            <View style={styles`gap-4 mb-4`}>
              <View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                  CLUB
                </Text>
                <TouchableOpacity onPress={() => setShowClubSelector(true)} activeOpacity={0.7} style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <Shield size={22} color="#1C64F2" fill="#1C64F2" />
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMain }}>
                      {activeProfile?.clubName || 'Seleccionar club'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                  EQUIPO
                </Text>
                <TouchableOpacity onPress={() => setShowTeamSelector(true)} activeOpacity={0.7} style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <Shirt size={22} color="#1C64F2" fill="#1C64F2" />
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMain }}>
                      {activeTeam?.name || 'Seleccionar equipo'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Main CTA */}
            <TouchableOpacity
              onPress={handleStartMatch}
              activeOpacity={0.8}
              style={[
                styles`w-full flex-row items-center justify-center gap-2`,
                { marginTop: 16, marginBottom: 8, borderRadius: 12, backgroundColor: '#1C64F2', paddingVertical: 14, elevation: 4, shadowColor: '#1C64F2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
              ]}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <Play size={12} color="#1C64F2" fill="#1C64F2" style={{ marginLeft: 2 }} />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 1 }}>
                INICIAR PARTIDO
              </Text>
            </TouchableOpacity>

            {/* Quick Access */}
            <View style={{ marginTop: 40 }}>
              <View style={styles`flex-row items-center justify-center mb-6`}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginHorizontal: 12 }}>
                  ACCESOS RÁPIDOS
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
              </View>

              <View style={styles`flex-row justify-between gap-3`}>
                <QuickAccessCard icon={<Users size={20} color={colors.primary} />} title="Ver jugadores" subtitle="Del club" onPress={() => router.push('/(tabs)/club')} />
                <QuickAccessCard icon={<Calendar size={20} color={colors.primary} />} title="Próximo partido" subtitle="Próximamente" onPress={() => setShowPlaceholderModal(true)} />
                <QuickAccessCard icon={<BarChart3 size={20} color={colors.primary} />} title="Estadísticas" subtitle="Vista rápida" onPress={() => router.push('/stats/general')} />
              </View>
            </View>
          </>
        ) : (
          <View />
        )}
      </ScrollView>

      {/* Club Selector Modal */}
      <Modal visible={showClubSelector} transparent animationType="fade">
        <TouchableOpacity 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 }]}
          activeOpacity={1}
          onPress={() => setShowClubSelector(false)}
        >
          <View style={{ backgroundColor: colors.bgSurface, width: '100%', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Club</Text>
            {profiles?.map(profile => (
              <TouchableOpacity 
                key={profile.id}
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => {
                  switchProfile(profile.id);
                  setActiveTeamId(null);
                  setShowClubSelector(false);
                }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeProfile?.id === profile.id ? colors.primary : colors.textMain }}>{profile.clubName}</Text>
                {activeProfile?.id === profile.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
              </TouchableOpacity>
            ))}
            {(!profiles || profiles.length === 0) && (
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay clubes disponibles</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Team Selector Modal */}
      <Modal visible={showTeamSelector} transparent animationType="fade">
        <TouchableOpacity 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 }]}
          activeOpacity={1}
          onPress={() => setShowTeamSelector(false)}
        >
          <View style={{ backgroundColor: colors.bgSurface, width: '100%', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Equipo</Text>
            {activeProfile?.teams?.map(team => (
              <TouchableOpacity 
                key={team.id}
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => {
                  setActiveTeamId(team.id);
                  setShowTeamSelector(false);
                }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeTeamId === team.id ? colors.primary : colors.textMain }}>{team.name}</Text>
                {activeTeamId === team.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
              </TouchableOpacity>
            ))}
            {(!activeProfile?.teams || activeProfile.teams.length === 0) && (
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay equipos disponibles</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Placeholder Modal */}
      <Modal visible={showPlaceholderModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Calendar size={32} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, marginBottom: 8, textAlign: 'center' }}>Próximamente</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Esta funcionalidad aún no está disponible. Pronto podrás ver el calendario de partidos.</Text>
            <TouchableOpacity onPress={() => setShowPlaceholderModal(false)} style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: '#FFF' }}>Entendido</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

function QuickAccessCard({ icon, title, subtitle, onPress }: { icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void }) {
  const { colors, fonts } = useStyles();
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.quickCard, 
        { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }
      ]}
    >
      <View style={{ marginBottom: 12 }}>
        {icon}
      </View>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMain, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
