import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Camera, User, Shield, Bell, MapPin, Building2, Lock, Fingerprint, LogOut, Trash2, Check, ShieldCheck, ShieldAlert, ShieldOff, Plus, Pencil, MoreHorizontal } from 'lucide-react-native';
import { useStyles } from '../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';

type AccessRole = 'admin' | 'coach' | 'assistant';
type ClubProfile = { id: string; clubName: string; city: string; role: AccessRole; color: string; };
type SecurityLevel = 'none' | 'pin' | 'biometric';

const PROFILE_COLORS = ['#1E6FD9', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2'];

export default function ConfigScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  
  const { logout } = useAuth();
  const { coach, profiles, activeProfile, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile } = useProfile();

  // ── Coach profile editing ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(coach.name);
  const [tempEmail, setTempEmail] = useState(coach.email);

  // ── Club profile management ──
  const [clubModal, setClubModal] = useState<{ mode: 'add' | 'edit'; profile?: ClubProfile } | null>(null);
  const [clubForm, setClubForm] = useState({ clubName: '', city: '', role: 'admin' as AccessRole, color: PROFILE_COLORS[0] });
  const [deleteConfirm, setDeleteConfirm] = useState<ClubProfile | null>(null);
  const [actionSheetProfile, setActionSheetProfile] = useState<ClubProfile | null>(null);

  // ── Security ──
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('none');
  const [accessRole, setAccessRole] = useState<AccessRole>(activeProfile.role as AccessRole);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'set' | 'confirm'>('set');
  const [firstPin, setFirstPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ── Notifications ──
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifStats, setNotifStats] = useState(true);
  const [notifReminders, setNotifReminders] = useState(false);

  // ── Logout ──
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ── Handlers ── */
  const handleAvatarChange = () => {
    Alert.alert("Cambiar Foto", "Acá conectaríamos expo-image-picker para abrir la galería del celular.");
  };

  const saveProfile = () => {
    Alert.alert("No disponible", "La edición de perfil se implementará próximamente.");
    setEditingProfile(false);
  };

  const openAddClub = () => {
    setClubForm({ clubName: '', city: '', role: 'admin', color: PROFILE_COLORS[0] });
    setClubModal({ mode: 'add' });
  };

  const openEditClub = (profile: ClubProfile) => {
    setClubForm({ clubName: profile.clubName, city: profile.city, role: profile.role, color: profile.color });
    setClubModal({ mode: 'edit', profile });
    setActionSheetProfile(null);
  };

  const saveClub = () => {
    if (!clubForm.clubName.trim()) return;
    
    // 📍 USAMOS LAS FUNCIONES DEL CONTEXTO
    if (clubModal?.mode === 'add') {
      addProfile(clubForm);
    } else if (clubModal?.mode === 'edit' && clubModal.profile) {
      updateProfile(clubModal.profile.id, clubForm);
    }
    setClubModal(null);
  };

  const confirmDelete = (profile: ClubProfile) => {
    setDeleteConfirm(profile);
    setActionSheetProfile(null);
  };

  const handleSecurityLevel = (level: SecurityLevel) => {
    if (level === 'pin') {
      setPinStep('set'); setPinInput(''); setFirstPin(''); setPinError('');
      setShowPinModal(true);
    } else {
      setSecurityLevel(level);
      setPin('');
    }
  };

  const handlePinDigit = (d: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinStep === 'set') {
          setFirstPin(next); setPinStep('confirm'); setPinInput(''); setPinError('');
        } else {
          if (next === firstPin) {
            setPin(next); setSecurityLevel('pin'); setShowPinModal(false);
          } else {
            setPinError('Los PINs no coinciden.');
            setPinInput(''); setPinStep('set'); setFirstPin('');
          }
        }
      }, 150);
    }
  };

  const rolesConfig: { id: AccessRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'admin', label: 'Administrador', desc: 'Acceso total: equipos, partidos, estadísticas y configuración.', icon: <ShieldCheck size={20} />, color: '#1E6FD9' },
    { id: 'coach', label: 'Entrenador', desc: 'Carga de datos en vivo y visualización de estadísticas.', icon: <ShieldAlert size={20} />, color: '#D97706' },
    { id: 'assistant', label: 'Asistente', desc: 'Solo carga de datos durante el partido.', icon: <ShieldOff size={20} />, color: '#64748B' },
  ];

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles`bg-header`, { paddingTop: 60 }]}>
        <View style={styles`flex-row items-center gap-3 px-4 pb-6`}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <ArrowLeft size={16} color="#fff" />
          </TouchableOpacity>
          <View style={styles`flex-1`}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>V-STATS</Text>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#fff' }}>Configuración</Text>
          </View>
        </View>

        {/* Profile Hero */}
        <View style={styles`items-center pb-7 px-4`}>
          <View style={{ marginBottom: 12 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E6FD9', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 28, fontWeight: '700', color: '#fff' }}>{initials}</Text>
            </View>
            <TouchableOpacity onPress={handleAvatarChange} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#3D8EF5', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0D1F33' }}>
              <Camera size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#fff' }}>{coach.name}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{coach.email}</Text>
          <View style={styles`flex-row items-center gap-2 mt-4`}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeProfile.color }} />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{activeProfile.clubName}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles`px-4 pt-5 pb-12 gap-5`}>



        {/* ── Perfil del entrenador ── */}
        <Section title="PERFIL" icon={<User size={16} color="#64748B" />}>
          <SettingRow label="Nombre" value={coach.name} onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true); }} />
          <Divider />
          <SettingRow label="Correo electrónico" value={coach.email} onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true); }} />
        </Section>

        {/* ── Seguridad ── */}
        <Section title="SEGURIDAD" icon={<Shield size={16} color="#64748B" />}>
          <View style={styles`px-4 pt-3 pb-1`}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B' }}>NIVEL DE PROTECCIÓN</Text>
          </View>
          <View style={styles`flex-row px-3 pb-3 gap-2`}>
            {([
              { id: 'none' as SecurityLevel, label: 'Ninguna', icon: <Lock size={16} /> },
              { id: 'pin' as SecurityLevel, label: 'PIN', icon: <Lock size={16} /> },
              { id: 'biometric' as SecurityLevel, label: 'Biométrico', icon: <Fingerprint size={16} /> },
            ]).map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleSecurityLevel(opt.id)}
                style={[
                    styles`flex-1 items-center py-3 rounded-xl border`, 
                    { 
                    borderColor: securityLevel === opt.id ? '#1E6FD9' : '#E2E8F0', 
                    backgroundColor: securityLevel === opt.id ? 'rgba(30,111,217,0.05)' : '#fff' 
                    }
                ]}
                >
                <View style={{ marginBottom: 4 }}>
                  {React.cloneElement(opt.icon as any, { color: securityLevel === opt.id ? '#1E6FD9' : '#64748B' })}
                </View>
                
                <Text style={{ 
                    fontFamily: 'Gotham Rounded', 
                    fontSize: 12, 
                    color: securityLevel === opt.id ? '#1E6FD9' : '#0D1F33', 
                    fontWeight: securityLevel === opt.id ? '600' : '400',
                    marginTop: 4 
                }}>
                    {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {securityLevel === 'pin' && pin && (
            <View>
              <Divider />
              <SettingRow label="Cambiar PIN" value="" onPress={() => { setPinStep('set'); setPinInput(''); setFirstPin(''); setPinError(''); setShowPinModal(true); }} />
            </View>
          )}

          <Divider />
          <TouchableOpacity onPress={() => setShowRoleModal(true)} style={styles`flex-row items-center justify-between px-4 py-3`}>
            <View>
              <Text style={{ fontSize: 15, color: '#0D1F33' }}>Rol de acceso</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{rolesConfig.find(r => r.id === accessRole)?.label}</Text>
            </View>
            <View style={styles`flex-row items-center gap-2`}>
              <RolePill role={accessRole} small />
              <ChevronRight size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </Section>

        {/* ── Notificaciones ── */}
        <Section title="NOTIFICACIONES" icon={<Bell size={16} color="#64748B" />}>
          <SwitchRow label="Partidos programados" desc="Recordatorio 1h antes del partido" value={notifMatches} onChange={setNotifMatches} />
          <Divider />
          <SwitchRow label="Nuevas estadísticas" desc="Cuando se procesen los datos del partido" value={notifStats} onChange={setNotifStats} />
          <Divider />
          <SwitchRow label="Recordatorios de carga" desc="Si hay un partido sin datos registrados" value={notifReminders} onChange={setNotifReminders} />
        </Section>

        {/* ── Cuenta ── */}
        <Section title="CUENTA" icon={<Shield size={16} color="#64748B" />}>
          <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles`flex-row items-center gap-3 px-4 py-3.5`}>
            <LogOut size={16} color="#64748B" />
            <Text style={{ fontSize: 15, color: '#0D1F33' }}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles`flex-row items-center gap-3 px-4 py-3.5`}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={{ fontSize: 15, color: '#EF4444' }}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </Section>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#CBD5E1' }}>V-Stats · v1.0.0 · Hecho para entrenadores 🏐</Text>
      </ScrollView>

      {/* ── Modales Nativos ── */}

      {/* Action Sheet para Opciones de Club */}
      <Modal visible={actionSheetProfile !== null} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Opciones: {actionSheetProfile?.clubName}</Text>
            
            <TouchableOpacity onPress={() => openEditClub(actionSheetProfile!)} style={styles`flex-row items-center gap-3 py-4`}>
              <Pencil size={20} color="#64748B" />
              <Text style={{ fontSize: 16, color: '#0D1F33' }}>Editar información</Text>
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity onPress={() => confirmDelete(actionSheetProfile!)} style={styles`flex-row items-center gap-3 py-4`}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={{ fontSize: 16, color: '#EF4444' }}>Eliminar club</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActionSheetProfile(null)} style={{ width: '100%', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile */}
      <Modal visible={editingProfile} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33', marginBottom: 16 }}>Editar Perfil</Text>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>NOMBRE</Text>
            <TextInput value={tempName} onChangeText={setTempName} style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>CORREO ELECTRÓNICO</Text>
            <TextInput value={tempEmail} onChangeText={setTempEmail} keyboardType="email-address" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 24 }} />
            <View style={styles`flex-row gap-3`}>
              <TouchableOpacity onPress={() => setEditingProfile(false)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} style={{ flex: 1, backgroundColor: '#1E6FD9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Club */}
      <Modal visible={clubModal !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33', marginBottom: 16 }}>{clubModal?.mode === 'add' ? 'Agregar Club' : 'Editar Club'}</Text>
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>NOMBRE DEL CLUB</Text>
            <TextInput value={clubForm.clubName} onChangeText={t => setClubForm(f => ({ ...f, clubName: t }))} style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12 }} />
            
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 4 }}>CIUDAD / SEDE</Text>
            <TextInput value={clubForm.city} onChangeText={t => setClubForm(f => ({ ...f, city: t }))} style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }} />

            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 8 }}>COLOR DE PERFIL</Text>
            <View style={styles`flex-row gap-2 mb-24`}>
              {PROFILE_COLORS.map(color => (
                <TouchableOpacity key={color} onPress={() => setClubForm(f => ({ ...f, color }))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
                  {clubForm.color === color && <Check size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles`flex-row gap-3`}>
              <TouchableOpacity onPress={() => setClubModal(null)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!clubForm.clubName.trim()} onPress={saveClub} style={{ flex: 1, backgroundColor: clubForm.color, paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: clubForm.clubName.trim() ? 1 : 0.5 }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>{clubModal?.mode === 'add' ? 'AGREGAR' : 'GUARDAR'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pin pad */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(30,111,217,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Lock size={20} color="#1E6FD9" />
            </View>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33', marginBottom: 4 }}>{pinStep === 'set' ? 'Crear PIN' : 'Confirmar PIN'}</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 }}>{pinStep === 'set' ? 'Ingresá un PIN de 4 dígitos' : 'Ingresá el PIN nuevamente para confirmar'}</Text>
            
            {pinError ? <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{pinError}</Text> : null}

            <View style={styles`flex-row gap-4 mb-6`}>
              {[0,1,2,3].map(i => (
                <View key={i} style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: i < pinInput.length ? '#1E6FD9' : '#CBD5E1', backgroundColor: i < pinInput.length ? '#1E6FD9' : 'transparent' }} />
              ))}
            </View>

            <View style={[styles`flex-row flex-wrap justify-between`, { width: 240, gap: 12 }]}>
               {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
                <TouchableOpacity key={i} onPress={() => { if (key === '⌫') setPinInput(p => p.slice(0, -1)); else if (key) handlePinDigit(key); }} disabled={key === ''} style={{ width: 68, height: 56, borderRadius: 12, backgroundColor: key ? '#F4F7FB' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '600', color: '#0D1F33' }}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowPinModal(false)} style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 14, color: '#64748B' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete / Logout simplificados para el ejemplo */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
             <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <LogOut size={24} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33', marginBottom: 8 }}>¿Cerrar sesión?</Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 }}>Vas a salir de tu cuenta. Tus datos quedarán guardados.</Text>
            <View style={styles`flex-row gap-3`}>
              <TouchableOpacity onPress={() => setShowLogoutModal(false)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { logout(); router.replace('/'); }} style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>SALIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Shared sub-components ── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const { styles } = useStyles();
  return (
    <View>
      <View style={styles`flex-row items-center gap-1.5 mb-2 px-1`}>
        {icon}
        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, letterSpacing: 1.5, color: '#64748B', fontWeight: '600' }}>{title}</Text>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>{children}</View>
    </View>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { styles } = useStyles();
  return (
    <TouchableOpacity onPress={onPress} style={styles`w-full flex-row items-center justify-between px-4 py-3.5`}>
      <Text style={{ fontSize: 15, color: '#0D1F33' }}>{label}</Text>
      <View style={styles`flex-row items-center gap-2`}>
        <Text style={{ fontSize: 14, color: '#64748B' }} numberOfLines={1}>{value}</Text>
        <ChevronRight size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

function SwitchRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  const { styles } = useStyles();
  return (
    <View style={styles`flex-row items-center justify-between px-4 py-3.5`}>
      <View style={styles`flex-1 pr-3`}>
        <Text style={{ fontSize: 15, color: '#0D1F33' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{desc}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onChange} 
        trackColor={{ false: '#E2E8F0', true: '#1E6FD9' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F4F7FB', marginHorizontal: 16 }} />;
}

function RolePill({ role, small }: { role: AccessRole; small?: boolean }) {
  const map: Record<AccessRole, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: '#1E6FD9', bg: 'rgba(30,111,217,0.1)' },
    coach: { label: 'Entrenador', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
    assistant: { label: 'Asistente', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  };
  const { label, color, bg } = map[role];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 }}>
      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: small ? 11 : 12, letterSpacing: 0.5, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}