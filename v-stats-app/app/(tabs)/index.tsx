import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronDown, Play, Share } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ClubSelectorModal, TeamSelectorModal, ActiveMatchModal } from '../../src/features/home/components/HomeModals';

let hasCheckedActiveMatchOnAppStart = false;

export default function HomeScreen() {
  const router = useRouter();
  const { styles, colors, fonts, themeMode } = useStyles();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { coach, profiles, activeProfile, switchProfile, isLoading } = useProfile();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [teamStats, setTeamStats] = useState<ClubStats | null>(null);
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
        console.error('Error parsing saved match', e);
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

  useEffect(() => {
    if (activeProfile?.teams && activeProfile.teams.length > 0 && !activeTeamId) {
      setActiveTeamId(activeProfile.teams[0].id);
    }
  }, [activeProfile, activeTeamId]);

  const activeTeam = activeProfile?.teams?.find((t) => t.id === activeTeamId) || activeProfile?.teams?.[0];

  useEffect(() => {
    if (activeTeam) {
      loadRecentMatches(activeTeam.id);
      loadTeamStats(activeProfile.id, activeTeam.id);
    }
  }, [activeTeam, activeProfile.id]);

  const loadTeamStats = async (clubId: string, teamId: string) => {
    if (clubId === '__empty__') return;
    try {
      const res = await statsService.getClubStats(clubId, teamId);
      if (res.data) setTeamStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRecentMatches = async (teamId: string) => {
    const res = await matchesService.getMatches(teamId, 'finished');
    if (res.data?.matches) {
      setRecentMatches(res.data.matches.slice(0, 3));
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

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
  const winsCount = activeTeamMatches.filter((m) => m.result === 'WIN').length;
  const lossesCount = activeTeamMatches.filter((m) => m.result === 'LOSS').length;
  const totalMatchesCount = activeTeamMatches.length;
  const winRatePercent = totalMatchesCount > 0 ? Math.round((winsCount / totalMatchesCount) * 100) : 0;

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

      <ScrollView contentContainerStyle={[styles`px-4 pb-24 gap-6`, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* ── Header ── */}
        <View style={{ paddingBottom: 24 }}>
          <View style={styles`flex-row items-center justify-between`}>
            <View style={styles`flex-row items-center gap-3`}>
              <Avatar name={coach.name} size={44} onPress={() => router.push('/manage-settings')} />
              <View>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>
                  Bienvenido, <Text style={{ fontFamily: fonts.bodyBold, color: colors.textMain }}>{firstName}</Text>!
                </Text>
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

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/partido')}
          activeOpacity={0.8}
          style={[
            styles`w-full flex-row items-center justify-center gap-2`,
            { marginTop: 16, marginBottom: 32, borderRadius: 12, backgroundColor: '#1C64F2', paddingVertical: 14, elevation: 4, shadowColor: '#1C64F2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
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
      </ScrollView>

      <ClubSelectorModal
        visible={showClubSelector}
        onClose={() => setShowClubSelector(false)}
        profiles={profiles}
        activeProfileId={activeProfile?.id}
        onSelect={(id: string) => {
          switchProfile(id);
          setActiveTeamId(null);
          setShowClubSelector(false);
        }}
      />

      <TeamSelectorModal
        visible={showTeamSelector}
        onClose={() => setShowTeamSelector(false)}
        teams={activeProfile?.teams}
        activeTeamId={activeTeamId}
        onSelect={(id: string) => {
          setActiveTeamId(id);
          setShowTeamSelector(false);
        }}
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
          Alert.alert(
            'Eliminar partido',
            'Estas seguro de que queres eliminar el partido en curso? Se perdera todo el progreso.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                  await storage.removeItem('vstats-active-match');
                  setShowActiveMatchModal(false);
                  setActiveMatch(null);
                },
              },
            ]
          );
        }}
      />
    </View>
  );
}
