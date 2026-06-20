import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, ArrowLeft, Award, BarChart3, Building2, Home, Shield, Target, TrendingUp, Zap } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useStyles } from '../../src/hooks/useStyles';
import { useProfile } from '../../src/context/ProfileContext';
import { PlayerStats, statsService } from '../../src/services/stats.service';

const POSITIONS = [
  { id: 'SETTER', label: 'Armador' },
  { id: 'OUTSIDE_HITTER', label: 'Punta' },
  { id: 'OPPOSITE_HITTER', label: 'Opuesto' },
  { id: 'MIDDLE_BLOCKER', label: 'Central' },
  { id: 'LIBERO', label: 'Líbero' },
];

const getPositionLabel = (pos: string) => POSITIONS.find(p => p.id === pos)?.label || pos;

const getInitials = (name?: string) =>
  name?.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || '??';

const getEfficiencyColor = (value: number) => {
  if (value >= 65) return '#16A34A';
  if (value >= 55) return '#F59E0B';
  return '#EF4444';
};

export default function PlayerStatsScreen() {
  const router = useRouter();
  const { id, teamId } = useLocalSearchParams<{ id: string; teamId?: string }>();
  const { styles } = useStyles();
  const { activeProfile } = useProfile();

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerStats();
  }, [activeProfile.id, id, teamId]);

  const loadPlayerStats = async () => {
    if (!id || activeProfile.id === '__empty__') return;
    setIsLoading(true);
    setError(null);

    const res = await statsService.getPlayerStats(activeProfile.id, id, teamId);
    if (res.data) {
      setStats(res.data);
    } else {
      setError(res.error || 'No se pudieron cargar las estadísticas del jugador.');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles`flex-1 bg-screen justify-center items-center`}>
        <ActivityIndicator size="large" color="#1E6FD9" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles`flex-1 bg-screen`}>
        <StatusBar style="light" />
        <View style={[styles`bg-header px-4 pb-6`, { paddingTop: 60 }]}>
          <View style={styles`flex-row items-center gap-3`}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}
            >
              <ArrowLeft size={16} color="#fff" />
            </TouchableOpacity>
            <View style={styles`flex-1`}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>ESTADÍSTICAS</Text>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#fff' }}>Jugador</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>{error || 'No hay datos disponibles.'}</Text>
        </View>
      </View>
    );
  }

  const { player, totals } = stats;
  const scopeLabel = stats.selectedTeam?.name || (player.teams.length > 0 ? player.teams.map((team) => team.name).join(' · ') : activeProfile.clubName);
  const efficiencyColor = getEfficiencyColor(stats.efficiency);
  const setsRate = Math.round((stats.setsWon / Math.max(stats.setsWon + stats.setsLost, 1)) * 100);

  const actionMetrics = [
    { label: 'PUNTOS', value: totals.puntos, color: '#1E6FD9', icon: <Target size={16} color="#1E6FD9" /> },
    { label: 'ATAQUES', value: totals.ataques, color: '#0EA5E9', icon: <TrendingUp size={16} color="#0EA5E9" /> },
    { label: 'BLOQUEOS', value: totals.bloqueos, color: '#7C3AED', icon: <Shield size={16} color="#7C3AED" /> },
    { label: 'ACES', value: totals.aces, color: '#F59E0B', icon: <Zap size={16} color="#F59E0B" /> },
    { label: 'DEFENSAS', value: totals.defensas, color: '#16A34A', icon: <Shield size={16} color="#16A34A" /> },
    { label: 'RECEPCIONES', value: totals.ventajas, color: '#14B8A6', icon: <Activity size={16} color="#14B8A6" /> },
  ];

  const errorMetrics = [
    { label: 'Ataque', value: totals.erroresAtaque },
    { label: 'Recepción', value: totals.erroresRecepcion },
    { label: 'Saque', value: totals.erroresSaque },
    { label: 'Bloqueo', value: totals.bloqueosErrados },
    { label: 'Tácticos', value: totals.erroresTacticos },
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

          <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 17, fontWeight: '700', color: '#fff' }}>{getInitials(player.name)}</Text>
          </View>

          <View style={styles`flex-1 min-w-0`}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>PERFIL ESTADÍSTICO</Text>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 23, fontWeight: '700', color: '#fff', lineHeight: 27 }} numberOfLines={1}>#{player.number} {player.name}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }} numberOfLines={1}>{getPositionLabel(player.position)} · {scopeLabel}</Text>
          </View>
        </View>

        <View style={styles`flex-row justify-between gap-1`}>
          {[
            { label: 'PARTIDOS', value: stats.totalMatches, color: '#fff' },
            { label: 'PUNTOS', value: totals.puntos, color: '#3D8EF5' },
            { label: 'EFECT.', value: `${stats.efficiency}%`, color: efficiencyColor },
            { label: 'ERRORES', value: stats.negativeActions, color: '#F87171' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[styles`w-1/4 rounded-xl py-3 items-center`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 21, fontWeight: '700', color, lineHeight: 22 }}>{value}</Text>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 9, letterSpacing: 0.8, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pt-5 pb-24 gap-5`}>
        <View>
          <SectionTitle icon={<Award size={16} color="#64748B" />} label="RESUMEN COMPETITIVO" />
          <View style={[styles`bg-white rounded-xl p-4`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles`flex-row justify-between items-center`}>
              <SummaryKpi label="RÉCORD" value={`${stats.wins}-${stats.losses}`} detail={`${stats.winRate}% victorias`} color="#0D1F33" />
              <SummaryKpi label="PTS/PART" value={stats.pointsPerMatch} detail="promedio" color="#1E6FD9" border />
              <SummaryKpi label="SETS %" value={`${setsRate}%`} detail={`${stats.setsWon}-${stats.setsLost}`} color="#16A34A" />
            </View>
          </View>
        </View>

        <View>
          <SectionTitle icon={<Activity size={16} color="#64748B" />} label="ACCIONES REGISTRADAS" />
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
        </View>

        <View>
          <SectionTitle icon={<Target size={16} color="#64748B" />} label="EFICIENCIA" />
          <View style={[styles`bg-white rounded-xl p-4`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles`flex-row justify-between mb-3`}>
              <ActionKpi label="POSITIVAS" value={stats.positiveActions} color="#16A34A" />
              <ActionKpi label="NEGATIVAS" value={stats.negativeActions} color="#EF4444" />
              <ActionKpi label="ACC/PART" value={stats.actionsPerMatch} color={activeProfile.color} />
            </View>
            <View style={styles`h-2 bg-screen rounded-full overflow-hidden`}>
              <View style={{ height: '100%', borderRadius: 9999, width: `${stats.efficiency}%`, backgroundColor: efficiencyColor }} />
            </View>
          </View>
        </View>

        <View>
          <SectionTitle icon={<Shield size={16} color="#64748B" />} label="DESGLOSE DE ERRORES" />
          <View style={[styles`bg-white rounded-xl p-4`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            {errorMetrics.map((metric, index) => (
              <View key={metric.label} style={[styles`flex-row justify-between items-center py-2`, index < errorMetrics.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F4F7FB' } : null]}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>{metric.label}</Text>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: metric.value > 0 ? '#EF4444' : '#94A3B8' }}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionTitle icon={<BarChart3 size={16} color="#64748B" />} label="HISTORIAL POR PARTIDO" />
          {stats.matchTimeline.length > 0 ? (
            <View style={styles`gap-2`}>
              {stats.matchTimeline.map((match) => (
                <TouchableOpacity
                  key={match.matchId}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/match-summary/${match.matchId}`)}
                  style={[styles`bg-white rounded-xl p-4`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}
                >
                  <View style={styles`flex-row items-center justify-between mb-3`}>
                    <View style={styles`flex-1 min-w-0`}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '700', color: '#0D1F33' }} numberOfLines={1}>vs {match.opponent}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }} numberOfLines={1}>{new Date(match.date).toLocaleDateString('es-AR')} · {match.teamName}</Text>
                    </View>
                    <View style={{ backgroundColor: match.result === 'WIN' ? '#F0FDF4' : '#FEF2F2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 13, fontWeight: '700', color: match.result === 'WIN' ? '#16A34A' : '#EF4444' }}>{match.finalScore || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles`flex-row justify-between`}>
                    <SmallMatchKpi label="PTS" value={match.puntos} color="#1E6FD9" />
                    <SmallMatchKpi label="ATQ" value={match.ataques} color="#0EA5E9" />
                    <SmallMatchKpi label="BLQ" value={match.bloqueos} color="#7C3AED" />
                    <SmallMatchKpi label="ERR" value={match.errores} color="#EF4444" />
                    <SmallMatchKpi label="EFC" value={`${match.eficiencia}%`} color={getEfficiencyColor(match.eficiencia)} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12 }}>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
                Este jugador todavía no tiene acciones registradas.{`\n`}El perfil se actualizará cuando finalice un partido con estadísticas.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 24 }}>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.replace('/home')}>
          <Home size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.push(`/stats/${activeProfile.id}`)}>
          <BarChart3 size={24} color={activeProfile.color} />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: activeProfile.color, marginTop: 4 }}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.push('/club')}>
          <Building2 size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Club</Text>
        </TouchableOpacity>
      </View>
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

function SummaryKpi({ label, value, detail, color, border }: { label: string; value: number | string; detail: string; color: string; border?: boolean }) {
  return (
    <View style={[{ flex: 1, alignItems: 'center' }, border ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F4F7FB' } : null]}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 28, fontWeight: '700', color, lineHeight: 28 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{detail}</Text>
    </View>
  );
}

function ActionKpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 10, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 25, fontWeight: '700', color, lineHeight: 25 }}>{value}</Text>
    </View>
  );
}

function SmallMatchKpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 42 }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 10, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 17, fontWeight: '700', color, lineHeight: 18 }}>{value}</Text>
    </View>
  );
}
