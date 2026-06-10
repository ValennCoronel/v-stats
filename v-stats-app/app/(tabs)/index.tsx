import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Play, Share, Settings, Bell, BarChart3 } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { matchesService, Match } from '../../src/services/matches.service';

export default function HomeScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { coach, profiles, activeProfile, switchProfile, addTeam, isLoading } = useProfile();
  
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [showSharePlaceholder, setShowSharePlaceholder] = useState(false);

  // Auto-select first team if available
  useEffect(() => {
    if (activeProfile?.teams && activeProfile.teams.length > 0 && !activeTeamId) {
      setActiveTeamId(activeProfile.teams[0].id);
    }
  }, [activeProfile, activeTeamId]);

  const activeTeam = activeProfile?.teams?.find(t => t.id === activeTeamId) || activeProfile?.teams?.[0];

  useEffect(() => {
    if (activeTeam) {
      loadRecentMatches(activeTeam.id);
    }
  }, [activeTeam]);

  const loadRecentMatches = async (teamId: string) => {
    const res = await matchesService.getMatches(teamId, 'finished');
    if (res.data?.matches) {
      setRecentMatches(res.data.matches.slice(0, 3)); // Only show top 3
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.replace('/');
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary, marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstName = coach.name.split(' ')[0];

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={[styles`px-4`, { paddingTop: 60, paddingBottom: 24, backgroundColor: colors.bgMain }]}>
        <View style={styles`flex-row items-center justify-between`}>
          <View style={styles`flex-row items-center gap-3`}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: '#FFFFFF', marginTop: 2 }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>¡Bienvenido, <Text style={{ fontFamily: fonts.bodyBold, color: colors.textMain }}>{firstName}</Text>!</Text>
              <TouchableOpacity style={styles`flex-row items-center gap-1 mt-0.5`}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMain }}>{activeProfile?.clubName || 'Mi Club'}</Text>
                <ChevronDown size={16} color={colors.textMain} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/club')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSurface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
            <Settings size={20} color={colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pb-24 gap-6`}>

        {/* ── Equipo Activo Card ── */}
        <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: colors.primary, position: 'relative' }}>
          {/* Watermark */}
          <Image 
            source={require('../../assets/volleyball-watermark.png')}
            style={{ position: 'absolute', right: -40, top: -20, width: 250, height: 250, opacity: 0.2, resizeMode: 'contain' }}
          />
          <View style={{ padding: 20 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 }}>
              EQUIPO ACTIVO
            </Text>
            <TouchableOpacity style={styles`flex-row items-center gap-2 mb-1`}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 32, color: '#FFFFFF', letterSpacing: 1 }}>
                {activeTeam?.name || 'Sin equipo'}
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: 4 }}>
                <ChevronDown size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
              Vóley Femenino · Primera
            </Text>

            <View style={styles`flex-row justify-between mb-6`}>
              <View style={styles`items-center`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: '#FFFFFF' }}>12</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>PARTIDOS</Text>
              </View>
              <View style={styles`items-center`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: '#FFFFFF' }}>8</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>VICTORIAS</Text>
              </View>
              <View style={styles`items-center`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: '#FFFFFF' }}>4</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>DERROTAS</Text>
              </View>
              <View style={styles`items-center`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: '#FFFFFF' }}>67%</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>EFECTIVIDAD</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push(`/stats/${activeTeam?.id}`)}
              style={{ width: '100%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <BarChart3 size={16} color="#FFFFFF" />
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ver análisis completo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main CTA ── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/partido')}
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

        {/* ── Últimos Resultados ── */}
        <View>
          <View style={styles`flex-row items-center justify-between mb-3`}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, letterSpacing: 1 }}>
              ÚLTIMOS RESULTADOS
            </Text>
            <TouchableOpacity onPress={() => router.push(`/team/${activeTeam?.id}`)}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary, letterSpacing: 0.5 }}>
                VER TODOS
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles`rounded-2xl border bg-surface overflow-hidden`, { borderColor: colors.borderLight }]}>
            {recentMatches.length > 0 ? (
              recentMatches.map((match, idx) => {
                const isWin = match.result === 'WIN';
                const setsWon = match.setScores?.filter((s: any) => s.teamPts > s.oppPts).length || 0;
                const setsLost = match.setScores?.filter((s: any) => s.oppPts > s.teamPts).length || 0;
                
                return (
                  <View key={match.id} style={[{ padding: 16, flexDirection: 'row', alignItems: 'center' }, idx !== recentMatches.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isWin ? colors.success : colors.danger, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: '#FFF', marginTop: 1 }}>{isWin ? 'V' : 'D'}</Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMain }}>{activeTeam?.name}</Text>
                    <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain, marginHorizontal: 16 }}>{setsWon} - {setsLost}</Text>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMain }} numberOfLines={1}>{match.opponentTeam?.name || match.opponent}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{new Date(match.date).toLocaleDateString('es-AR')}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted }}>No hay partidos recientes</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Compartir ── */}
        <TouchableOpacity
          onPress={() => setShowSharePlaceholder(true)}
          style={{ width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}
        >
          <Share size={18} color={colors.primary} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            COMPARTIR ESTADÍSTICAS
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Placeholder Modal for Share */}
      {showSharePlaceholder && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 }]}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Share size={32} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, marginBottom: 8 }}>Próximamente</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              Esta funcionalidad aún no está disponible, pero lo estará próximamente. Vas a poder compartir el dashboard público con tu equipo.
            </Text>
            <TouchableOpacity onPress={() => setShowSharePlaceholder(false)} style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: '#FFF' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}