import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Home, BarChart3, Settings, Plus, ChevronDown, Check, Building2, Users, ChevronRight, X, Pencil, Trash2 } from 'lucide-react-native';
import { useStyles } from '../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { playersService } from '../src/services/players.service';
import { teamsService } from '../src/services/teams.service';

export default function ClubScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  type AccessRole = 'admin' | 'coach' | 'assistant';
  type ClubProfile = { id: string; clubName: string; city: string; role: AccessRole; color: string; };
  const PROFILE_COLORS = ['#1E6FD9', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2'];
  
  const { coach, profiles, activeProfile, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile, addTeam, refreshProfiles, isLoading } = useProfile();
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');

  const [clubModal, setClubModal] = useState<{ mode: 'add' | 'edit'; profile?: any } | null>(null);
  const [clubForm, setClubForm] = useState({ clubName: '', city: '', role: 'admin' as AccessRole, color: PROFILE_COLORS[0] });

  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

  const POSITIONS = [
    { id: 'SETTER', label: 'Armador' },
    { id: 'OUTSIDE_HITTER', label: 'Punta' },
    { id: 'OPPOSITE_HITTER', label: 'Opuesto' },
    { id: 'MIDDLE_BLOCKER', label: 'Central' },
    { id: 'LIBERO', label: 'Líbero' },
    { id: 'DEFENSIVE_SPECIALIST', label: 'Especialista' },
  ];

  const getPositionLabel = (pos: string) => POSITIONS.find(p => p.id === pos)?.label || pos;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrador', coach: 'Entrenador', assistant: 'Asistente',
  };

  const handleSwitchClub = (id: string) => {
    switchProfile(id);
    setShowSwitcher(false);
  };

  const openAddClub = () => {
    setClubForm({ clubName: '', city: '', role: 'admin', color: PROFILE_COLORS[0] });
    setClubModal({ mode: 'add' });
    setShowSwitcher(false);
  };

  const openEditClub = (profile: any) => {
    setClubForm({ clubName: profile.clubName, city: profile.city, role: profile.role, color: profile.color });
    setClubModal({ mode: 'edit', profile });
    setShowSwitcher(false);
  };

  const saveClub = async () => {
    if (!clubForm.clubName.trim()) return;
    try {
      if (clubModal?.mode === 'add') {
        await addProfile(clubForm);
      } else if (clubModal?.mode === 'edit' && clubModal.profile) {
        await updateProfile(clubModal.profile.id, clubForm);
      }
      setClubModal(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un error al guardar el club.");
    }
  };

  const handleDeleteClub = (profile: any) => {
    setConfirmDialog({
      visible: true,
      title: "Eliminar Club",
      message: `¿Estás seguro de eliminar el club ${profile.clubName}? Se perderán todos sus equipos, jugadores y partidos.`,
      onConfirm: async () => {
        try {
          await deleteProfile(profile.id);
          setShowSwitcher(false);
        } catch (e) {
          console.error(e);
          Alert.alert("Error", "No se pudo eliminar el club.");
        }
      }
    });
  };

  const handleEditTeam = (team: any) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setShowAddTeam(true);
  };

  const executeDeleteTeam = async (id: string) => {
    try {
      await teamsService.deleteTeam(id);
      await refreshProfiles();
      setShowAddTeam(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo eliminar el equipo.");
    }
  };

  const handleDeleteTeam = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: "Eliminar Equipo",
      message: "¿Estás seguro de eliminar este equipo? Se perderán todos sus partidos.",
      onConfirm: () => executeDeleteTeam(id)
    });
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) return;
    try {
      if (editingTeamId) {
        await teamsService.updateTeam(editingTeamId, { name: teamName.trim() });
      } else {
        await addTeam(activeProfile.id, { name: teamName.trim() });
      }
      await refreshProfiles();
      setTeamName('');
      setShowAddTeam(false);
      setEditingTeamId(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un error al guardar el equipo.");
    }
  };

  const openAddTeam = () => {
    setEditingTeamId(null);
    setTeamName('');
    setShowAddTeam(true);
  };

  const handleEditPlayer = (player: any) => {
    setEditingPlayerId(player.id);
    setPlayerForm({ 
      name: player.name, 
      dni: player.dni, 
      number: player.number.toString(), 
      position: player.position || 'OUTSIDE_HITTER' 
    });
    setShowAddPlayer(true);
  };

  const executeDeletePlayer = async (id: string) => {
    try {
      await playersService.deletePlayer(id);
      await refreshProfiles();
      setShowAddPlayer(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo eliminar el jugador.");
    }
  };

  const handleDeletePlayer = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: "Eliminar Jugador",
      message: "¿Estás seguro de que quieres eliminar este jugador de la base de datos?",
      onConfirm: () => executeDeletePlayer(id)
    });
  };

  const handleSubmitPlayer = async () => {
    if (!playerForm.name.trim() || !playerForm.dni.trim() || !playerForm.number.trim()) return;
    setIsSubmittingPlayer(true);
    try {
      if (editingPlayerId) {
        await playersService.updatePlayer(editingPlayerId, {
          name: playerForm.name.trim(),
          dni: playerForm.dni.trim(),
          number: parseInt(playerForm.number),
          position: playerForm.position,
        });
      } else {
        await playersService.createPlayer({
          clubId: activeProfile.id,
          teamId: '', // Dummy or empty if required by type but not by db
          name: playerForm.name.trim(),
          dni: playerForm.dni.trim(),
          number: parseInt(playerForm.number),
          position: playerForm.position,
        });
      }
      await refreshProfiles();
      setShowAddPlayer(false);
      setEditingPlayerId(null);
      setPlayerForm({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Error al guardar el jugador. Posiblemente el DNI ya exista.");
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  const openAddPlayer = () => {
    setEditingPlayerId(null);
    setPlayerForm({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
    setShowAddPlayer(true);
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
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center', marginBottom: 24 }}>Por favor crea un club para empezar.</Text>
            
            <TouchableOpacity 
              onPress={openAddClub}
              style={{ backgroundColor: '#1E6FD9', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Plus size={20} color="#fff" />
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>Crea tu primer club</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Equipos ── */}
            <View style={styles`flex-row items-center justify-between mb-4`}>
              <View style={styles`flex-row items-center gap-2`}>
                <Building2 size={20} color="#0D1F33" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#0D1F33' }}>EQUIPOS</Text>
              </View>
              <TouchableOpacity onPress={openAddTeam} style={{ backgroundColor: 'rgba(30,111,217,0.1)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Plus size={20} color="#1E6FD9" />
              </TouchableOpacity>
            </View>

            {activeProfile.teams.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12, marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>No hay equipos en este club.</Text>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                {activeProfile.teams.map((team) => (
                  <TouchableOpacity key={team.id} onPress={() => handleEditTeam(team)} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33' }}>{team.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Jugadores ── */}
            <View style={styles`flex-row items-center justify-between mb-4 mt-4`}>
              <View style={styles`flex-row items-center gap-2`}>
                <Users size={20} color="#0D1F33" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#0D1F33' }}>JUGADORES</Text>
              </View>
              <TouchableOpacity onPress={openAddPlayer} style={{ backgroundColor: 'rgba(30,111,217,0.1)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Plus size={20} color="#1E6FD9" />
              </TouchableOpacity>
            </View>

            {allClubPlayers.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12 }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>No hay jugadores registrados en el club.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {allClubPlayers.map((player) => (
                  <TouchableOpacity key={player.id} onPress={() => handleEditPlayer(player)} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '700', color: '#fff' }}>{player.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33' }}>{player.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{getPositionLabel(player.position)}</Text>
                    </View>
                  </TouchableOpacity>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>
                  {editingTeamId ? 'Editar Equipo' : 'Nuevo Equipo'}
                </Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
                  {editingTeamId ? 'Modificar datos del equipo' : 'Agregar equipo en '} 
                  {!editingTeamId && <Text style={{ fontWeight: 'bold' }}>{activeProfile.clubName}</Text>}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddTeam(false)} style={{ padding: 4, backgroundColor: '#F1F5F9', borderRadius: 16 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>NOMBRE DEL EQUIPO</Text>
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 }}
              placeholder="Ej: Equipo Masculino Superior"
              value={teamName}
              onChangeText={setTeamName}
              autoFocus={!editingTeamId}
            />

            <View style={styles`flex-row gap-4`}>
              {editingTeamId && (
                <TouchableOpacity 
                  onPress={() => handleDeleteTeam(editingTeamId)}
                  style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>ELIMINAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleAddTeam}
                disabled={!teamName.trim()}
                style={{ flex: 1, backgroundColor: teamName.trim() ? '#16A34A' : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Player Modal ── */}
      <Modal visible={showAddPlayer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>
                  {editingPlayerId ? 'Editar Jugador' : 'Nuevo Jugador'}
                </Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
                  {editingPlayerId ? 'Modificar datos del jugador' : `Agregar jugador al club `}
                  {!editingPlayerId && <Text style={{ fontWeight: 'bold' }}>{activeProfile.clubName}</Text>}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)} style={{ padding: 4, backgroundColor: '#F1F5F9', borderRadius: 16 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 }}
              placeholder="Nombre Completo"
              value={playerForm.name}
              onChangeText={t => setPlayerForm(p => ({ ...p, name: t }))}
            />
            <TextInput 
              style={{ 
                borderWidth: 1, 
                borderColor: '#E2E8F0', 
                borderRadius: 12, 
                padding: 12, 
                fontSize: 16, 
                marginBottom: 12,
                backgroundColor: editingPlayerId ? '#F1F5F9' : '#fff',
                color: editingPlayerId ? '#94A3B8' : '#0D1F33'
              }}
              placeholder="DNI"
              keyboardType="numeric"
              value={playerForm.dni}
              onChangeText={t => setPlayerForm(p => ({ ...p, dni: t }))}
              editable={!editingPlayerId}
            />
            <TextInput 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 }}
              placeholder="Número de Camiseta"
              keyboardType="numeric"
              value={playerForm.number}
              onChangeText={t => setPlayerForm(p => ({ ...p, number: t }))}
            />

            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>POSICIÓN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, maxHeight: 40 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {POSITIONS.map(pos => (
                  <TouchableOpacity
                    key={pos.id}
                    onPress={() => setPlayerForm(p => ({ ...p, position: pos.id }))}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: playerForm.position === pos.id ? activeProfile.color : '#F1F5F9',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: playerForm.position === pos.id ? '#fff' : '#64748B' 
                    }}>
                      {pos.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles`flex-row gap-4 mt-4`}>
              {editingPlayerId && (
                <TouchableOpacity 
                  onPress={() => handleDeletePlayer(editingPlayerId)}
                  disabled={isSubmittingPlayer}
                  style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>ELIMINAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleSubmitPlayer}
                disabled={isSubmittingPlayer || !playerForm.name || !playerForm.dni || !playerForm.number}
                style={{ flex: 1, backgroundColor: playerForm.name && playerForm.dni ? '#16A34A' : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                {isSubmittingPlayer ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>GUARDAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Switcher Modal ── */}
      <Modal visible={showSwitcher} transparent animationType="slide" onRequestClose={() => setShowSwitcher(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowSwitcher(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Cambiar de Club</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{coach.email}</Text>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {profiles.map(profile => (
                <View key={profile.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: profile.id === activeProfileId ? activeProfile.color : '#E2E8F0', backgroundColor: profile.id === activeProfileId ? `${profile.color}10` : '#fff', borderRadius: 16 }}>
                  <TouchableOpacity 
                    onPress={() => handleSwitchClub(profile.id)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${profile.color}20`, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                      <Building2 size={20} color={profile.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: '#0D1F33' }}>{profile.clubName}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{profile.city} · {roleLabel[profile.role] || profile.role}</Text>
                    </View>
                    {profile.id === activeProfileId && (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <View style={{ flexDirection: 'row', paddingRight: 16, gap: 12 }}>
                    <TouchableOpacity onPress={() => openEditClub(profile)}>
                      <Pencil size={20} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteClub(profile)}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                onPress={openAddClub}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(30,111,217,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(30,111,217,0.2)', marginTop: 8 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(30,111,217,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Plus size={20} color="#1E6FD9" />
                </View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '700', color: '#1E6FD9' }}>Crear nuevo club</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* ── Confirm Modal ── */}
      <Modal visible={!!confirmDialog?.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33' }}>
                  {confirmDialog?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmDialog(null)} style={{ padding: 4, backgroundColor: '#F1F5F9', borderRadius: 16 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 15, color: '#64748B', marginTop: 12, marginBottom: 24, lineHeight: 22 }}>
              {confirmDialog?.message}
            </Text>
            <View style={styles`flex-row gap-4`}>
              <TouchableOpacity 
                onPress={() => setConfirmDialog(null)}
                style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (confirmDialog?.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Club Modal ── */}
      <Modal visible={clubModal !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33', marginBottom: 16 }}>
                  {clubModal?.mode === 'add' ? 'Agregar Club' : 'Editar Club'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClubModal(null)} style={{ padding: 4, backgroundColor: '#F1F5F9', borderRadius: 16 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>NOMBRE DEL CLUB</Text>
            <TextInput 
              value={clubForm.clubName} 
              onChangeText={t => setClubForm(f => ({ ...f, clubName: t }))} 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 }} 
              placeholder="Ej: Club Atlético..."
            />
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>CIUDAD / SEDE</Text>
            <TextInput 
              value={clubForm.city} 
              onChangeText={t => setClubForm(f => ({ ...f, city: t }))} 
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 }} 
              placeholder="Ej: Buenos Aires"
            />

            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 8 }}>COLOR PRINCIPAL</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {PROFILE_COLORS.map(color => (
                <TouchableOpacity 
                  key={color} 
                  onPress={() => setClubForm(f => ({ ...f, color }))} 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}
                >
                  {clubForm.color === color && <Check size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              disabled={!clubForm.clubName.trim()} 
              onPress={saveClub} 
              style={{ backgroundColor: clubForm.clubName.trim() ? '#16A34A' : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>
                {clubModal?.mode === 'add' ? 'AGREGAR CLUB' : 'GUARDAR CAMBIOS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
