import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Plus, X, ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';

export default function ManageClubsScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { coach, profiles, activeProfile, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile, isLoading } = useProfile();

  type AccessRole = 'admin' | 'coach' | 'assistant';
  const PROFILE_COLORS = ['#1E6FD9', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2'];

  const [clubModal, setClubModal] = useState<{ mode: 'add' | 'edit'; profile?: any } | null>(null);
  const [clubForm, setClubForm] = useState({ clubName: '', city: '', role: 'admin' as AccessRole, color: PROFILE_COLORS[0] });

  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const roleLabel: Record<string, string> = {
    admin: 'Administrador', coach: 'Entrenador', assistant: 'Asistente',
  };

  const handleSwitchClub = (id: string) => {
    switchProfile(id);
  };

  const openAddClub = () => {
    setClubForm({ clubName: '', city: '', role: 'admin', color: PROFILE_COLORS[0] });
    setClubModal({ mode: 'add' });
  };

  const openEditClub = (profile: any) => {
    setClubForm({ clubName: profile.clubName, city: profile.city, role: profile.role, color: profile.color });
    setClubModal({ mode: 'edit', profile });
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
        } catch (e) {
          console.error(e);
          Alert.alert("Error", "No se pudo eliminar el club.");
        }
      }
    });
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
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: '700', color: '#fff' }}>Clubes</Text>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
            Seleccioná un club o creá uno nuevo
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          {/* ── Lista de Clubes ── */}
          <View style={styles`flex-row items-center justify-between mb-4`}>
            <View style={styles`flex-row items-center gap-2`}>
              <Building2 size={20} color={colors.textMain} />
              <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textMain }}>TUS CLUBES</Text>
            </View>
          </View>

          {profiles.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
              <Building2 size={48} color={colors.textMuted} />
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.textMain, marginTop: 16 }}>Sin clubes aún</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center', marginBottom: 24 }}>Por favor crea un club para empezar.</Text>
              
              <TouchableOpacity 
                onPress={openAddClub}
                style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Plus size={20} color="#fff" />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>Crea tu primer club</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {profiles.map((profile: any) => (
                <View key={profile.id} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: profile.id === activeProfileId ? (profile.color || colors.primary) : colors.borderLight, backgroundColor: profile.id === activeProfileId ? `${profile.color || colors.primary}10` : colors.bgSurface, borderRadius: 16 }}>
                  <TouchableOpacity 
                    onPress={() => handleSwitchClub(profile.id)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${profile.color || colors.primary}20`, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                      <Building2 size={20} color={profile.color || colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, color: colors.textMain }}>{profile.clubName}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>{profile.city} · {roleLabel[profile.role] || profile.role}</Text>
                    </View>
                    {profile.id === activeProfileId && (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: profile.color || colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <View style={{ flexDirection: 'row', paddingRight: 16, gap: 12 }}>
                    <TouchableOpacity onPress={() => openEditClub(profile)}>
                      <Pencil size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteClub(profile)}>
                      <Trash2 size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                onPress={openAddClub}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: `${colors.primary}05`, borderRadius: 16, borderWidth: 1, borderColor: `${colors.primary}30`, marginTop: 8 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Plus size={20} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primary }}>Crear nuevo club</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add / Edit Club Modal ── */}
      <Modal visible={clubModal !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>
                  {clubModal?.mode === 'add' ? 'Agregar Club' : 'Editar Club'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClubModal(null)} style={{ padding: 4, backgroundColor: colors.borderLight, borderRadius: 16 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginBottom: 4 }}>NOMBRE DEL CLUB</Text>
            <TextInput 
              value={clubForm.clubName} 
              onChangeText={t => setClubForm(f => ({ ...f, clubName: t }))} 
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: colors.textMain, backgroundColor: colors.bgMain }} 
              placeholder="Ej: Club Atlético..."
              placeholderTextColor={colors.textMuted}
            />
            
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginBottom: 4 }}>CIUDAD / SEDE</Text>
            <TextInput 
              value={clubForm.city} 
              onChangeText={t => setClubForm(f => ({ ...f, city: t }))} 
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20, color: colors.textMain, backgroundColor: colors.bgMain }} 
              placeholder="Ej: Buenos Aires"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginBottom: 8 }}>COLOR PRINCIPAL</Text>
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
              style={{ backgroundColor: clubForm.clubName.trim() ? colors.success : colors.textMuted, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' }}>
                {clubModal?.mode === 'add' ? 'AGREGAR CLUB' : 'GUARDAR CAMBIOS'}
              </Text>
            </TouchableOpacity>
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
