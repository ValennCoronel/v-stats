import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Check, Users, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { matchesService, Match } from '../../src/services/matches.service';

export default function TeamMatchesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { styles } = useStyles();
  const { activeProfile } = useProfile();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formRival, setFormRival] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
  const [formTorneo, setFormTorneo] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const team = activeProfile.teams.find(t => t.id === id);
  const roster = activeProfile.players || [];
  const name = team?.name || 'Equipo';

  useEffect(() => {
    loadMatches();
  }, [id]);

  const loadMatches = async () => {
    if (!id) return;
    setIsLoading(true);
    const res = await matchesService.getMatches(id as string, 'finished');
    if (res.data?.matches) {
      setMatches(res.data.matches);
    }
    setIsLoading(false);
  };

  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(pId => pId !== playerId)
        : [...prev, playerId]
    );
  }, []);

  const handleCreateMatch = useCallback(() => {
    if (!formRival.trim() || selectedPlayerIds.length === 0) return;

    setShowCreateModal(false);
    
    // Pass data to the live match screen
    router.push({
      pathname: '/match/new',
      params: {
        teamId: id,
        rival: formRival.trim(),
        fecha: formFecha.trim(),
        torneo: formTorneo.trim(),
        players: JSON.stringify(selectedPlayerIds),
      }
    });
  }, [formRival, formFecha, formTorneo, selectedPlayerIds, id, router]);

  const handleMatchPress = (matchId: string) => {
    router.push(`/match-summary/${matchId}`);
  };

  const wins = matches.filter(m => m.result === 'WIN').length;
  const losses = matches.filter(m => m.result === 'LOSS').length;

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles`bg-header`, { paddingTop: 60, paddingBottom: 0 }]}>
        <View style={styles`flex-row items-center gap-4 px-4 pb-5`}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace('/home')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles`flex-1`}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>MIS EQUIPOS</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', color: '#fff' }}>{name}</Text>
          </View>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '700', color: '#fff' }}>
              {wins}-{losses}
            </Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>RÉCORD</Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#fff' }}>{matches.length}</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>JUGADOS</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#4ADE80' }}>{wins}</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>VICTORIAS</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}>

        {/* NUEVO PARTIDO button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setFormRival('');
            setFormTorneo('');
            setSelectedPlayerIds(roster.map(p => p.id)); // select all by default
            setShowCreateModal(true);
          }}
          style={{ backgroundColor: '#1E6FD9', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}
        >
          <Plus size={20} color="#fff" />
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>NUEVO PARTIDO</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1E6FD9" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* FINALIZADOS */}
            {matches.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <SectionTitle label="HISTORIAL DE PARTIDOS" color="#64748B" />
                <View style={{ gap: 8 }}>
                  {matches.map(match => (
                    <FinishedCard key={match.id} match={match} onPress={() => handleMatchPress(match.id)} />
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: '#94A3B8' }}>No hay partidos registrados aún.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Match Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: Dimensions.get('window').height * 0.85 }}>
            <View style={{ padding: 24, paddingBottom: 0 }}>
              {/* Handle */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 }} />

              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Nuevo Partido</Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{name}</Text>

              {/* Rival */}
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>RIVAL (REQUERIDO)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 }}
                placeholder="Nombre del rival"
                value={formRival}
                onChangeText={setFormRival}
              />

              {/* Torneo */}
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>TORNEO (OPCIONAL)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 }}
                placeholder="Ej: Liga Metropolitana"
                value={formTorneo}
                onChangeText={setFormTorneo}
              />
            </View>

            {/* Players section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#64748B', letterSpacing: 1 }}>JUGADORES CONVOCADOS</Text>
                <View style={{ backgroundColor: '#1E6FD9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: '700', color: '#fff' }}>
                    {selectedPlayerIds.length} {selectedPlayerIds.length === 1 ? 'jugador' : 'jugadores'} seleccionados
                  </Text>
                </View>
              </View>
            </View>

            {roster.length > 0 ? (
              <FlatList
                data={roster}
                keyExtractor={item => item.id}
                style={{ maxHeight: 200 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
                renderItem={({ item }) => {
                  const isSelected = selectedPlayerIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => togglePlayer(item.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
                        paddingHorizontal: 16, borderRadius: 12, marginBottom: 6,
                        backgroundColor: isSelected ? 'rgba(30,111,217,0.08)' : '#F8FAFC',
                        borderWidth: 1, borderColor: isSelected ? '#1E6FD9' : '#E2E8F0',
                      }}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: isSelected ? '#1E6FD9' : '#E2E8F0',
                        justifyContent: 'center', alignItems: 'center', marginRight: 12,
                      }}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: '700', color: isSelected ? '#fff' : '#64748B' }}>
                          {item.number}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>{item.name}</Text>
                      </View>
                      <View style={{
                        width: 24, height: 24, borderRadius: 6,
                        backgroundColor: isSelected ? '#1E6FD9' : '#E2E8F0',
                        justifyContent: 'center', alignItems: 'center',
                      }}>
                        {isSelected && <Check size={16} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={{ paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' }}>
                <Users size={32} color="#CBD5E1" />
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>Este equipo no tiene jugadores en el roster</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <View style={styles`flex-row gap-4`}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateMatch}
                  disabled={!formRival.trim() || selectedPlayerIds.length === 0}
                  style={{
                    flex: 1, backgroundColor: (formRival.trim() && selectedPlayerIds.length > 0) ? '#1E6FD9' : '#CBD5E1',
                    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#fff' }}>COMENZAR PARTIDO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Sub-components Native ── */

function SectionTitle({ label, color, dot }: { label: string; color: string; dot?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />}
      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color }}>{label}</Text>
    </View>
  );
}

function FinishedCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const isWin = match.result === 'WIN';
  const setsWon = match.setScores?.filter((s: any) => s.teamPts > s.oppPts).length || 0;
  const setsLost = match.setScores?.filter((s: any) => s.oppPts > s.teamPts).length || 0;
  const opponentName = match.opponentTeam?.name || match.opponent;
  const matchDate = new Date(match.date).toLocaleDateString('es-AR');

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isWin ? '#F0FDF4' : '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
        <CheckCircle2 size={24} color={isWin ? '#16A34A' : '#EF4444'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '600', color: '#0D1F33' }}>{opponentName}</Text>
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{matchDate}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', color: isWin ? '#16A34A' : '#EF4444' }}>
          {setsWon}-{setsLost}
        </Text>
        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: '#64748B', letterSpacing: 0.5 }}>SETS</Text>
      </View>
      <ChevronRight size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}
