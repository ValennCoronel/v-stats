import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Home, BarChart3, Settings, TrendingUp, Award, Target, Shield, Building2 } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { statsService, ClubStats } from '../../src/services/stats.service';

export default function StatsScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  const { activeProfile } = useProfile();
  
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [activeProfile.id]);

  const loadStats = async () => {
    if (activeProfile.id === '__empty__') return;
    setIsLoading(true);
    const res = await statsService.getClubStats(activeProfile.id);
    if (res.data) {
      setStats(res.data);
    }
    setIsLoading(false);
  };

  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;
  const setsWon = stats?.setsWon || 0;
  const setsLost = stats?.setsLost || 0;
  const totalPoints = stats?.totalPoints || 0;
  const players = stats?.topScorers || [];

  const sortedByPoints = [...players].sort((a, b) => b.puntos - a.puntos);
  const topScorer = sortedByPoints[0];
  const topBlocker = [...players].sort((a, b) => b.bloqueos - a.bloqueos)[0];
  const topRecepcion = [...players].sort((a, b) => b.recepciones - a.recepciones)[0];

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color="#1E6FD9" />
      </View>
    );
  }

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* ── Header ── */}
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
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>ESTADÍSTICAS</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 26 }}>{activeProfile.clubName}</Text>
          </View>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: activeProfile.color }} />
        </View>

        {/* Season overview row */}
        <View style={styles`flex-row justify-between gap-1`}>
          {[
            { label: 'PARTIDOS', value: totalMatches, color: '#fff' },
            { label: 'GANADOS', value: wins, color: '#4ADE80' },
            { label: 'PERDIDOS', value: losses, color: '#F87171' },
            { label: 'EFECT.', value: `${winRate}%`, color: '#3D8EF5' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[styles`w-1/4 rounded-xl py-3 items-center`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>{value}</Text>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 9, letterSpacing: 0.8, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pt-5 pb-24 gap-5`}>

        {/* Líderes de temporada */}
        {topScorer && (
          <View>
            <View style={styles`flex-row items-center gap-1.5 mb-3 px-0.5`}>
              <Award size={16} color="#64748B" />
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>LÍDERES DE TEMPORADA</Text>
            </View>
            
            <View style={styles`flex-row justify-between gap-2`}>
              {[
                { label: 'PUNTOS', player: topScorer, value: topScorer?.puntos, icon: <TrendingUp size={16} color="#1E6FD9" />, color: '#1E6FD9' },
                { label: 'BLOQUEOS', player: topBlocker, value: topBlocker?.bloqueos, icon: <Shield size={16} color="#7C3AED" />, color: '#7C3AED' },
                { label: 'RECEP.', player: topRecepcion, value: topRecepcion?.recepciones, icon: <Target size={16} color="#16A34A" />, color: '#16A34A' },
              ].map(({ label, player, value, icon, color }) => (
                <View key={label} style={[styles`w-1/3 bg-white p-3 items-center rounded-xl`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${color}18`, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                    {icon}
                  </View>
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 9, letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>{value}</Text>
                  <Text style={{ fontSize: 10, color: '#0D1F33', marginTop: 4, fontWeight: '500' }}>{player?.name?.split(' ')[0] ?? '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ranking de jugadores */}
        {sortedByPoints.length > 0 && (
          <View>
            <View style={styles`flex-row items-center gap-1.5 mb-3 px-0.5`}>
              <BarChart3 size={16} color="#64748B" />
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>RENDIMIENTO INDIVIDUAL</Text>
            </View>
            
            <View style={styles`gap-2`}>
              {sortedByPoints.map((player, idx) => {
                const initials = player.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                return (
                  <View key={player.id} style={[styles`bg-white rounded-xl overflow-hidden`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
                    <View style={styles`flex-row items-center gap-3 px-4 py-3`}>
                      
                      <MedalIcon rank={idx + 1} />
                      
                      {idx >= 3 && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F4F7FB', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: '#94A3B8', fontWeight: '600' }}>{idx + 1}</Text>
                        </View>
                      )}

                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: '700', color: '#fff' }}>{initials}</Text>
                      </View>
                      
                      <View style={styles`flex-1 min-w-0`}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                          #{player.number} {player.name?.split(' ')[0]}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>{player.position}</Text>
                      </View>

                      {/* KPIs */}
                      <View style={styles`flex-row gap-4 flex-shrink-0`}>
                        <StatKpi label="PTS" value={player.puntos} color="#1E6FD9" />
                        <StatKpi 
                          label="EFC" 
                          value={player.eficiencia} 
                          unit="%" 
                          color={player.eficiencia >= 65 ? '#16A34A' : player.eficiencia >= 55 ? '#F59E0B' : '#EF4444'} 
                        />
                        <StatKpi label="BLQ" value={player.bloqueos} color="#7C3AED" />
                      </View>
                    </View>

                    {/* mini bar eficiencia */}
                    <View style={styles`h-1 mx-4 mb-3 bg-screen rounded-full overflow-hidden`}>
                      <View
                        style={{
                          height: '100%',
                          borderRadius: 9999,
                          width: `${player.eficiencia}%`,
                          backgroundColor: player.eficiencia >= 65 ? '#16A34A' : player.eficiencia >= 55 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sets stats */}
        <View>
          <View style={styles`flex-row items-center gap-1.5 mb-3 px-0.5`}>
            <Target size={16} color="#64748B" />
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>TEMPORADA</Text>
          </View>
          
          <View style={[styles`bg-white px-4 py-4 rounded-xl`, { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles`flex-row justify-between items-center`}>
              
              <View style={styles`flex-1 items-center`}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>SETS WON</Text>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: '700', color: '#1E6FD9', lineHeight: 28 }}>{setsWon}</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>de {setsWon + setsLost}</Text>
              </View>
              
              <View style={[styles`flex-1 items-center border-x`, { borderColor: '#F4F7FB' }]}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>PUNTOS</Text>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: '700', color: '#0D1F33', lineHeight: 28 }}>{totalPoints}</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>en total</Text>
              </View>
              
              <View style={styles`flex-1 items-center`}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>SETS %</Text>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: '700', color: '#16A34A', lineHeight: 28 }}>
                  {Math.round((setsWon / Math.max(setsWon + setsLost, 1)) * 100)}%
                </Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>efectividad</Text>
              </View>
              
            </View>
          </View>
        </View>

        {/* Empty state */}
        {totalMatches === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
              Aún no hay partidos finalizados.{'\n'}Las estadísticas aparecerán después del primer partido.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 24 }}>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.replace('/home')}>
          <Home size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#64748B', marginTop: 4 }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`}>
          <BarChart3 size={24} color={activeProfile.color} />
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: activeProfile.color, marginTop: 4 }}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.push('/club')}>
          <Building2 size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#64748B', marginTop: 4 }}>Club</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Sub-components Native ── */

function StatKpi({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color, lineHeight: 22 }}>
        {value}{unit && <Text style={{ fontSize: 13, fontWeight: '500' }}>{unit}</Text>}
      </Text>
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