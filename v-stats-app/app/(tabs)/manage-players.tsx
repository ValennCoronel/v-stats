import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users, Plus, X, ArrowLeft } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { playersService } from '../../src/services/players.service';

export default function ManagePlayersScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { activeProfile, refreshProfiles, isLoading } = useProfile();

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState({ name: '', dni: '', number: '', position: 'OUTSIDE_HITTER' });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const POSITIONS = [
    { id: 'SETTER', label: 'Armador' },
    { id: 'OUTSIDE_HITTER', label: 'Punta' },
    { id: 'OPPOSITE_HITTER', label: 'Opuesto' },
    { id: 'MIDDLE_BLOCKER', label: 'Central' },
    { id: 'LIBERO', label: 'Líbero' },
    { id: 'DEFENSIVE_SPECIALIST', label: 'Especialista' },
  ];

  const getPositionLabel = (pos: string) => POSITIONS.find(p => p.id === pos)?.label || pos;

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
          teamId: '',
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
      Alert.alert("Error", "Error al guardar el jugador. Posiblemente el DNI ya exista.");
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.textSecondary, marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  const allClubPlayers = activeProfile?.players || [];

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Header que scrollea ── */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
          <View style={styles`flex-row items-center gap-4 mb-4`}>
            <TouchableOpacity onPress={() => {
              if (from === 'partido') {
                router.push('/partido');
              } else if (from === 'club') {
                router.push('/club');
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/club');
              }
            }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: '700', color: '#fff' }}>Jugadores</Text>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
            Gestioná los jugadores de {activeProfile?.clubName || 'tu club'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          {/* ── Lista de Jugadores ── */}
          <View style={styles`flex-row items-center justify-between mb-4`}>
            <View style={styles`flex-row items-center gap-2`}>
              <Users size={20} color={colors.textMain} />
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>TUS JUGADORES</Text>
            </View>
            <TouchableOpacity onPress={openAddPlayer} style={{ backgroundColor: `${colors.primary}15`, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {allClubPlayers.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary }}>No hay jugadores registrados en el club.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {allClubPlayers.map((player: any) => (
                <TouchableOpacity key={player.id} onPress={() => handleEditPlayer(player)} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: activeProfile?.color || colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>{player.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: colors.textMain }}>{player.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>{getPositionLabel(player.position)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add Player Modal ── */}
      <Modal visible={showAddPlayer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain }}>
                  {editingPlayerId ? 'Editar Jugador' : 'Nuevo Jugador'}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
                  {editingPlayerId ? 'Modificar datos del jugador' : `Agregar jugador al club `}
                  {!editingPlayerId && <Text style={{ fontFamily: fonts.bodyBold }}>{activeProfile?.clubName}</Text>}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)} style={{ padding: 4, backgroundColor: colors.borderLight, borderRadius: 16 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput 
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12, color: colors.textMain, backgroundColor: colors.bgMain }}
              placeholder="Nombre Completo"
              placeholderTextColor={colors.textMuted}
              value={playerForm.name}
              onChangeText={t => setPlayerForm(p => ({ ...p, name: t }))}
            />
            <TextInput 
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 12, 
                padding: 12, 
                fontSize: 16, 
                marginBottom: 12,
                backgroundColor: editingPlayerId ? colors.borderLight : colors.bgMain,
                color: editingPlayerId ? colors.textMuted : colors.textMain
              }}
              placeholder="DNI"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={playerForm.dni}
              onChangeText={t => setPlayerForm(p => ({ ...p, dni: t }))}
              editable={!editingPlayerId}
            />
            <TextInput 
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16, color: colors.textMain, backgroundColor: colors.bgMain }}
              placeholder="Número de Camiseta"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={playerForm.number}
              onChangeText={t => setPlayerForm(p => ({ ...p, number: t }))}
            />

            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, letterSpacing: 1, marginBottom: 8 }}>POSICIÓN</Text>
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
                      backgroundColor: playerForm.position === pos.id ? (activeProfile?.color || colors.primary) : colors.borderLight,
                    }}
                  >
                    <Text style={{ 
                      fontFamily: fonts.bodyMedium,
                      fontSize: 14, 
                      color: playerForm.position === pos.id ? '#fff' : colors.textSecondary 
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
                  style={{ flex: 1, backgroundColor: colors.danger, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>ELIMINAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleSubmitPlayer}
                disabled={isSubmittingPlayer || !playerForm.name || !playerForm.dni || !playerForm.number}
                style={{ flex: 1, backgroundColor: playerForm.name && playerForm.dni ? colors.success : colors.textMuted, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                {isSubmittingPlayer ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>GUARDAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Modal ── */}
      <Modal visible={!!confirmDialog?.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain }}>
                  {confirmDialog?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmDialog(null)} style={{ padding: 4, backgroundColor: colors.borderLight, borderRadius: 16 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, marginTop: 12, marginBottom: 24, lineHeight: 22 }}>
              {confirmDialog?.message}
            </Text>
            <View style={styles`flex-row gap-4`}>
              <TouchableOpacity 
                onPress={() => setConfirmDialog(null)}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (confirmDialog?.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                style={{ flex: 1, backgroundColor: colors.danger, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
