import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet, Modal, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronRight, Play, Share, Settings, Bell, BarChart3, Trophy, TrendingUp, X, Target, Shield, User, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { matchesService, Match } from '../../src/services/matches.service';
import { statsService, ClubStats } from '../../src/services/stats.service';
import { storage } from '../../src/services/storage.service';

let hasCheckedActiveMatchOnAppStart = false;

export default function HomeScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const { coach, profiles, activeProfile, switchProfile, addTeam, isLoading } = useProfile();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [showSharePlaceholder, setShowSharePlaceholder] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [teamStats, setTeamStats] = useState<ClubStats | null>(null);

  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [showActiveMatchModal, setShowActiveMatchModal] = useState(false);

  const checkActiveMatch = useCallback(async () => {
    const saved = await storage.getItem('vstats-active-match');
    const isFirstCheck = !hasCheckedActiveMatchOnAppStart;
    hasCheckedActiveMatchOnAppStart = true;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveMatch(parsed);
        if (isFirstCheck) {
          setShowActiveMatchModal(true);
        }
      } catch (e) {
        console.error("Error parsing saved match", e);
      }
    } else {
      setActiveMatch(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        checkActiveMatch();
      }
    }, [isAuthenticated, checkActiveMatch])
  );

  useEffect(() => {
    return () => {
      hasCheckedActiveMatchOnAppStart = false;
    };
  }, []);

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
      loadTeamStats(activeProfile.id, activeTeam.id);
    }
  }, [activeTeam, activeProfile.id]);

  const loadTeamStats = async (clubId: string, teamId: string) => {
    if (clubId === '__empty__') return;
    try {
      const res = await statsService.getClubStats(clubId, teamId);
      if (res.data) setTeamStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRecentMatches = async (teamId: string) => {
    const res = await matchesService.getMatches(teamId, 'finished');
    if (res.data?.matches) {
      setRecentMatches(res.data.matches.slice(0, 3)); // Only show top 3
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  if (!isAuthenticated) {
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

  const activeTeamMatches = activeTeam?.matches || [];
  const winsCount = activeTeamMatches.filter(m => m.result === 'WIN').length;
  const lossesCount = activeTeamMatches.filter(m => m.result === 'LOSS').length;
  const totalMatchesCount = activeTeamMatches.length;
  const winRatePercent = totalMatchesCount > 0 ? Math.round((winsCount / totalMatchesCount) * 100) : 0;

  const attacks = teamStats?.attacks || 0;
  const attackErrors = teamStats?.attackErrors || 0;
  const attackEff = teamStats ? Math.round((attacks / Math.max(attacks + attackErrors, 1)) * 100) : 0;

  const defenses = teamStats?.defenses || 0;
  const receptionErrors = teamStats?.receptionErrors || 0;
  const receptionEff = teamStats ? Math.round((defenses / Math.max(defenses + receptionErrors, 1)) * 100) : 0;

  const aces = teamStats?.aces || 0;
  const serveErrors = teamStats?.serveErrors || 0;
  const serveEff = teamStats ? Math.round((aces / Math.max(aces + serveErrors, 1)) * 100) : 0;

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles`px-4 pb-24 gap-6`}>
        {/* ── Header ── */}
        <View style={{ paddingTop: 24, paddingBottom: 24 }}>
          <View style={styles`flex-row items-center justify-between`}>
            <View style={styles`flex-row items-center gap-3`}>
              <TouchableOpacity onPress={() => router.push('/manage-settings')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: '#FFFFFF', marginTop: 2 }}>{initials}</Text>
              </TouchableOpacity>
              <View>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>¡Bienvenido, <Text style={{ fontFamily: fonts.bodyBold, color: colors.textMain }}>{firstName}</Text>!</Text>
                <TouchableOpacity 
                  style={styles`flex-row items-center gap-1 mt-0.5`}
                  onPress={() => setShowClubSelector(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMain }}>{activeProfile?.clubName || 'Mi Club'}</Text>
                  <ChevronDown size={16} color={colors.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {/* ── Active Match Resuming Banner ── */}
        {activeMatch && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: '/match/new',
                params: { resume: 'true' }
              });
            }}
            style={{ 
              backgroundColor: 'rgba(30,111,217,0.08)', 
              borderColor: '#1E6FD9', 
              borderWidth: 1.5, 
              borderRadius: 16, 
              padding: 16, 
              marginBottom: 8, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(30,111,217,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>🏐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#1E6FD9', letterSpacing: 0.5 }}>
                  PARTIDO EN CURSO
                </Text>
                <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: '#0D1F33', marginTop: 2 }} numberOfLines={1}>
                  vs {activeMatch.metadata?.rival || "Rival"}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Set {activeMatch.currentSet} · {activeMatch.homeScore} - {activeMatch.awayScore}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#1E6FD9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff', letterSpacing: 0.5 }}>
                REANUDAR
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Equipo Activo Card ── */}
        <LinearGradient 
          colors={['#E0F2FE', '#BAE6FD']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 8 }}
        >
          <View style={{ padding: 16 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: '#64748B', letterSpacing: 1, marginBottom: 4 }}>
              EQUIPO ACTIVO
            </Text>
            <TouchableOpacity 
              style={styles`flex-row items-center gap-2 mb-1`}
              onPress={() => setShowTeamSelector(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: '#0D1F33', letterSpacing: 0.5 }}>
                {activeTeam?.name || 'Sin equipo'}
              </Text>
              <View style={{ backgroundColor: '#1E6FD9', borderRadius: 6, padding: 4, marginLeft: 4 }}>
                <ChevronDown size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: '#475569', marginBottom: 20 }}>
              Vóley Femenino · Primera
            </Text>

            <View style={styles`flex-row justify-between mb-4`}>
              {/* Partidos */}
              <View style={[styles`items-center`, { flex: 1 }]}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{totalMatchesCount}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>PARTIDOS</Text>
              </View>
              
              {/* Divider */}
              <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />

              {/* Victorias */}
              <View style={[styles`items-center`, { flex: 1 }]}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{winsCount}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>VICTORIAS</Text>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />

              {/* Derrotas */}
              <View style={[styles`items-center`, { flex: 1 }]}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{lossesCount}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>DERROTAS</Text>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', height: '70%', alignSelf: 'center' }} />

              {/* Efectividad */}
              <View style={[styles`items-center`, { flex: 1 }]}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#0D1F33' }}>{winRatePercent}%</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: '#475569', letterSpacing: 0.5, marginTop: 2 }}>EFECTIVIDAD</Text>
              </View>
            </View>

            {/* Botón Ver Análisis Completo */}
            <TouchableOpacity 
              onPress={() => router.push('/stats/general')} 
              activeOpacity={0.8}
              style={{ width: '100%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#93C5FD', backgroundColor: 'rgba(255, 255, 255, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <BarChart3 size={16} color="#1E6FD9" />
              <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: '#1E6FD9', letterSpacing: 0.5, marginTop: 2 }}>VER ANÁLISIS COMPLETO</Text>
              <View style={{ position: 'absolute', right: 16 }}>
                <ChevronRight size={18} color="#1E6FD9" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        {/* ── Main CTA ── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/partido')}
          activeOpacity={0.8}
          style={[
            styles`w-full flex-row items-center justify-center gap-2`,
            { marginTop: 16, marginBottom: 32, borderRadius: 12, backgroundColor: '#1C64F2', paddingVertical: 14, elevation: 4, shadowColor: '#1C64F2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
          ]}
        >
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <Play size={12} color="#1C64F2" fill="#1C64F2" style={{ marginLeft: 2 }} />
          </View>
          <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 1 }}>
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

        {/* ── Resumen del equipo ── */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, letterSpacing: 1, marginBottom: 12 }}>
            RESUMEN DEL EQUIPO
          </Text>
          <View style={styles`flex-row justify-between gap-2`}>
            {/* Ataque */}
            <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30, 111, 217, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <TrendingUp size={18} color="#1E6FD9" />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{attackEff}%</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>ATAQUE</Text>
            </View>

            {/* Recepcion */}
            <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(22, 163, 74, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Shield size={18} color="#16A34A" />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{receptionEff}%</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>RECEPCIÓN</Text>
            </View>

            {/* Saque */}
            <View style={[styles`flex-1 bg-white rounded-2xl items-center py-4 px-1`, { borderWidth: 1, borderColor: colors.borderLight, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Target size={18} color="#F59E0B" />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>{serveEff}%</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, marginTop: 2 }}>SAQUE</Text>
            </View>
          </View>
        </View>

        {/* ── Compartir ── */}
        <TouchableOpacity
          onPress={() => setShowSharePlaceholder(true)}
          style={{ width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 }}
        >
          <Share size={18} color={colors.primary} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            COMPARTIR ESTADÍSTICAS
          </Text>
        </TouchableOpacity>

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

      {/* ── Active Match Resuming Modal ── */}
      <Modal visible={showActiveMatchModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏐</Text>
            <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 8, textAlign: 'center' }}>
              Partido en Curso
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              Tenés un partido sin finalizar contra:
            </Text>
            
            {activeMatch && (
              <View style={{ backgroundColor: colors.bgMain, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.primary }}>
                  {activeMatch.metadata?.rival || "Rival"}
                </Text>
                {activeMatch.metadata?.torneo ? (
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {activeMatch.metadata.torneo}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
                    Set {activeMatch.currentSet}
                  </Text>
                  <Text style={{ color: colors.border }}>|</Text>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
                    Marcador: {activeMatch.homeScore} - {activeMatch.awayScore}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity 
                onPress={() => {
                  setShowActiveMatchModal(false);
                  router.push({
                    pathname: '/match/new',
                    params: { resume: 'true' }
                  });
                }} 
                style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>
                  VOLVER AL PARTIDO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setShowActiveMatchModal(false)} 
                style={{ borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
                  CONTINUAR NAVEGANDO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    "Eliminar partido",
                    "¿Estás seguro de que querés eliminar el partido en curso? Se perderá todo el progreso.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { 
                        text: "Eliminar", 
                        style: "destructive",
                        onPress: async () => {
                          await storage.removeItem('vstats-active-match');
                          setShowActiveMatchModal(false);
                          setActiveMatch(null);
                        }
                      }
                    ]
                  );
                }} 
                style={{ paddingVertical: 8, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.danger }}>
                  Eliminar partido en curso
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}