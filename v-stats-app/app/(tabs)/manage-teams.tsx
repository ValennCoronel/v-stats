import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Plus, X, ArrowLeft } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { teamsService } from '../../src/services/teams.service';

export default function ManageTeamsScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { activeProfile, refreshProfiles, isLoading } = useProfile();

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
        await teamsService.createTeam({
          clubId: activeProfile.id,
          name: teamName.trim()
        });
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

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.textSecondary, marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Header que scrollea ── */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 32 }}>
          <View style={styles`flex-row items-center gap-4 mb-4`}>
            <TouchableOpacity onPress={() => router.push('/club')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: '700', color: '#fff' }}>Equipos</Text>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
            Gestioná los equipos de {activeProfile?.clubName || 'tu club'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          {/* ── Lista de Equipos ── */}
          <View style={styles`flex-row items-center justify-between mb-4`}>
            <View style={styles`flex-row items-center gap-2`}>
              <Building2 size={20} color={colors.textMain} />
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>TUS EQUIPOS</Text>
            </View>
            <TouchableOpacity onPress={openAddTeam} style={{ backgroundColor: `${colors.primary}15`, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {!activeProfile?.teams || activeProfile.teams.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: colors.bgSurface, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary }}>No hay equipos en este club.</Text>
            </View>
          ) : (
            <View style={{ marginBottom: 24 }}>
              {activeProfile.teams.map((team: any) => (
                <TouchableOpacity key={team.id} onPress={() => handleEditTeam(team)} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: colors.textMain }}>{team.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add Team Modal ── */}
      <Modal visible={showAddTeam} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain }}>
                  {editingTeamId ? 'Editar Equipo' : 'Nuevo Equipo'}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
                  {editingTeamId ? 'Modificar datos del equipo' : 'Agregar equipo en '} 
                  {!editingTeamId && <Text style={{ fontFamily: fonts.bodyBold }}>{activeProfile?.clubName}</Text>}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddTeam(false)} style={{ padding: 4, backgroundColor: colors.borderLight, borderRadius: 16 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, letterSpacing: 1, marginBottom: 8 }}>NOMBRE DEL EQUIPO</Text>
            <TextInput 
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24, color: colors.textMain, backgroundColor: colors.bgMain }}
              placeholder="Ej: Equipo Masculino Superior"
              placeholderTextColor={colors.textMuted}
              value={teamName}
              onChangeText={setTeamName}
              autoFocus={!editingTeamId}
            />

            <View style={styles`flex-row gap-4`}>
              {editingTeamId && (
                <TouchableOpacity 
                  onPress={() => handleDeleteTeam(editingTeamId)}
                  style={{ flex: 1, backgroundColor: colors.danger, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>ELIMINAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleAddTeam}
                disabled={!teamName.trim()}
                style={{ flex: 1, backgroundColor: teamName.trim() ? colors.success : colors.textMuted, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>GUARDAR</Text>
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
