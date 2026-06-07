import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Home, BarChart3, Settings, Plus, ChevronDown, Check, Building2, Users, ChevronRight } from 'lucide-react-native';
import { useStyles } from '../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { playersService } from '../src/services/players.service';

export default function ClubScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { coach, profiles, activeProfile, activeProfileId, switchProfile, addTeam, refreshProfiles, isLoading } = useProfile();
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamName, setTeamName] = useState('');

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.replace('/');
    return null;
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrador', coach: 'Entrenador', assistant: 'Asistente',
  };

  const handleSwitchClub = (id: string) => {
    switchProfile(id);
    setShowSwitcher(false);
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) return;
    await addTeam(activeProfile.id, { name: teamName.trim() });
    setTeamName('');
    setShowAddTeam(false);
  };

  const handleAddPlayer = async () => {
    if (!playerForm.name.trim() || !playerForm.dni.trim() || !playerForm.number.trim()) return;
    setIsSubmittingPlayer(true);
    try {
      await playersService.createPlayer({
        clubId: activeProfile.id,
        teamId: '', // Dummy or empty if required by type but not by db
        name: playerForm.name.trim(),
        dni: playerForm.dni.trim(),
        number: parseInt(playerForm.number),
        position: playerForm.position,
      });
      await refreshProfiles();
      setShowAddPlayer(false);
      setPlayerForm({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
    } catch (error) {
      console.error("Error creating player:", error);
      alert("Error al crear el jugador. Posiblemente el DNI ya exista.");
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color="#1E6FD9" />
        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, color: '#64748B', marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  const allClubPlayers = activeProfile.players || [];

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles`bg-header px-4`, { paddingTop: 60, paddingBottom: 24 }]}>
        <View style={styles`flex-row items-center justify-between mb-4`}>
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#fff' }}>Gestión de Club</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Settings size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Club Switcher pill */}
        {profiles.length > 0 && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setShowSwitcher(true)}
            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <View style={styles`flex-row items-center gap-4`}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${activeProfile.color}30`, justifyContent: 'center', alignItems: 'center' }}>
                <Building2 size={18} color={activeProfile.color} />
              </View>
              <View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: '#fff' }}>{activeProfile.clubName}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{activeProfile.city} · {roleLabel[activeProfile.role] || activeProfile.role}</Text>
              </View>
            </View>
            <View style={styles`flex-row items-center gap-2`}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>CAMBIAR</Text>
              <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}>
        
        {profiles.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
            <Building2 size={48} color="#94a3b8" />
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33', marginTop: 16 }}>Sin clubes aún</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' }}>Por favor crea un club en la configuración.</Text>
          </View>
        ) : (
          <>
            {/* ── Equipos ── */}
            <View style={styles`flex-row items-center justify-between mb-4`}>
              <View style={styles`flex-row items-center gap-2`}>
                <Building2 size={20} color="#0D1F33" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#0D1F33' }}>EQUIPOS</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddTeam(true)} style={{ backgroundColor: 'rgba(30,111,217,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Plus size={16} color="#1E6FD9" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '600', color: '#1E6FD9' }}>NUEVO EQUIPO</Text>
              </TouchableOpacity>
            </View>

            {activeProfile.teams.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12, marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>No hay equipos en este club.</Text>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                {activeProfile.teams.map((team) => (
                  <View key={team.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33' }}>{team.name}</Text>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </View>
                ))}
              </View>
            )}

            {/* ── Jugadores ── */}
            <View style={styles`flex-row items-center justify-between mb-4 mt-4`}>
              <View style={styles`flex-row items-center gap-2`}>
                <Users size={20} color="#0D1F33" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#0D1F33' }}>JUGADORES DEL CLUB</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddPlayer(true)} style={{ backgroundColor: 'rgba(30,111,217,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Plus size={16} color="#1E6FD9" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '600', color: '#1E6FD9' }}>NUEVO JUGADOR</Text>
              </TouchableOpacity>
            </View>

            {allClubPlayers.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12 }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>No hay jugadores registrados en el club.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {allClubPlayers.map((player) => (
                  <View key={player.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '700', color: '#fff' }}>{player.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33' }}>{player.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{player.position}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 24 }}>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.replace('/home')}>
          <Home size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles`items-center`}
          onPress={() => router.push(`/stats/${activeProfile.id}`)}
        >
          <BarChart3 size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`}>
          <Building2 size={24} color={activeProfile.color} />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: activeProfile.color, marginTop: 4 }}>Club</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Team Modal ── */}
      <Modal visible={showAddTeam} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Nuevo Equipo</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Agregar equipo en <Text style={{ fontWeight: 'bold' }}>{activeProfile.clubName}</Text></Text>
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>NOMBRE DEL EQUIPO</Text>
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 }}
              placeholder="Ej: Equipo Masculino Superior"
              value={teamName}
              onChangeText={setTeamName}
              autoFocus
            />

            <View style={styles`flex-row gap-4`}>
              <TouchableOpacity onPress={() => setShowAddTeam(false)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddTeam}
                disabled={!teamName.trim()}
                style={{ flex: 1, backgroundColor: teamName.trim() ? activeProfile.color : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>AGREGAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Player Modal ── */}
      <Modal visible={showAddPlayer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Nuevo Jugador</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Agregar jugador al club <Text style={{ fontWeight: 'bold' }}>{activeProfile.clubName}</Text></Text>
            
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 }}
              placeholder="Nombre Completo"
              value={playerForm.name}
              onChangeText={t => setPlayerForm(p => ({ ...p, name: t }))}
            />
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 }}
              placeholder="DNI"
              keyboardType="numeric"
              value={playerForm.dni}
              onChangeText={t => setPlayerForm(p => ({ ...p, dni: t }))}
            />
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 24 }}
              placeholder="Número de Camiseta"
              keyboardType="numeric"
              value={playerForm.number}
              onChangeText={t => setPlayerForm(p => ({ ...p, number: t }))}
            />

            <View style={styles`flex-row gap-4`}>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddPlayer}
                disabled={isSubmittingPlayer || !playerForm.name || !playerForm.dni || !playerForm.number}
                style={{ flex: 1, backgroundColor: playerForm.name && playerForm.dni ? activeProfile.color : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                {isSubmittingPlayer ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>AGREGAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Switcher Modal ── */}
      <Modal visible={showSwitcher} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Cambiar de Club</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{coach.email}</Text>

            {profiles.map(profile => (
              <TouchableOpacity 
                key={profile.id}
                onPress={() => handleSwitchClub(profile.id)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderColor: profile.id === activeProfileId ? activeProfile.color : '#E2E8F0', backgroundColor: profile.id === activeProfileId ? `${profile.color}10` : '#fff', borderRadius: 16, marginBottom: 12 }}
              >
                 <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${profile.color}20`, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Building2 size={20} color={profile.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: '#0D1F33' }}>{profile.clubName}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>{profile.city} · {roleLabel[profile.role] || profile.role}</Text>
                </View>
                {profile.id === activeProfileId && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center' }}>
                    <Check size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
