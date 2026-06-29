import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, FlatList, Dimensions, PanResponder, Animated, TouchableWithoutFeedback, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronDown, Play, Share, X, Users, Calendar, Shield, Shirt, Check, Clock } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { matchesService, Match } from '../../src/services/matches.service';
import { statsService, ClubStats } from '../../src/services/stats.service';
import { storage } from '../../src/services/storage.service';
import { Avatar } from '../../src/components/ui/Avatar';
import { ActiveMatchBanner } from '../../src/features/home/components/ActiveMatchBanner';
import { TeamSummaryCard } from '../../src/features/home/components/TeamSummaryCard';
import { RecentMatchesList } from '../../src/features/home/components/RecentMatchesList';
import { ClubSelectorModal, TeamSelectorModal, SharePlaceholderModal, ActiveMatchModal } from '../../src/features/home/components/HomeModals';
import { MIN_PLAYERS_REQUIRED, canStartMatch as canStartMatchForm, hasMinimumPlayersSelected, toggleAllPlayers as toggleAllPlayersForm } from '../../src/features/matches/create-match-form';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => minute);

function formatDateButton(date: Date) {
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeButton(date: Date) {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function setDateParts(base: Date, source: Date) {
  const next = new Date(base);
  next.setFullYear(source.getFullYear(), source.getMonth(), source.getDate());
  return next;
}

function setTimeParts(base: Date, hour: number, minute: number) {
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function buildCalendarDays(monthDate: Date) {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekDay = (startOfMonth.getDay() + 6) % 7;
  const totalDays = endOfMonth.getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = 0; index < startWeekDay; index++) {
    const date = new Date(startOfMonth);
    date.setDate(startOfMonth.getDate() - (startWeekDay - index));
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({ date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const lastDate = cells[cells.length - 1]?.date ?? endOfMonth;
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 1);
    cells.push({ date: nextDate, inMonth: false });
  }

  return cells;
}

let hasCheckedActiveMatchOnAppStart = false;

export default function HomeScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { coach, profiles, activeProfile, switchProfile, isLoading } = useProfile();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const activeTeam = activeProfile?.teams?.find(t => t.id === activeTeamId) || activeProfile?.teams?.[0];
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [showSharePlaceholder, setShowSharePlaceholder] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [teamStats, setTeamStats] = useState<ClubStats | null>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [showActiveMatchModal, setShowActiveMatchModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Create match form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formRival, setFormRival] = useState('');
  const [formMatchDate, setFormMatchDate] = useState(new Date());
  const [formTorneo, setFormTorneo] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const roster = activeProfile?.players || [];
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const hasEnoughSelectedPlayers = hasMinimumPlayersSelected(selectedPlayerIds);
  const canStartMatch = canStartMatchForm(formRival, selectedPlayerIds);

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 120) {
          Animated.timing(panY, {
            toValue: Dimensions.get('window').height,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setShowCreateModal(false);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            tension: 85,
            friction: 9,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (showCreateModal) {
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 85,
        friction: 9,
      }).start();
    }
  }, [showCreateModal]);

  const handleStartMatch = () => {
    if (!activeTeam) {
      Alert.alert("Error", "Por favor crea un equipo primero");
      return;
    }
    const now = new Date();
    setFormRival('');
    setFormTorneo('');
    setFormMatchDate(now);
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedPlayerIds(roster.map(p => p.id));
    panY.setValue(Dimensions.get('window').height);
    setShowCreateModal(true);
  };

  const handleCreateMatch = useCallback(() => {
    if (!formRival.trim() || selectedPlayerIds.length < MIN_PLAYERS_REQUIRED || !activeTeam) return;

    setShowCreateModal(false);

    router.push({
      pathname: '/match/new',
      params: {
        teamId: activeTeam.id,
        rival: formRival.trim(),
        fecha: formMatchDate.toISOString(),
        torneo: formTorneo.trim(),
        players: JSON.stringify(selectedPlayerIds),
      }
    });
  }, [formRival, formMatchDate, formTorneo, selectedPlayerIds, activeTeam, router]);

  const closeModalWithAnimation = useCallback(() => {
    Animated.timing(panY, {
      toValue: Dimensions.get('window').height,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowCreateModal(false);
  }, [panY]);

  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(pId => pId !== playerId)
        : [...prev, playerId]
    );
  }, []);

  const toggleAllPlayers = useCallback(() => {
    setSelectedPlayerIds(prev => toggleAllPlayersForm(prev, roster.map(player => player.id)));
  }, [roster]);

  const lastConfirmDialog = useRef<any>(null);
  if (confirmDialog) {
    lastConfirmDialog.current = confirmDialog;
  }

  const loadTeamStats = useCallback(async (clubId: string, teamId: string) => {
    if (clubId === '__empty__') return;
    try {
      const res = await statsService.getClubStats(clubId, teamId);
      if (res.data) setTeamStats(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadRecentMatches = useCallback(async (teamId: string) => {
    const res = await matchesService.getMatches(teamId, 'finished');
    if (res.data?.matches) {
      setRecentMatches(res.data.matches.slice(0, 3));
    }
  }, []);

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
        if (activeTeam) {
          loadRecentMatches(activeTeam.id);
          loadTeamStats(activeProfile.id, activeTeam.id);
        }
      }
    }, [isAuthenticated, checkActiveMatch, activeTeam, activeProfile.id, loadRecentMatches, loadTeamStats])
  );

  useEffect(() => {
    return () => {
      hasCheckedActiveMatchOnAppStart = false;
    };
  }, []);

  useEffect(() => {
    if (activeProfile?.teams && activeProfile.teams.length > 0 && !activeTeamId) {
      setActiveTeamId(activeProfile.teams[0].id);
    }
  }, [activeProfile, activeTeamId]);

  useEffect(() => {
    if (activeTeam) {
      loadRecentMatches(activeTeam.id);
      loadTeamStats(activeProfile.id, activeTeam.id);
    }
  }, [activeTeam, activeProfile.id, loadRecentMatches, loadTeamStats]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <View style={[styles`flex-1 bg-screen justify-center items-center`]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary, marginTop: 16 }}>Cargando datos...</Text>
      </View>
    );
  }

  const firstName = coach.name.split(' ')[0];

  const activeTeamMatches = activeTeam?.matches || [];
  const winsCount = teamStats ? teamStats.wins : activeTeamMatches.filter(m => m.result === 'WIN').length;
  const lossesCount = teamStats ? teamStats.losses : activeTeamMatches.filter(m => m.result === 'LOSS').length;
  const totalMatchesCount = teamStats ? teamStats.totalMatches : activeTeamMatches.length;
  const winRatePercent = teamStats ? teamStats.winRate : (totalMatchesCount > 0 ? Math.round((winsCount / totalMatchesCount) * 100) : 0);

  const attacks = teamStats?.attacks || 0;
  const attackErrors = teamStats?.attackErrors || 0;
  const attackEff = teamStats ? Math.round((attacks / Math.max(attacks + attackErrors, 1)) * 100) : 0;

  const defenses = teamStats?.defenses || 0;
  const receptionErrors = teamStats?.receptionErrors || 0;
  const receptionEff = teamStats ? Math.round((defenses / Math.max(defenses + receptionErrors, 1)) * 100) : 0;

  const aces = teamStats?.aces || 0;
  const serveErrors = teamStats?.serveErrors || 0;
  const serveEff = teamStats ? Math.round((aces / Math.max(aces + serveErrors, 1)) * 100) : 0;

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles`px-4 pb-24 gap-6`}>
        {/* ── Header ── */}
        <View style={{ paddingTop: 24, paddingBottom: 24 }}>
          <View style={styles`flex-row items-center justify-between`}>
            <View style={styles`flex-row items-center gap-3`}>
              <Avatar name={coach.name} size={44} onPress={() => router.push('/manage-settings')} />
              <View>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>¡Bienvenido, <Text style={{ fontFamily: fonts.bodyBold, color: colors.textMain }}>{firstName}</Text>!</Text>
                <TouchableOpacity 
                  style={styles`flex-row items-center gap-1 mt-0.5`}
                  onPress={() => setShowClubSelector(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMain }}>{activeProfile?.clubName || 'Mi Club'}</Text>
                  <ChevronDown size={16} color={colors.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <ActiveMatchBanner activeMatch={activeMatch} />

        <TeamSummaryCard 
          activeTeam={activeTeam}
          totalMatchesCount={totalMatchesCount}
          winsCount={winsCount}
          lossesCount={lossesCount}
          winRatePercent={winRatePercent}
          attackEff={attackEff}
          receptionEff={receptionEff}
          serveEff={serveEff}
          onSelectTeam={() => setShowTeamSelector(true)}
        />

        {/* ── Main CTA ── */}
        <TouchableOpacity
          onPress={handleStartMatch}
          activeOpacity={0.8}
          style={[
            styles`w-full flex-row items-center justify-center gap-2`,
            { marginTop: 16, marginBottom: 32, borderRadius: 12, backgroundColor: '#1C64F2', paddingVertical: 14, elevation: 4, shadowColor: '#1C64F2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
          ]}
        >
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <Play size={12} color="#1C64F2" fill="#1C64F2" style={{ marginLeft: 2 }} />
          </View>
          <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 1 }}>
            INICIAR PARTIDO
          </Text>
        </TouchableOpacity>

        <RecentMatchesList recentMatches={recentMatches} activeTeam={activeTeam} />

        {/* ── Compartir ── */}
        <TouchableOpacity
          onPress={() => setShowSharePlaceholder(true)}
          style={{ width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 }}
        >
          <Share size={18} color={colors.primary} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            COMPARTIR ESTADÍSTICAS
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <ClubSelectorModal 
        visible={showClubSelector} 
        onClose={() => setShowClubSelector(false)} 
        profiles={profiles} 
        activeProfileId={activeProfile?.id}
        onSelect={(id: string) => { switchProfile(id); setActiveTeamId(null); setShowClubSelector(false); }}
      />

      <TeamSelectorModal 
        visible={showTeamSelector} 
        onClose={() => setShowTeamSelector(false)} 
        teams={activeProfile?.teams} 
        activeTeamId={activeTeamId}
        onSelect={(id: string) => { setActiveTeamId(id); setShowTeamSelector(false); }}
      />

      <SharePlaceholderModal 
        visible={showSharePlaceholder} 
        onClose={() => setShowSharePlaceholder(false)} 
      />

      <ActiveMatchModal 
        visible={showActiveMatchModal} 
        onClose={() => setShowActiveMatchModal(false)} 
        activeMatch={activeMatch}
        onResume={() => {
          setShowActiveMatchModal(false);
          router.push({ pathname: '/match/new', params: { resume: 'true' } });
        }}
        onDelete={() => {
          setConfirmDialog({
            visible: true,
            title: "Eliminar partido",
            message: "¿Estás seguro de que querés eliminar el partido en curso? Se perderá todo el progreso.",
            onConfirm: async () => {
              await storage.removeItem('vstats-active-match');
              setShowActiveMatchModal(false);
              setActiveMatch(null);
            }
          });
        }}
      />

      {/* ── Confirm Modal ── */}
      <Modal visible={!!confirmDialog?.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain }}>
                  {confirmDialog?.title || lastConfirmDialog.current?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmDialog(null)} style={{ padding: 4, backgroundColor: colors.borderLight, borderRadius: 16 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, marginTop: 12, marginBottom: 24, lineHeight: 22 }}>
              {confirmDialog?.message || lastConfirmDialog.current?.message}
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

      {/* Create Match Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={closeModalWithAnimation}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={closeModalWithAnimation}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: Dimensions.get('window').height * 0.85,
                transform: [{ translateY: panY }]
              }}
            >
              {/* Handle Draggable Area */}
              <View
                {...panResponder.panHandlers}
                style={{ width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 }}
              >
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
              </View>

              <View style={{ padding: 24, paddingTop: 10, paddingBottom: 0 }}>
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 24, fontWeight: '700', color: '#0D1F33' }}>Nuevo Partido</Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{activeTeam?.name || ''}</Text>

                {/* Rival */}
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>RIVAL (REQUERIDO)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 }}
                  placeholder="Nombre del rival"
                  value={formRival}
                  onChangeText={setFormRival}
                />

                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>FECHA Y HORA</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowDatePickerModal(true)}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC' }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30,111,217,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                      <Calendar size={18} color="#1E6FD9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Fecha</Text>
                      <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                        {formatDateButton(formMatchDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowTimePickerModal(true)}
                    style={{ width: 132, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC' }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30,111,217,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                      <Clock size={18} color="#1E6FD9" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Hora</Text>
                      <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>
                        {formatTimeButton(formMatchDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Torneo */}
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 12, color: '#64748B', letterSpacing: 1, marginBottom: 8 }}>TORNEO (OPCIONAL)</Text>
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
                  <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 14, color: '#64748B', letterSpacing: 1 }}>JUGADORES CONVOCADOS</Text>
                  <View style={{ backgroundColor: '#1E6FD9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 13, fontWeight: '700', color: '#fff' }}>
                      {selectedPlayerIds.length} {selectedPlayerIds.length === 1 ? 'jugador' : 'jugadores'} seleccionados
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontSize: 12, color: hasEnoughSelectedPlayers ? '#64748B' : '#EF4444' }}>
                    Se necesitan al menos {MIN_PLAYERS_REQUIRED} jugadoras para comenzar.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleAllPlayers}
                    style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                  >
                    <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 13, fontWeight: '600', color: '#1E6FD9' }}>
                      {selectedPlayerIds.length === roster.length ? 'DESMARCAR TODO' : 'MARCAR TODO'}
                    </Text>
                  </TouchableOpacity>
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
                          <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 15, fontWeight: '700', color: isSelected ? '#fff' : '#64748B' }}>
                            {item.number}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>{item.name}</Text>
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
                    onPress={closeModalWithAnimation}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 14, fontWeight: '600', textAlign: 'center', width: '100%', paddingHorizontal: 4 }}
                    >
                      CANCELAR
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="start-match-button"
                    onPress={handleCreateMatch}
                    disabled={!canStartMatch}
                    style={{
                      flex: 1, backgroundColor: canStartMatch ? '#1E6FD9' : '#CBD5E1',
                      paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center', width: '100%', paddingHorizontal: 4 }}
                    >
                      COMENZAR PARTIDO
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePickerModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 24, fontWeight: '700', color: '#0D1F33', marginBottom: 4 }}>Elegir fecha</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>El partido arranca con la fecha de hoy por defecto.</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 18, color: '#0D1F33' }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 20, fontWeight: '600', color: '#0D1F33' }}>
                {formatMonthLabel(calendarMonth)}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 18, color: '#0D1F33' }}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {WEEK_DAYS.map(day => (
                <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 13, color: '#94A3B8' }}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              {calendarDays.map(({ date, inMonth }) => {
                const isSelected = sameDay(date, formMatchDate);
                const isToday = sameDay(date, new Date());
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    activeOpacity={0.8}
                    onPress={() => setFormMatchDate(prev => setDateParts(prev, date))}
                    style={{
                      width: '14.2857%',
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#1E6FD9' : 'transparent',
                        borderWidth: !isSelected && isToday ? 1 : 0,
                        borderColor: '#1E6FD9',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Gotham Rounded Bold',
                          fontSize: 18,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#fff' : inMonth ? '#0D1F33' : '#CBD5E1',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  setFormMatchDate(prev => setDateParts(prev, today));
                  setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
                style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>HOY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(false)}
                style={{ flex: 1, backgroundColor: '#1E6FD9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#fff' }}>LISTO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePickerModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 24, fontWeight: '700', color: '#0D1F33', marginBottom: 4 }}>Elegir hora</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Usamos la hora actual como punto de partida.</Text>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 14, color: '#64748B', letterSpacing: 1, marginBottom: 10 }}>HORA</Text>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {HOUR_OPTIONS.map(hour => {
                    const isSelected = formMatchDate.getHours() === hour;
                    return (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => setFormMatchDate(prev => setTimeParts(prev, hour, prev.getMinutes()))}
                        style={{
                          paddingVertical: 12,
                          borderRadius: 10,
                          alignItems: 'center',
                          marginBottom: 6,
                          backgroundColor: isSelected ? '#1E6FD9' : '#F8FAFC',
                        }}
                      >
                        <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 22, fontWeight: '600', color: isSelected ? '#fff' : '#0D1F33' }}>
                          {String(hour).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 14, color: '#64748B', letterSpacing: 1, marginBottom: 10 }}>MINUTOS</Text>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {MINUTE_OPTIONS.map(minute => {
                    const isSelected = formMatchDate.getMinutes() === minute;
                    return (
                      <TouchableOpacity
                        key={minute}
                        onPress={() => setFormMatchDate(prev => setTimeParts(prev, prev.getHours(), minute))}
                        style={{
                          paddingVertical: 12,
                          borderRadius: 10,
                          alignItems: 'center',
                          marginBottom: 6,
                          backgroundColor: isSelected ? '#1E6FD9' : '#F8FAFC',
                        }}
                      >
                        <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 22, fontWeight: '600', color: isSelected ? '#fff' : '#0D1F33' }}>
                          {String(minute).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setFormMatchDate(prev => {
                  const now = new Date();
                  return setTimeParts(prev, now.getHours(), now.getMinutes());
                })}
                style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>AHORA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTimePickerModal(false)}
                style={{ flex: 1, backgroundColor: '#1E6FD9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Gotham Rounded Bold', fontSize: 16, fontWeight: '600', color: '#fff' }}>LISTO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}