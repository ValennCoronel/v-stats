import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Home, BarChart3, Settings, Plus, ChevronDown, Check, Building2, X } from 'lucide-react-native';
import { useStyles } from '../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { storage } from '../src/services/storage.service';

let hasCheckedActiveMatchOnAppStart = false;

export default function HomeScreen() {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { coach, profiles, activeProfile, activeProfileId, switchProfile, addTeam, isLoading } = useProfile();
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamName, setTeamName] = useState('');

  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [showActiveMatchModal, setShowActiveMatchModal] = useState(false);

  const checkActiveMatch = useCallback(async () => {
    const saved = await storage.getItem('vstats-active-match');
    const isFirstCheck = !hasCheckedActiveMatchOnAppStart;
    hasCheckedActiveMatchOnAppStart = true;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveMatch(parsed);
        if (isFirstCheck) {
          setShowActiveMatchModal(true);
        }
      } catch (e) {
        console.error("Error parsing saved match", e);
      }
    } else {
      setActiveMatch(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        checkActiveMatch();
      }
    }, [isAuthenticated, checkActiveMatch])
  );

  useEffect(() => {
    return () => {
      hasCheckedActiveMatchOnAppStart = false;
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color="#1E6FD9" />
        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, color: '#64748B', marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles`bg-header px-4`, { paddingTop: 60, paddingBottom: 24 }]}>
        <View style={styles`flex-row items-center justify-between mb-4`}>
          
          {/* Coach info */}
          <View style={styles`flex-row items-center gap-4`}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E6FD9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: '#fff' }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Bienvenido,</Text>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#fff' }}>{coach.name}</Text>
            </View>
          </View>

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

      {/* ── Teams List ── */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}>
        {activeMatch && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: '/match/new',
                params: { resume: 'true' }
              });
            }}
            style={{ 
              backgroundColor: 'rgba(30,111,217,0.08)', 
              borderColor: '#1E6FD9', 
              borderWidth: 1.5, 
              borderRadius: 16, 
              padding: 16, 
              marginBottom: 20, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(30,111,217,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>🏐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '700', color: '#1E6FD9', letterSpacing: 0.5 }}>
                  PARTIDO EN CURSO
                </Text>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 15, fontWeight: '600', color: '#0D1F33', marginTop: 2 }} numberOfLines={1}>
                  vs {activeMatch.metadata?.rival || "Rival"}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Set {activeMatch.currentSet} · {activeMatch.homeScore} - {activeMatch.awayScore}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#1E6FD9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
                REANUDAR
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {profiles.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
            <Building2 size={48} color="#94a3b8" />
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33', marginTop: 16 }}>Sin clubes aún</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center', marginBottom: 8 }}>Crea tu primer club para empezar a gestionar tus equipos.</Text>
            <TouchableOpacity onPress={() => router.push('/club')} style={{ marginTop: 16, backgroundColor: '#1E6FD9', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Plus size={20} color="#fff" />
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>CREAR MI PRIMER CLUB</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles`flex-row items-center justify-between mb-4`}>
              <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '700', color: '#0D1F33' }}>MIS EQUIPOS</Text>
              <Text style={styles`text-slate`}>{activeProfile.teams.length} equipos</Text>
            </View>

            {activeProfile.teams.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                <Building2 size={48} color="#94a3b8" />
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 18, fontWeight: '600', color: '#0D1F33', marginTop: 16 }}>Sin equipos aún</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Agregá el primer equipo de {activeProfile.clubName}</Text>
              </View>
            ) : (
              activeProfile.teams.map((team) => (
                <TouchableOpacity 
                  key={team.id}
                  activeOpacity={0.9}
                  style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}
                  onPress={() => router.push(`/team/${team.id}`)}
                >
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: activeProfile.color }} />
                  
                  <View style={{ paddingLeft: 8 }}>
                    <View style={styles`flex-row items-center justify-between mb-4`}>
                      <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '600', color: '#0D1F33' }}>{team.name}</Text>
                      <View style={{ backgroundColor: activeProfile.color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 11, color: '#fff', letterSpacing: 1 }}>VÓLEY</Text>
                      </View>
                    </View>

                    <View style={styles`flex-row justify-between`}>
                      <View>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>Partidos Jugados</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>{team.matchCount}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {profiles.length > 0 && (
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => { setTeamName(''); setShowAddTeam(true); }}
          style={{ position: 'absolute', bottom: 90, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: activeProfile.color, justifyContent: 'center', alignItems: 'center', boxShadow: `0px 4px 8px ${activeProfile.color}66` }}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 24 }}>
        <TouchableOpacity style={styles`items-center`}>
          <Home size={24} color={activeProfile.color} />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: activeProfile.color, marginTop: 4 }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles`items-center`}
          onPress={() => router.push(`/stats/${activeProfile.id}`)}
        >
          <BarChart3 size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles`items-center`} onPress={() => router.push('/club')}>
          <Building2 size={24} color="#64748B" />
          <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 12, color: '#64748B', marginTop: 4 }}>Club</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Team Modal ── */}
      <Modal visible={showAddTeam} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Nuevo Equipo</Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Agregar equipo en <Text style={{ fontWeight: 'bold' }}>{activeProfile.clubName}</Text></Text>
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
              autoFocus
            />

            <View style={styles`flex-row gap-4`}>
              <TouchableOpacity 
                onPress={handleAddTeam}
                disabled={!teamName.trim()}
                style={{ flex: 1, backgroundColor: teamName.trim() ? '#16A34A' : '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>AGREGAR</Text>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Active Match Resuming Modal ── */}
      <Modal visible={showActiveMatchModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏐</Text>
            <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 22, fontWeight: '700', color: '#0D1F33', marginBottom: 8, textAlign: 'center' }}>
              Partido en Curso
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 16 }}>
              Tenés un partido sin finalizar contra:
            </Text>
            
            {activeMatch && (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 20, fontWeight: '700', color: '#1E6FD9' }}>
                  {activeMatch.metadata?.rival || "Rival"}
                </Text>
                {activeMatch.metadata?.torneo ? (
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {activeMatch.metadata.torneo}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                    Set {activeMatch.currentSet}
                  </Text>
                  <Text style={{ color: '#CBD5E1' }}>|</Text>
                  <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                    Marcador: {activeMatch.homeScore} - {activeMatch.awayScore}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity 
                onPress={() => {
                  setShowActiveMatchModal(false);
                  router.push({
                    pathname: '/match/new',
                    params: { resume: 'true' }
                  });
                }} 
                style={{ backgroundColor: '#1E6FD9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  VOLVER AL PARTIDO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setShowActiveMatchModal(false)} 
                style={{ borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                  CONTINUAR NAVEGANDO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    "Eliminar partido",
                    "¿Estás seguro de que querés eliminar el partido en curso? Se perderá todo el progreso.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { 
                        text: "Eliminar", 
                        style: "destructive",
                        onPress: async () => {
                          await storage.removeItem('vstats-active-match');
                          setShowActiveMatchModal(false);
                          setActiveMatch(null);
                        }
                      }
                    ]
                  );
                }} 
                style={{ paddingVertical: 8, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded', fontSize: 14, fontWeight: '500', color: '#EF4444' }}>
                  Eliminar partido en curso
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}