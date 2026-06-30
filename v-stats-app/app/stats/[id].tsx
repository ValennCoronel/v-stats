import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share as NativeShare, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, Award, BarChart3, Building2, Share2, Shield, Target, TrendingUp, Zap } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useStyles } from '../../src/hooks/useStyles';
import { useProfile } from '../../src/context/ProfileContext';
import { ClubStats, statsService } from '../../src/services/stats.service';
import { shareLinksService } from '../../src/services/share-links.service';
import { ShareStatsModal } from '../../src/features/home/components/HomeModals';

const POSITIONS = [
  { id: 'SETTER', label: 'Armador' },
  { id: 'OUTSIDE_HITTER', label: 'Punta' },
  { id: 'OPPOSITE_HITTER', label: 'Opuesto' },
  { id: 'MIDDLE_BLOCKER', label: 'Central' },
  { id: 'LIBERO', label: 'Líbero' },
];

const getPositionLabel = (pos: string) => POSITIONS.find((p) => p.id === pos)?.label || pos;

const getEfficiencyColor = (value: number) => {
  if (value >= 65) return '#16A34A';
  if (value >= 55) return '#F59E0B';
  return '#EF4444';
};

export default function StatsScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  const { activeProfile } = useProfile();

  const [stats, setStats] = useState<ClubStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [playerViewMode, setPlayerViewMode] = useState<'general' | 'recent'>('general');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const selectedTeam = stats?.selectedTeam || null;

  useEffect(() => {
    loadStats();
  }, [activeProfile.id, selectedTeamId]);

  useEffect(() => {
    setShowAllPlayers(false);
  }, [selectedTeamId, playerViewMode]);

  const loadStats = async () => {
    if (activeProfile.id === '__empty__') return;
    setIsLoading(true);
    const res = await statsService.getClubStats(activeProfile.id, selectedTeamId || undefined);
    if (res.data) setStats(res.data);
    setIsLoading(false);
  };

  const openShareSheet = useCallback(async (url: string, teamName?: string) => {
    const message = teamName
      ? `Mira las estadisticas de ${teamName} en V-Stats: ${url}`
      : `Mira estas estadisticas de V-Stats: ${url}`;

    if (Platform.OS === 'web') {
      const browserNavigator = typeof navigator !== 'undefined' ? navigator : undefined;
      if (browserNavigator?.share) {
        await browserNavigator.share({ title: teamName || 'Estadisticas V-Stats', text: message, url });
        return;
      }

      if (browserNavigator?.clipboard?.writeText) {
        await browserNavigator.clipboard.writeText(url);
        Alert.alert('Link copiado', 'Copiamos el link publico para que puedas pegarlo y enviarlo.');
        return;
      }

      Alert.alert('Link listo', url);
      return;
    }

    await NativeShare.share({
      title: teamName || 'Estadisticas V-Stats',
      message,
      url,
    });
  }, []);

  const handleShareStats = useCallback(async () => {
    if (!selectedTeam || activeProfile.id === '__empty__') {
      Alert.alert('Selecciona un equipo', 'Para generar un link publico primero elige un equipo en esta pantalla.');
      return;
    }

    setShowShareModal(true);
    setShareError(null);
    setShareUrl(null);
    setIsCreatingShareLink(true);

    try {
      const response = await shareLinksService.createTeamShareLink(activeProfile.id, selectedTeam.id);
      if (!response.data?.shareLink?.url) {
        const nextError = response.error || 'No se pudo generar el link. Intenta nuevamente en unos segundos.';
        setShareError(nextError);
        Alert.alert('No se pudo crear el link', nextError);
        return;
      }

      const nextUrl = response.data.shareLink.url;
      setShareUrl(nextUrl);
      await openShareSheet(nextUrl, selectedTeam.name);
    } catch (error) {
      console.error('Share error', error);
      setShareError('El link se genero, pero no se pudo abrir el menu para compartir. Puedes copiarlo desde esta ventana.');
      Alert.alert('Link creado', 'El link se genero correctamente. Puedes copiarlo desde esta ventana.');
    } finally {
      setIsCreatingShareLink(false);
    }
  }, [activeProfile.id, openShareSheet, selectedTeam]);

  if (isLoading) {
    return (
      <View style={styles`flex-1 bg-screen justify-center items-center`}>
        <ActivityIndicator size="large" color="#1E6FD9" />
      </View>
    );
  }

  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;
  const setsWon = stats?.setsWon || 0;
  const setsLost = stats?.setsLost || 0;
  const totalPoints = stats?.totalPoints || 0;
  const players = stats?.topScorers || [];
  const teamBreakdown = stats?.teamBreakdown || [];
  const scopeLabel = stats?.selectedTeam?.name || 'Todo el club';

  const sortedByPoints = [...players].sort((a, b) => b.puntos - a.puntos);
  const topScorer = sortedByPoints[0];
  const sortedByParticipation = [...players].sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.puntos - a.puntos);
  const sortedByRecent = [...players].sort(
    (a, b) =>
      b.recentMatchesPlayed - a.recentMatchesPlayed ||
      b.recentPuntos - a.recentPuntos ||
      b.recentEficiencia - a.recentEficiencia ||
      b.puntos - a.puntos
  );
  const playerList = playerViewMode === 'general' ? sortedByParticipation : sortedByRecent;
  const displayedPlayers = showAllPlayers ? playerList : playerList.slice(0, 5);
  const topBlocker = [...players].sort((a, b) => b.bloqueos - a.bloqueos)[0];
  const topDefense = [...players].sort((a, b) => b.recepciones - a.recepciones)[0];
  const setsRate = Math.round((setsWon / Math.max(setsWon + setsLost, 1)) * 100);

  const actionMetrics = [
    { label: 'ATAQUES', value: stats?.attacks || 0, color: '#1E6FD9', icon: <TrendingUp size={16} color="#1E6FD9" /> },
    { label: 'DEFENSAS', value: stats?.defenses || 0, color: '#16A34A', icon: <Shield size={16} color="#16A34A" /> },
    { label: 'BLOQUEOS', value: stats?.blocks || 0, color: '#7C3AED', icon: <Shield size={16} color="#7C3AED" /> },
    { label: 'ACES', value: stats?.aces || 0, color: '#F59E0B', icon: <Zap size={16} color="#F59E0B" /> },
  ];

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      <View style={[styles`bg-header px-4 pb-6`, { paddingTop: 60 }]}>
        <View style={styles`flex-row items-center gap-3 mb-5`}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={16} color="#fff" />
          </TouchableOpacity>
          <View style={styles`flex-1`}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>ESTADISTICAS</Text>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 26 }}>{activeProfile.clubName}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{scopeLabel}</Text>
          </View>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: activeProfile.color }} />
        </View>

        <View style={styles`flex-row justify-between gap-1`}>
          {[
            { label: 'PARTIDOS', value: totalMatches, color: '#fff' },
            { label: 'GANADOS', value: wins, color: '#4ADE80' },
            { label: 'PERDIDOS', value: losses, color: '#F87171' },
            { label: 'EFECT.', value: `${winRate}%`, color: '#3D8EF5' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[styles`w-1/4 rounded-xl py-3 items-center`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>{value}</Text>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 9, letterSpacing: 0.8, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pt-5 pb-8 gap-5`}>
        {teamBreakdown.length > 0 && (
          <View>
            <SectionTitle icon={<Building2 size={16} color="#64748B" />} label="DRILL DOWN POR EQUIPO" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              <TeamFilterChip
                label="Todo el club"
                subLabel={`${teamBreakdown.reduce((sum, team) => sum + team.matches, 0)} partidos`}
                active={!selectedTeamId}
                color={activeProfile.color}
                onPress={() => setSelectedTeamId(null)}
              />
              {teamBreakdown.map((team) => (
                <TeamFilterChip
                  key={team.id}
                  label={team.name}
                  subLabel={`${team.wins}-${team.losses} - ${team.winRate}%`}
                  active={selectedTeamId === team.id}
                  color={activeProfile.color}
                  onPress={() => setSelectedTeamId(team.id)}
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShareStats}
              style={{
                width: '100%',
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selectedTeam ? activeProfile.color : '#CBD5E1',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                marginTop: 16,
                backgroundColor: '#FFFFFF',
                opacity: selectedTeam ? 1 : 0.75,
              }}
            >
              <Share2 size={16} color={selectedTeam ? activeProfile.color : '#94A3B8'} />
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '600', color: selectedTeam ? activeProfile.color : '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {selectedTeam ? 'Compartir estadisticas' : 'Selecciona un equipo para compartir'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View>
          <SectionTitle icon={<Target size={16} color="#64748B" />} label="TEMPORADA" />
          <View style={[styles`bg-white px-4 py-4 rounded-xl`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles`flex-row justify-between items-center`}>
              <SeasonKpi label="SETS WON" value={setsWon} detail={`de ${setsWon + setsLost}`} color="#1E6FD9" />
              <SeasonKpi label="PUNTOS" value={totalPoints} detail="en total" color="#0D1F33" border />
              <SeasonKpi label="SETS %" value={`${setsRate}%`} detail="efectividad" color="#16A34A" />
            </View>
          </View>
        </View>

        <View>
          <SectionTitle icon={<Activity size={16} color="#64748B" />} label="ACCIONES DEL EQUIPO" />
          <View style={styles`flex-row flex-wrap justify-between`}>
            {actionMetrics.map((metric) => (
              <View key={metric.label} style={[styles`bg-white p-3 rounded-xl mb-3`, { width: '48%', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
                <View style={styles`flex-row items-center justify-between mb-3`}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${metric.color}18`, justifyContent: 'center', alignItems: 'center' }}>
                    {metric.icon}
                  </View>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: metric.color, lineHeight: 24 }}>{metric.value}</Text>
                </View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, letterSpacing: 1, color: '#64748B', fontWeight: '600' }}>{metric.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles`bg-white rounded-xl p-4 mt-1`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles`flex-row justify-between items-center`}>
              <ActionKpi label="ACC/PUNTO" value={stats?.avgActionsPerPoint || 0} color={activeProfile.color} />
              <ActionKpi label="PTS/PART" value={stats?.pointsPerMatch || 0} color="#0D1F33" />
              <ActionKpi label="ERRORES" value={stats?.errors || 0} color="#EF4444" />
            </View>
          </View>
        </View>

        {topScorer && (
          <View>
            <SectionTitle icon={<Award size={16} color="#64748B" />} label="LIDERES DE TEMPORADA" />
            <View style={styles`flex-row justify-between gap-2`}>
              {[
                { label: 'PUNTOS', player: topScorer, value: topScorer?.puntos, icon: <TrendingUp size={16} color="#1E6FD9" />, color: '#1E6FD9' },
                { label: 'BLOQUEOS', player: topBlocker, value: topBlocker?.bloqueos, icon: <Shield size={16} color="#7C3AED" />, color: '#7C3AED' },
                { label: 'DEFENSAS', player: topDefense, value: topDefense?.recepciones, icon: <Target size={16} color="#16A34A" />, color: '#16A34A' },
              ].map(({ label, player, value, icon, color }) => (
                <View key={label} style={[styles`w-1/3 bg-white p-3 items-center rounded-xl`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${color}18`, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                    {icon}
                  </View>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 9, letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>{value}</Text>
                  <Text style={{ fontSize: 10, color: '#0D1F33', marginTop: 4, fontWeight: '500' }} numberOfLines={1}>{player?.name?.split(' ')[0] ?? '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sortedByParticipation.length > 0 && (
          <View>
            <View style={styles`flex-row items-center justify-between gap-3 mb-3`}>
              <SectionTitle icon={<BarChart3 size={16} color="#64748B" />} label={selectedTeamId ? 'JUGADORES DEL EQUIPO' : 'JUGADORES DEL CLUB'} />
              <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 9999, padding: 4 }}>
                <SegmentedPill label="General" active={playerViewMode === 'general'} color={activeProfile.color} onPress={() => setPlayerViewMode('general')} />
                <SegmentedPill label="Ultimos" active={playerViewMode === 'recent'} color={activeProfile.color} onPress={() => setPlayerViewMode('recent')} />
              </View>
            </View>

            <View style={styles`gap-2`}>
              {displayedPlayers.map((player, idx) => {
                const initials = player.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                const isRecentMode = playerViewMode === 'recent';
                const efficiencyColor = getEfficiencyColor(player.eficiencia);
                const recentEfficiencyColor = getEfficiencyColor(player.recentEficiencia);

                return (
                  <TouchableOpacity
                    key={player.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/player-stats/${player.id}${selectedTeamId ? `?teamId=${selectedTeamId}` : ''}`)}
                    style={[styles`bg-white rounded-xl overflow-hidden`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}
                  >
                    <View style={styles`flex-row items-center gap-3 px-4 py-3`}>
                      <MedalIcon rank={idx + 1} />
                      {idx >= 3 && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F4F7FB', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 10, color: '#94A3B8', fontWeight: '600' }}>{idx + 1}</Text>
                        </View>
                      )}
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 13, fontWeight: '700', color: '#fff' }}>{initials}</Text>
                      </View>
                      <View style={styles`flex-1 min-w-0`}>
                        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#0D1F33' }} numberOfLines={1}>
                          #{player.number} {player.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                          {isRecentMode
                            ? `${player.recentMatchesPlayed} ultimos partidos · ${player.recentWins}-${player.recentLosses}`
                            : `${player.matchesPlayed} ${player.matchesPlayed === 1 ? 'partido' : 'partidos'} · ${getPositionLabel(player.position)}`}
                        </Text>
                      </View>
                      <View style={styles`flex-row gap-4 flex-shrink-0`}>
                        {isRecentMode ? (
                          <>
                            <StatKpi label="PTS" value={player.recentPuntos} color="#1E6FD9" />
                            <StatKpi label="EFC" value={player.recentEficiencia} unit="%" color={recentEfficiencyColor} />
                            <StatKpi label="ERR" value={player.recentErrores} color="#EF4444" />
                          </>
                        ) : (
                          <>
                            <StatKpi label="PTS" value={player.puntos} color="#1E6FD9" />
                            <StatKpi label="EFC" value={player.eficiencia} unit="%" color={efficiencyColor} />
                            <StatKpi label="BLQ" value={player.bloqueos} color="#7C3AED" />
                          </>
                        )}
                      </View>
                    </View>

                    <View style={styles`h-1 mx-4 mb-2 bg-screen rounded-full overflow-hidden`}>
                      <View
                        style={{
                          height: '100%',
                          borderRadius: 9999,
                          width: `${isRecentMode ? player.recentEficiencia : player.eficiencia}%`,
                          backgroundColor: isRecentMode ? recentEfficiencyColor : efficiencyColor,
                        }}
                      />
                    </View>

                    {isRecentMode && player.recentForm.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
                        {player.recentForm.map((match) => (
                          <RecentMatchChip key={match.matchId} match={match} />
                        ))}
                      </ScrollView>
                    )}
                  </TouchableOpacity>
                );
              })}

              {playerList.length > 5 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAllPlayers(!showAllPlayers)}
                  style={{ marginTop: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', paddingBottom: 24 }}
                >
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '600', color: '#1E6FD9' }}>
                    {showAllPlayers ? 'VER MENOS' : `VER ${playerList.length - 5} MAS`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {totalMatches === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
              Aun no hay partidos finalizados.{'\n'}Las estadisticas apareceran despues del primer partido.
            </Text>
          </View>
        )}
      </ScrollView>

      <ShareStatsModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareError(null);
        }}
        teamName={selectedTeam?.name}
        shareUrl={shareUrl}
        isLoading={isCreatingShareLink}
        errorMessage={shareError}
        onShareAgain={() => shareUrl && selectedTeam ? openShareSheet(shareUrl, selectedTeam.name) : handleShareStats()}
      />
    </View>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 2 }}>
      {icon}
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function TeamFilterChip({ label, subLabel, active, color, onPress }: { label: string; subLabel: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        minWidth: 132,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: active ? color : '#fff',
        borderWidth: 1,
        borderColor: active ? color : '#E2E8F0',
      }}
    >
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '700', color: active ? '#fff' : '#0D1F33' }} numberOfLines={1}>{label}</Text>
      <Text style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.72)' : '#64748B', marginTop: 2 }} numberOfLines={1}>{subLabel}</Text>
    </TouchableOpacity>
  );
}

function SegmentedPill({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 9999,
        backgroundColor: active ? color : 'transparent',
      }}
    >
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#475569' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ActionKpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 10, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 26, fontWeight: '700', color, lineHeight: 26 }}>{value}</Text>
    </View>
  );
}

function StatKpi({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>
        {value}{unit && <Text style={{ fontSize: 13, fontWeight: '500' }}>{unit}</Text>}
      </Text>
    </View>
  );
}

function SeasonKpi({ label, value, detail, color, border }: { label: string; value: number | string; detail: string; color: string; border?: boolean }) {
  return (
    <View style={[{ flex: 1, alignItems: 'center' }, border ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F4F7FB' } : null]}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 28, fontWeight: '700', color, lineHeight: 28 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{detail}</Text>
    </View>
  );
}

function MedalIcon({ rank }: { rank: number }) {
  const colors = ['#F59E0B', '#94A3B8', '#D97706'];
  if (rank > 3) return null;
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors[rank - 1], justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{rank}</Text>
    </View>
  );
}

function RecentMatchChip({
  match,
}: {
  match: {
    opponent: string;
    date: string;
    result: string | null;
    puntos: number;
    eficiencia: number;
  };
}) {
  const won = match.result === 'WIN';

  return (
    <View
      style={{
        minWidth: 112,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: won ? '#F0FDF4' : '#FFF7ED',
      }}
    >
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 10, fontWeight: '700', color: won ? '#16A34A' : '#D97706' }}>
        {won ? 'WIN' : 'MATCH'}
      </Text>
      <Text style={{ fontSize: 12, color: '#0D1F33', marginTop: 2 }} numberOfLines={1}>
        vs {match.opponent}
      </Text>
      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
        {new Date(match.date).toLocaleDateString('es-AR')}
      </Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '700', color: '#0D1F33', marginTop: 6 }}>
        {match.puntos} pts · {match.eficiencia}%
      </Text>
    </View>
  );
}
