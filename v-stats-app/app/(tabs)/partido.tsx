import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Modal, TextInput, FlatList, ActivityIndicator, Dimensions, PanResponder, Animated, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Users, Calendar, BarChart3, ChevronDown, Shield, Shirt, History, Check, Clock, ArrowLeft, X } from 'lucide-react-native';
import { useStyles } from '../../src/hooks/useStyles';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../../src/context/ProfileContext';
import { storage } from '../../src/services/storage.service';
import { Modal as CustomModal } from '../../src/components/ui/Modal';
import { Button } from '../../src/components/ui/Button';
import { MIN_PLAYERS_REQUIRED, canStartMatch as canStartMatchForm, hasMinimumPlayersSelected, toggleAllPlayers as toggleAllPlayersForm } from '../../src/features/matches/create-match-form';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => minute);

function createDefaultMatchDate() {
  return new Date();
}

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

export default function PartidoScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const insets = useSafeAreaInsets();
  const { activeProfile, profiles, switchProfile } = useProfile();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const lastConfirmDialog = useRef<any>(null);
  if (confirmDialog) {
    lastConfirmDialog.current = confirmDialog;
  }

  const checkActiveMatch = useCallback(async () => {
    const saved = await storage.getItem('vstats-active-match');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveMatch(parsed);
        setHasActiveMatch(true);
      } catch (e) {
        console.error("Error parsing saved match", e);
        setActiveMatch(null);
        setHasActiveMatch(false);
      }
    } else {
      setActiveMatch(null);
      setHasActiveMatch(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkActiveMatch();
    }, [checkActiveMatch])
  );

  // Auto-select first team if available
  useEffect(() => {
    if (activeProfile?.teams && activeProfile.teams.length > 0 && !activeTeamId) {
      setActiveTeamId(activeProfile.teams[0].id);
    }
  }, [activeProfile, activeTeamId]);

  const activeTeam = activeProfile?.teams?.find(t => t.id === activeTeamId) || activeProfile?.teams?.[0];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formRival, setFormRival] = useState('');
  const [formMatchDate, setFormMatchDate] = useState(createDefaultMatchDate());
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
          // Swipe down threshold met, close sheet
          Animated.timing(panY, {
            toValue: Dimensions.get('window').height,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setShowCreateModal(false);
        } else {
          // Snap back to top
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

  const handleCreateMatch = useCallback(() => {
    if (!formRival.trim() || selectedPlayerIds.length < MIN_PLAYERS_REQUIRED || !activeTeam) return;

    setShowCreateModal(false);

    // Pass data to the live match screen
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
    if (!activeTeam) return;
    const now = createDefaultMatchDate();
    setFormRival('');
    setFormTorneo('');
    setFormMatchDate(now);
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedPlayerIds(roster.map(p => p.id)); // select all by default
    panY.setValue(Dimensions.get('window').height); // Start off-screen
    setShowCreateModal(true);
  };

  const imageSource = themeMode === 'dark'
    ? require('../../assets/SaltoJugadorDarkMode.png')
    : require('../../assets/SaltoJugadorWhiteMode.png');

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles`px-5 pb-24 gap-6`}>
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 8 }}>
          <View style={styles`flex-row items-center justify-between`}>
            <View style={{ width: 24 }} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain, letterSpacing: 1 }}>
              PARTIDO
            </Text>
            <TouchableOpacity onPress={() => activeTeam?.id && router.push(`/team/${activeTeam.id}`)}>
              <History size={24} color={colors.textMain} />
            </TouchableOpacity>
          </View>
        </View>

        {hasActiveMatch && activeMatch ? (
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: '#1E6FD9', shadowColor: '#1E6FD9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>

            {/* Live Indicator */}
            <View style={styles`flex-row items-center justify-between mb-4`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: '#EF4444', letterSpacing: 0.5 }}>EN VIVO</Text>
              </View>
              {activeMatch.metadata?.torneo ? (
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                  {activeMatch.metadata.torneo}
                </Text>
              ) : null}
            </View>

            {/* Match Teams Title */}
            <View style={styles`items-center mb-4`}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.textMain, textAlign: 'center' }} numberOfLines={1}>
                {activeProfile?.clubName || 'Mi Club'}
              </Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary, marginVertical: 4 }}>vs</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: '#1E6FD9', textAlign: 'center' }} numberOfLines={1}>
                {activeMatch.metadata?.rival || 'Rival'}
              </Text>
            </View>

            {/* Scoreboard Block */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgMain, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight }}>
              {/* Home Score */}
              <View style={styles`items-center flex-1`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 48, color: '#1E6FD9', fontWeight: '700' }}>
                  {activeMatch.homeScore}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.textMuted, letterSpacing: 0.5 }}>LOCAL</Text>
              </View>

              {/* Set Score Divider */}
              <View style={styles`items-center px-4`}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMain }}>
                  Set {activeMatch.currentSet}
                </Text>
                <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.textMuted, marginTop: 4 }}>
                  {activeMatch.setsWon?.home ?? 0} - {activeMatch.setsWon?.away ?? 0}
                </Text>
              </View>

              {/* Away Score */}
              <View style={styles`items-center flex-1`}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 48, color: colors.textMain, fontWeight: '700' }}>
                  {activeMatch.awayScore}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.textMuted, letterSpacing: 0.5 }}>RIVAL</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles`gap-3`}>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/match/new',
                    params: { resume: 'true' }
                  });
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#1E6FD9',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  elevation: 2,
                  shadowColor: '#1E6FD9',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4
                }}
              >
                <Play size={16} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff', letterSpacing: 0.5 }}>
                  REANUDAR PARTIDO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setConfirmDialog({
                    visible: true,
                    title: "Eliminar partido",
                    message: "¿Estás seguro de que querés eliminar el partido en curso? Se perderá todo el progreso.",
                    onConfirm: async () => {
                      await storage.removeItem('vstats-active-match');
                      setActiveMatch(null);
                      setHasActiveMatch(false);
                    }
                  });
                }}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.danger }}>
                  Eliminar partido en curso
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Decorative Image */}
            <View style={styles`items-center justify-center`}>
              <View style={{ width: '90%', height: 240, position: 'relative', overflow: 'hidden' }}>
                <Image
                  source={imageSource}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
                {/* Top gradient overlay */}
                <LinearGradient
                  colors={[colors.screenBg, 'transparent']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, zIndex: 1 }}
                />
                {/* Bottom gradient overlay */}
                <LinearGradient
                  colors={['transparent', colors.screenBg]}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, zIndex: 1 }}
                />
                {/* Left gradient overlay */}
                <LinearGradient
                  colors={[colors.screenBg, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 30, zIndex: 1 }}
                />
                {/* Right gradient overlay */}
                <LinearGradient
                  colors={['transparent', colors.screenBg]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 30, zIndex: 1 }}
                />
              </View>
            </View>

            <View style={styles`items-center mb-6`}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, letterSpacing: 1, marginBottom: 8 }}>
                SIN PARTIDO ACTIVO
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                Seleccioná el club y equipo para{'\n'}iniciar un nuevo partido.
              </Text>
            </View>

            {/* Selectors */}
            <View style={styles`gap-4 mb-4`}>
              <View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                  CLUB
                </Text>
                <TouchableOpacity onPress={() => setShowClubSelector(true)} activeOpacity={0.7} style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <Shield size={22} color="#1C64F2" fill="#1C64F2" />
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMain }}>
                      {activeProfile?.clubName || 'Seleccionar club'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                  EQUIPO
                </Text>
                <TouchableOpacity onPress={() => setShowTeamSelector(true)} activeOpacity={0.7} style={[styles`flex-row items-center justify-between px-4 py-3 bg-surface rounded-xl border`, { borderColor: colors.borderLight }]}>
                  <View style={styles`flex-row items-center gap-3`}>
                    <Shirt size={22} color="#1C64F2" fill="#1C64F2" />
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textMain }}>
                      {activeTeam?.name || 'Seleccionar equipo'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Main CTA */}
            <TouchableOpacity
              onPress={handleStartMatch}
              activeOpacity={0.8}
              style={[
                styles`w-full flex-row items-center justify-center gap-2`,
                { marginTop: 16, marginBottom: 8, borderRadius: 12, backgroundColor: '#1C64F2', paddingVertical: 14, elevation: 4, shadowColor: '#1C64F2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
              ]}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <Play size={12} color="#1C64F2" fill="#1C64F2" style={{ marginLeft: 2 }} />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 1 }}>
                INICIAR PARTIDO
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Quick Access */}
        <View style={{ marginTop: 24 }}>
          <View style={styles`flex-row items-center justify-center mb-6`}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginHorizontal: 12 }}>
              ACCESOS RÁPIDOS
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
          </View>

          <View style={styles`flex-row justify-between gap-3`}>
            <QuickAccessCard icon={<Users size={20} color={colors.primary} />} title="Ver jugadores" subtitle="Del club" onPress={() => router.push('/manage-players?from=partido')} />
            <QuickAccessCard icon={<Calendar size={20} color={colors.primary} />} title="Próximo partido" subtitle="Próximamente" onPress={() => setShowPlaceholderModal(true)} />
            <QuickAccessCard icon={<BarChart3 size={20} color={colors.primary} />} title="Estadísticas" subtitle="Vista rápida" onPress={() => router.push('/stats/general')} />
          </View>
        </View>
      </ScrollView>

      {/* Club Selector Modal */}
      <CustomModal visible={showClubSelector} onClose={() => setShowClubSelector(false)}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Club</Text>
        {profiles?.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {
              switchProfile(profile.id);
              setActiveTeamId(null);
              setShowClubSelector(false);
            }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeProfile?.id === profile.id ? colors.primary : colors.textMain }}>{profile.clubName}</Text>
            {activeProfile?.id === profile.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
          </TouchableOpacity>
        ))}
        {(!profiles || profiles.length === 0) && (
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay clubes disponibles</Text>
        )}
      </CustomModal>

      {/* Team Selector Modal */}
      <CustomModal visible={showTeamSelector} onClose={() => setShowTeamSelector(false)}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.textMain, marginBottom: 16 }}>Seleccionar Equipo</Text>
        {activeProfile?.teams?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {
              setActiveTeamId(team.id);
              setShowTeamSelector(false);
            }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: activeTeamId === team.id ? colors.primary : colors.textMain }}>{team.name}</Text>
            {activeTeamId === team.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
          </TouchableOpacity>
        ))}
        {(!activeProfile?.teams || activeProfile.teams.length === 0) && (
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>No hay equipos disponibles</Text>
        )}
      </CustomModal>

      {/* Placeholder Modal */}
      <CustomModal visible={showPlaceholderModal} onClose={() => setShowPlaceholderModal(false)}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Calendar size={32} color={colors.primary} />
          </View>
          <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.textMain, marginBottom: 8, textAlign: 'center' }}>Próximamente</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Esta funcionalidad aún no está disponible. Pronto podrás ver el calendario de partidos.</Text>
          <Button variant="primary" onPress={() => setShowPlaceholderModal(false)} style={{ width: '100%' }}>Entendido</Button>
        </View>
      </CustomModal>

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

    </View>
  );
}

function QuickAccessCard({ icon, title, subtitle, onPress }: { icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void }) {
  const { colors, fonts } = useStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.quickCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }
      ]}
    >
      <View style={{ marginBottom: 12 }}>
        {icon}
      </View>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMain, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
