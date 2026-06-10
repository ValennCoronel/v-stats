import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Users, Calendar, BarChart3, ChevronDown } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';

export default function PartidoScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { activeProfile } = useProfile();
  
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [hasActiveMatch, setHasActiveMatch] = useState(false);

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

      {/* Header */}
      <View style={[styles`px-4`, { paddingTop: 60, paddingBottom: 16, backgroundColor: colors.bgMain }]}>
        <View style={styles`flex-row items-center justify-between`}>
          <View style={{ width: 24 }} /> {/* Spacer */}
          <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain, letterSpacing: 1 }}>
            PARTIDO
          </Text>
          <TouchableOpacity>
            <Calendar size={24} color={colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-5 pt-4 pb-24 gap-6`}>
        
        {/* Decorative Image */}
        <View style={styles`items-center justify-center mb-2 mt-4`}>
          <Image 
            source={imageSource}
            style={{ width: 240, height: 240, resizeMode: 'contain' }}
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
                <TouchableOpacity style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: activeProfile.color || colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: '#FFF' }}>
                        {activeProfile?.clubName?.substring(0, 1) || 'C'}
                      </Text>
                    </View>
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
                <TouchableOpacity style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <Users size={20} color={colors.primary} />
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
                styles`w-full rounded-2xl flex-row items-center justify-center gap-3`,
                { backgroundColor: colors.primary, paddingVertical: 18, elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
              ]}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: '#FFFFFF', letterSpacing: 1, marginTop: 2 }}>
                INICIAR PARTIDO
              </Text>
            </TouchableOpacity>

            {/* Quick Access */}
            <View style={styles`mt-8`}>
              <View style={styles`flex-row items-center justify-center mb-6`}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginHorizontal: 12 }}>
                  ACCESOS RÁPIDOS
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
              </View>

              <View style={styles`flex-row justify-between gap-3`}>
                <QuickAccessCard icon={<Users size={20} color={colors.primary} />} title="Ver jugadores" subtitle="Del equipo" />
                <QuickAccessCard icon={<Calendar size={20} color={colors.primary} />} title="Próximo partido" subtitle="No hay partidos" />
                <QuickAccessCard icon={<BarChart3 size={20} color={colors.primary} />} title="Estadísticas" subtitle="Vista rápida" />
              </View>
            </View>
          </>
        ) : (
          <View>
            {/* Active Match State (Placeholder for now) */}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAccessCard({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  const { colors, fonts } = useStyles();
  
  return (
    <TouchableOpacity 
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
