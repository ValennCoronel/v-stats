import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Plus, ArrowLeft } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { teamsService } from '../../src/services/teams.service';
import { Modal } from '../../src/components/ui/Modal';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function ManageTeamsScreen() {
  const router = useRouter();
  const { styles, colors, fonts } = useStyles();
  const { activeProfile, refreshProfiles, isLoading } = useProfile();

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [gender, setGender] = useState('Femenino');
  const [category, setCategory] = useState('Primera');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleEditTeam = (team: any) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setGender(team.gender || 'Femenino');
    setCategory(team.category || 'Primera');
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
        await teamsService.updateTeam(editingTeamId, {
          name: teamName.trim(),
          gender,
          category: category.trim()
        });
      } else {
        await teamsService.createTeam({
          clubId: activeProfile.id,
          name: teamName.trim(),
          gender,
          category: category.trim()
        });
      }
      await refreshProfiles();
      setTeamName('');
      setGender('Femenino');
      setCategory('Primera');
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
    setGender('Femenino');
    setCategory('Primera');
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
      <Modal visible={showAddTeam} onClose={() => setShowAddTeam(false)}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain }}>
          {editingTeamId ? 'Editar Equipo' : 'Nuevo Equipo'}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
          {editingTeamId ? 'Modificar datos del equipo' : 'Agregar equipo en '} 
          {!editingTeamId && <Text style={{ fontFamily: fonts.bodyBold }}>{activeProfile?.clubName}</Text>}
        </Text>
        
        <Input 
          label="NOMBRE DEL EQUIPO"
          placeholder="Ej: Equipo Masculino Superior"
          value={teamName}
          onChangeText={setTeamName}
          autoFocus={!editingTeamId}
          containerStyle={{ marginBottom: 20 }}
        />

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 8, fontWeight: '600' }}>
            GÉNERO
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Femenino', 'Masculino', 'Mixto'].map((g) => {
              const isSelected = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isSelected ? colors.primary : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.borderLight
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 13, fontWeight: '600', color: isSelected ? '#FFFFFF' : '#475569' }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input 
          label="CATEGORÍA"
          placeholder="Ej: Primera, Sub-18, Superior"
          value={category}
          onChangeText={setCategory}
          containerStyle={{ marginBottom: 24 }}
        />

        <View style={styles`flex-row gap-4`}>
          {editingTeamId && (
            <View style={{ flex: 1 }}>
              <Button 
                variant="danger" 
                onPress={() => handleDeleteTeam(editingTeamId)}
              >
                ELIMINAR
              </Button>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Button 
              variant="primary"
              disabled={!teamName.trim()}
              onPress={handleAddTeam}
              style={{ backgroundColor: teamName.trim() ? colors.success : colors.textMuted }}
            >
              GUARDAR
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Modal ── */}
      <Modal visible={!!confirmDialog?.visible} onClose={() => setConfirmDialog(null)}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain }}>
          {confirmDialog?.title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, marginTop: 12, marginBottom: 24, lineHeight: 22 }}>
          {confirmDialog?.message}
        </Text>
        <View style={styles`flex-row gap-4`}>
          <View style={{ flex: 1 }}>
            <Button variant="outline" onPress={() => setConfirmDialog(null)}>CANCELAR</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="danger" onPress={() => {
              if (confirmDialog?.onConfirm) confirmDialog.onConfirm();
              setConfirmDialog(null);
            }}>ELIMINAR</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
