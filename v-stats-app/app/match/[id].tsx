import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, RotateCcw, Plus } from "lucide-react-native";
import { useStyles } from "../../src/hooks/useStyles";
import { StatusBar } from "expo-status-bar";
import { useProfile } from "../../src/context/ProfileContext";
import { matchesService } from "../../src/services/matches.service";

type Player = { id: string; number: string; name: string; position: string; isLibero?: boolean; };
type ActionRecord = { id: string; playerId: string; action: string; result: string; homeScoreBefore: number; awayScoreBefore: number; timestamp: number; set: number; };
type PlayerSetStats = { id: string; number: string; name: string; position: string; puntos: number; ataquesPts: number; saquesPts: number; bloqueosPts: number; recepciones: number; errores: number; };

const EMPTY_SLOTS = 7; // 6 starters + 1 libero

const actions = [
  { id: "recepcion", name: "RECEPCIÓN", icon: "🛡️" },
  { id: "ataque", name: "ATAQUE", icon: "⚡" },
  { id: "saque", name: "SAQUE", icon: "🎯" },
  { id: "bloqueo", name: "BLOQUEO", icon: "🧱" },
  { id: "defensa", name: "DEFENSA", icon: "🤸" },
];

const results = [
  { id: "dbl", symbol: "#", label: "DBL+", color: "#10B981" },
  { id: "pos", symbol: "+", label: "POS", color: "#10B981" },
  { id: "neut", symbol: "!", label: "NEUT", color: "#94A3B8" },
  { id: "exc", symbol: "/", label: "EXC", color: "#94A3B8" },
  { id: "neg", symbol: "–", label: "NEG", color: "#EF4444" },
  { id: "err", symbol: "=", label: "ERR", color: "#EF4444" },
];

function initStats(players: Player[], libero: Player | null): Record<string, PlayerSetStats> {
  const map: Record<string, PlayerSetStats> = {};
  const all = libero ? [...players, libero] : players;
  all.forEach(p => { map[p.id] = { id: p.id, number: p.number, name: p.name, position: p.position, puntos: 0, ataquesPts: 0, saquesPts: 0, bloqueosPts: 0, recepciones: 0, errores: 0 }; });
  return map;
}

function rosterToPlayer(rp: { id: string; name: string; number: number; position: string }, isLibero = false): Player {
  return {
    id: rp.id,
    number: String(rp.number),
    name: rp.name,
    position: isLibero ? 'Líbero' : rp.position,
    isLibero,
  };
}

function isSetOver(home: number, away: number, setNum: number): boolean {
  const minScore = setNum === 5 ? 15 : 25;
  return (home >= minScore || away >= minScore) && Math.abs(home - away) >= 2;
}

// Convert local actions to DB format
function getDbActions(action: string, result: string): string[] {
  const dbActions: string[] = [];
  
  if (action === "ataque") {
    if (result === "dbl") { dbActions.push("punto", "ataque_positivo"); }
    else if (result === "pos" || result === "exc") { dbActions.push("ataque_positivo"); }
    else if (result === "err") { dbActions.push("error_ataque"); }
  } 
  else if (action === "saque") {
    if (result === "dbl") { dbActions.push("punto", "ace"); }
    else if (result === "pos" || result === "exc") { dbActions.push("ventaja_tactica"); }
    else if (result === "err") { dbActions.push("error_saque"); }
  }
  else if (action === "bloqueo") {
    if (result === "dbl") { dbActions.push("punto", "bloqueo_positivo"); }
    else if (result === "pos" || result === "exc") { dbActions.push("bloqueo_positivo"); }
    else if (result === "err") { dbActions.push("bloqueo_errado"); }
  }
  else if (action === "recepcion") {
    if (result === "dbl" || result === "pos" || result === "exc") { dbActions.push("defensa_positiva"); }
    else if (result === "err") { dbActions.push("error_recepcion"); }
  }
  else if (action === "defensa") {
    if (result === "dbl" || result === "pos" || result === "exc") { dbActions.push("defensa_positiva"); }
    else if (result === "err") { dbActions.push("error_tactico"); }
  }

  return dbActions;
}

export default function LiveMatchScreen() {
  const router = useRouter();
  const { id, teamId, rival, fecha, torneo, players } = useLocalSearchParams<{ id: string, teamId: string, rival: string, fecha: string, torneo: string, players: string }>();
  const { styles } = useStyles();

  const { activeProfile } = useProfile();

  const team = activeProfile.teams.find(t => t.id === teamId);
  const fullRoster = team?.roster ?? [];
  const playerIds: string[] = players ? JSON.parse(players) : [];
  const convocados = fullRoster.filter(p => playerIds.includes(p.id));

  const [courtPlayers, setCourtPlayers] = useState<Player[]>([]);
  const [liberoPlayer, setLiberoPlayer] = useState<Player | null>(null);
  const [bench, setBench] = useState<Player[]>([]);

  const [assignedSlots, setAssignedSlots] = useState<(Player | null)[]>(Array(EMPTY_SLOTS).fill(null));
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsWon, setSetsWon] = useState({ home: 0, away: 0 });
  const [setScoresHistory, setSetScoresHistory] = useState<{teamPts: number, oppPts: number}[]>([]);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const [actionHistory, setActionHistory] = useState<ActionRecord[]>([]);
  const [currentSetStats, setCurrentSetStats] = useState<Record<string, PlayerSetStats>>({});

  const [showSubstitution, setShowSubstitution] = useState(false);
  const [playerOutId, setPlayerOutId] = useState<string | null>(null);

  const [showEndSet, setShowEndSet] = useState(false);
  const [pendingSetEnd, setPendingSetEnd] = useState<{ home: number; away: number; } | null>(null);
  const [showSetResults, setShowSetResults] = useState(false);
  const [completedSetStats, setCompletedSetStats] = useState<PlayerSetStats[]>([]);
  const [matchOver, setMatchOver] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!showEndSet && !showSetResults && (homeScore > 0 || awayScore > 0)) {
      if (isSetOver(homeScore, awayScore, currentSet)) {
        setPendingSetEnd({ home: homeScore, away: awayScore });
        setShowEndSet(true);
      }
    }
  }, [homeScore, awayScore]);

  const applyScore = (newHome: number, newAway: number, record: ActionRecord) => {
    setActionHistory((h) => [...h, record]);
    setHomeScore(newHome);
    setAwayScore(newAway);
  };

  const updatePlayerStat = (playerId: string, action: string, result: string, homePoint: boolean, awayPoint: boolean) => {
    setCurrentSetStats((prev) => {
      const s = { ...(prev[playerId] ?? { id: playerId, number: "", name: "", position: "", puntos: 0, ataquesPts: 0, saquesPts: 0, bloqueosPts: 0, recepciones: 0, errores: 0 }) };
      if (action === "ataque" && result === "dbl") { s.ataquesPts++; s.puntos++; }
      if (action === "saque" && result === "dbl") { s.saquesPts++; s.puntos++; }
      if (action === "bloqueo" && result === "dbl") { s.bloqueosPts++; s.puntos++; }
      if (action === "recepcion") s.recepciones++;
      if (result === "err") s.errores++;
      return { ...prev, [playerId]: s };
    });
  };

  const finalizeCourtSetup = () => {
    if (courtPlayers.length > 0 || !assignedSlots.some(p => p !== null)) return;

    const starters = assignedSlots.slice(0, 6).filter((p): p is Player => p !== null);
    const libero = assignedSlots[6];
    setCourtPlayers(starters);
    if (libero) {
      setLiberoPlayer(libero);
      setCurrentSetStats(initStats(starters, libero));
    } else if (starters.length > 0) {
      setCurrentSetStats(initStats(starters, starters[0]));
    }

    const assignedIds = new Set(assignedSlots.filter((p): p is Player => p !== null).map(p => p.id));
    const benchPlayers = convocados
      .filter(rp => !assignedIds.has(rp.id))
      .map(rp => rosterToPlayer(rp as any));
    setBench(benchPlayers);
  };

  useEffect(() => {
    if (selectedPlayer !== null && selectedAction !== null && selectedResult !== null) {
      finalizeCourtSetup();
      const playerId = selectedPlayer;
      const action = selectedAction;
      const result = selectedResult;
      const homePoint = (action === "ataque" || action === "saque" || action === "bloqueo") && result === "dbl";
      const awayPoint = result === "err";
      setActionHistory((h) => [...h, { id: Date.now().toString(), playerId, action, result, homeScoreBefore: homeScore, awayScoreBefore: awayScore, timestamp: Date.now(), set: currentSet }]);
      updatePlayerStat(playerId, action, result, homePoint, awayPoint);
      setHomeScore((prev) => homePoint ? prev + 1 : prev);
      setAwayScore((prev) => awayPoint ? prev + 1 : prev);
      setSelectedPlayer(null);
      setSelectedAction(null);
      setSelectedResult(null);
    }
  }, [selectedPlayer, selectedAction, selectedResult]);

  const getLastActionText = () => {
    const last = actionHistory[actionHistory.length - 1];
    if (!last) return "1. Seleccione jugador...";

    if (last.action === "rival_saque") return "Última: Error Saque Rival";
    if (last.action === "rival_ataque") return "Última: Error Ataque Rival";

    const allPlayers = [
      ...courtPlayers,
      ...bench,
      ...(liberoPlayer ? [liberoPlayer] : []),
    ];
    const player = allPlayers.find((p) => p.id === last.playerId);

    const actionObj = actions.find((a) => a.id === last.action);
    const actionLabel = actionObj?.name ?? last.action.toUpperCase();

    const resultObj = results.find((r) => r.id === last.result);
    const resultLabel = resultObj?.label ?? last.result.toUpperCase();

    if (player) {
      const names = player.name.split(" ");
      const firstInitial = names[0]?.[0] ?? "";
      const lastName = names.length > 1 ? names[names.length - 1] : "";
      const shortName = lastName ? `${firstInitial}. ${lastName}` : player.name;
      return `Última: ${shortName} (${actionLabel} ${resultLabel})`;
    }

    return `Última: JUGADOR (${actionLabel} ${resultLabel})`;
  };

  const handleRivalError = (type: "saque" | "ataque") => {
    finalizeCourtSetup();
    const record: ActionRecord = { id: Date.now().toString(), playerId: "rival", action: `rival_${type}`, result: "error", homeScoreBefore: homeScore, awayScoreBefore: awayScore, timestamp: Date.now(), set: currentSet };
    applyScore(homeScore + 1, awayScore, record);
    setSelectedAction(null); setSelectedResult(null);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    const last = actionHistory[actionHistory.length - 1];
    setHomeScore(last.homeScoreBefore);
    setAwayScore(last.awayScoreBefore);
    setActionHistory((h) => h.slice(0, -1));
    if (last.playerId !== "rival") {
      setCurrentSetStats((prev) => {
        const s = { ...(prev[last.playerId] ?? { id: last.playerId, number: "", name: "", position: "", puntos: 0, ataquesPts: 0, saquesPts: 0, bloqueosPts: 0, recepciones: 0, errores: 0 }) };
        if (last.action === "ataque" && last.result === "dbl") { s.ataquesPts = Math.max(0, s.ataquesPts - 1); s.puntos = Math.max(0, s.puntos - 1); }
        if (last.action === "saque" && last.result === "dbl") { s.saquesPts = Math.max(0, s.saquesPts - 1); s.puntos = Math.max(0, s.puntos - 1); }
        if (last.action === "bloqueo" && last.result === "dbl") { s.bloqueosPts = Math.max(0, s.bloqueosPts - 1); s.puntos = Math.max(0, s.puntos - 1); }
        if (last.action === "recepcion") s.recepciones = Math.max(0, s.recepciones - 1);
        if (last.result === "err") s.errores = Math.max(0, s.errores - 1);
        return { ...prev, [last.playerId]: s };
      });
    }
  };

  const confirmEndSet = () => {
    const scored = pendingSetEnd ?? { home: homeScore, away: awayScore };
    
    // Save set score
    setSetScoresHistory(prev => [...prev, { teamPts: scored.home, oppPts: scored.away }]);

    const homeWon = scored.home > scored.away;
    const newSetsWon = { home: homeWon ? setsWon.home + 1 : setsWon.home, away: homeWon ? setsWon.away : setsWon.away + 1 };
    setSetsWon(newSetsWon);
    
    const allPlayers = liberoPlayer ? [...courtPlayers, liberoPlayer] : courtPlayers;
    const statsArr = allPlayers.map(p => currentSetStats[p.id] ?? { id: p.id, number: p.number, name: p.name, position: p.position, puntos: 0, ataquesPts: 0, saquesPts: 0, bloqueosPts: 0, recepciones: 0, errores: 0 });
    setCompletedSetStats(statsArr);
    setShowEndSet(false); setPendingSetEnd(null); setShowSetResults(true);
  };

  const startNextSet = () => {
    if (setsWon.home >= 3 || setsWon.away >= 3) { setMatchOver(true); setShowSetResults(false); return; }
    setCourtPlayers([]);
    setLiberoPlayer(null);
    setBench([]);
    setAssignedSlots(Array(EMPTY_SLOTS).fill(null));
    setSelectedPlayer(null);
    setHomeScore(0); setAwayScore(0); setCurrentSet((s) => s + 1); setCurrentSetStats({}); setShowSetResults(false);
  };

  const openSubstitution = () => { if (selectedPlayer === null) return; setPlayerOutId(selectedPlayer); setShowSubstitution(true); };
  const handleSelectIn = (benchPlayer: Player) => {
    if (playerOutId === null) return;
    const outPlayer = courtPlayers.find(p => p.id === playerOutId);
    if (!outPlayer) { setShowSubstitution(false); return; }
    setCourtPlayers(prev => prev.map(p => p.id === playerOutId ? benchPlayer : p));
    setBench(prev => prev.map(p => p.id === benchPlayer.id ? outPlayer : p));
    setCurrentSetStats(prev => ({ ...prev, [benchPlayer.id]: prev[benchPlayer.id] ?? { id: benchPlayer.id, number: benchPlayer.number, name: benchPlayer.name, position: benchPlayer.position, puntos: 0, ataquesPts: 0, saquesPts: 0, bloqueosPts: 0, recepciones: 0, errores: 0 } }));
    if (selectedPlayer === playerOutId) setSelectedPlayer(null);
    setShowSubstitution(false);
  };

  const submitMatch = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const isWin = setsWon.home > setsWon.away;
      
      // Map local action log to backend action events
      const dbActionsList: any[] = [];
      for (const record of actionHistory) {
        if (record.playerId === 'rival') continue; // Skip rival errors for stats map

        const events = getDbActions(record.action, record.result);
        for (const evt of events) {
          dbActionsList.push({
            playerId: record.playerId,
            action: evt,
            set: record.set,
            timestamp: new Date(record.timestamp).toISOString()
          });
        }
      }

      const res = await matchesService.createFinishedMatch({
        teamId: teamId!,
        opponent: rival || 'Rival',
        tournament: torneo || undefined,
        date: fecha || new Date().toISOString(),
        result: isWin ? 'WIN' : 'LOSS',
        finalScore: `${setsWon.home}-${setsWon.away}`,
        setScores: setScoresHistory,
        actions: dbActionsList,
        allPlayers: convocados.map(p => p.id),
      });

      if (res.data?.match) {
        router.replace(`/match-summary/${res.data.match.id}`);
      } else {
        alert("Error guardando el partido: " + res.error);
        setIsSubmitting(false);
      }
    } catch(err) {
      alert("Error de conexión");
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles`flex-1 bg-screen`}>
      <StatusBar style="light" />

      {/* TOP DARK ZONE */}
      <View style={[styles`bg-header flex-shrink-0`, { paddingTop: 24 }]}>
        <View style={styles`flex-row items-center gap-2 px-4 pt-3 pb-2`}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <ArrowLeft size={16} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', flex: 1, gap: 6 }}>
            {[1, 2, 3, 4, 5].map((set) => (
              <View key={set} style={{ flex: 1, paddingVertical: 6, borderRadius: 16, alignItems: 'center', backgroundColor: currentSet === set ? '#1E6FD9' : set < currentSet ? 'rgba(255,255,255,0.2)' : 'transparent', borderWidth: set > currentSet ? 1 : 0, borderColor: 'rgba(255,255,255,0.15)' }}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 13, letterSpacing: 0.5, color: '#fff' }}>{set < currentSet ? `${set}✓` : `S${set}`}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles`flex-row items-center justify-between px-5 pb-1`}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>EQUIPO LOCAL</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 54, fontWeight: '700', lineHeight: 60, color: '#3D8EF5' }}>{homeScore}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>VS</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{setsWon.home} – {setsWon.away}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>VISITANTE</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 54, fontWeight: '700', lineHeight: 60, color: '#fff' }}>{awayScore}</Text>
          </View>
        </View>
      </View>

      {/* BOTTOM LIGHT ZONE */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140 }}>
        
        {/* ① JUGADORES */}
        <View>
          <View style={styles`flex-row justify-between items-center mb-2`}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: '600', letterSpacing: 0.5, color: '#0D1F33' }}>① JUGADOR EN CANCHA</Text>
              {courtPlayers.length > 0 && (
              <TouchableOpacity onPress={openSubstitution} disabled={selectedPlayer === null} style={{ backgroundColor: selectedPlayer !== null ? '#1E6FD9' : '#94A3B8', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, opacity: selectedPlayer !== null ? 1 : 0.4 }}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 1, color: '#fff' }}>CAMBIO →</Text>
              </TouchableOpacity>
            )}
          </View>

          {homeScore === 0 && awayScore === 0 && courtPlayers.length === 0 ? (
            <>
              <View style={styles`flex-row flex-wrap justify-between gap-2 mb-2`}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const player = assignedSlots[index];
                  return player ? (
                    <TouchableOpacity
                      key={`slot-${index}`}
                      onPress={() => setSelectedPlayer(player.id)}
                      style={[styles`w-1/3 bg-white rounded-lg p-2`, { borderWidth: 2, borderColor: selectedPlayer === player.id ? '#1E6FD9' : 'transparent', backgroundColor: selectedPlayer === player.id ? 'rgba(30,111,217,0.05)' : '#fff' }]}
                    >
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', color: '#1E6FD9', lineHeight: 28 }}>{player.number}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '500', color: '#0D1F33' }} numberOfLines={1}>{player.name}</Text>
                      <Text style={{ fontSize: 9, color: '#64748B' }}>{player.position}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={`empty-${index}`}
                      onPress={() => { setPickerSlotIndex(index); setShowRosterPicker(true); }}
                      style={[styles`w-1/3 rounded-lg`, { borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 80, backgroundColor: 'rgba(0,0,0,0.02)' }]}
                    >
                      <Plus size={22} color="#94A3B8" />
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>AGREGAR JUGADOR</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {assignedSlots[6] ? (
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={() => setSelectedPlayer(assignedSlots[6]!.id)} style={{ width: '31%', backgroundColor: '#FEF9C3', borderRadius: 8, padding: 8, borderWidth: 2, borderColor: selectedPlayer === assignedSlots[6]!.id ? '#1E6FD9' : '#FDE047', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FDE047', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 4, marginBottom: 2 }}>
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: '700', color: '#92400E' }}>LÍBERO</Text>
                    </View>
                    <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#92400E', lineHeight: 26 }}>{assignedSlots[6]!.number}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '500', color: '#0D1F33' }} numberOfLines={1}>{assignedSlots[6]!.name}</Text>
                    <Text style={{ fontSize: 8, color: '#92400E' }}>{assignedSlots[6]!.position}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => { setPickerSlotIndex(6); setShowRosterPicker(true); }}
                  style={{ width: '100%', borderRadius: 8, padding: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#1E6FD9', backgroundColor: 'rgba(30,111,217,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Plus size={20} color="#1E6FD9" />
                  <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#1E6FD9', fontWeight: '600' }}>AGREGAR LÍBERO</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={styles`flex-row flex-wrap justify-between gap-2 mb-2`}>
                {courtPlayers.map((player) => (
                  <TouchableOpacity key={player.id} onPress={() => setSelectedPlayer(player.id)} style={[styles`w-1/3 bg-white rounded-lg p-2`, { borderWidth: 2, borderColor: selectedPlayer === player.id ? '#1E6FD9' : 'transparent', backgroundColor: selectedPlayer === player.id ? 'rgba(30,111,217,0.05)' : '#fff' }]}>
                    <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', color: '#1E6FD9', lineHeight: 28 }}>{player.number}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '500', color: '#0D1F33' }} numberOfLines={1}>{player.name}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B' }}>{player.position}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {liberoPlayer && (
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={() => setSelectedPlayer(liberoPlayer.id)} style={{ width: '31%', backgroundColor: '#FEF9C3', borderRadius: 8, padding: 8, borderWidth: 2, borderColor: selectedPlayer === liberoPlayer.id ? '#1E6FD9' : '#FDE047', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FDE047', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 4, marginBottom: 2 }}>
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: '700', color: '#92400E' }}>LÍBERO</Text>
                    </View>
                    <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#92400E', lineHeight: 26 }}>{liberoPlayer.number}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '500', color: '#0D1F33' }} numberOfLines={1}>{liberoPlayer.name}</Text>
                    <Text style={{ fontSize: 8, color: '#92400E' }}>{liberoPlayer.position}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* ② ACCIÓN */}
        <View>
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: '600', letterSpacing: 0.5, color: '#0D1F33', marginBottom: 8 }}>② ACCIÓN</Text>
          <View style={styles`flex-row flex-wrap justify-between gap-1.5`}>
            {actions.map((action) => (
              <TouchableOpacity key={action.id} onPress={() => setSelectedAction(action.id)} style={[styles`bg-white rounded-lg items-center justify-center py-2`, { flex: 1, height: 60, borderWidth: 2, borderColor: selectedAction === action.id ? '#1E6FD9' : 'transparent', backgroundColor: selectedAction === action.id ? 'rgba(30,111,217,0.05)' : '#fff' }]}>
                <Text style={{ fontSize: 18 }}>{action.icon}</Text>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 8, letterSpacing: 0.3, color: '#0D1F33', marginTop: 3 }}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ③ RESULTADO */}
        <View>
          <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: '600', letterSpacing: 0.5, color: '#0D1F33', marginBottom: 8 }}>③ RESULTADO</Text>
          <View style={styles`flex-row flex-wrap justify-between gap-1.5 mb-3`}>
            {results.map((result) => (
              <TouchableOpacity key={result.id} onPress={() => setSelectedResult(result.id)} style={[styles`w-1/6 items-center justify-center py-2 rounded-lg`, { height: 60, backgroundColor: result.color, borderWidth: 2, borderColor: selectedResult === result.id ? '#0D1F33' : 'transparent' }]}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '700', color: '#fff' }}>{result.symbol}</Text>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 8, color: '#fff' }}>{result.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hint Line */}
          {selectedAction && selectedResult && (
            <View style={{ backgroundColor: ((selectedAction === "ataque" || selectedAction === "saque" || selectedAction === "bloqueo") && selectedResult === "dbl") ? '#DCFCE7' : selectedResult === "err" ? '#FEE2E2' : '#F4F7FB', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 8 }}>
               <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 0.5, color: ((selectedAction === "ataque" || selectedAction === "saque" || selectedAction === "bloqueo") && selectedResult === "dbl") ? '#15803D' : selectedResult === "err" ? '#DC2626' : '#64748B' }}>
                {((selectedAction === "ataque" || selectedAction === "saque" || selectedAction === "bloqueo") && selectedResult === "dbl") ? "✅ PUNTO PROPIO" : selectedResult === "err" ? "❌ PUNTO RIVAL" : "—"}
               </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, paddingBottom: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#64748B' }}>
              {selectedPlayer !== null && selectedAction !== null && selectedResult !== null
                ? "✅ Acción registrada"
                : selectedPlayer !== null && selectedAction !== null
                  ? "3. Seleccione resultado..."
                  : selectedPlayer !== null
                    ? "2. Seleccione acción..."
                    : getLastActionText()
              }
            </Text>
          </View>
          <TouchableOpacity onPress={handleUndo} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', opacity: actionHistory.length > 0 ? 1 : 0.4 }}>
            <RotateCcw size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => handleRivalError("saque")} style={{ flex: 1, backgroundColor: '#0D1F33', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#fff' }}>🚀 ERR. SAQUE RIVAL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRivalError("ataque")} style={{ flex: 1, backgroundColor: '#0D1F33', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#fff' }}>💥 ERR. ATAQUE RIVAL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Substitution Modal ── */}
      <Modal visible={showSubstitution} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: Dimensions.get('window').height * 0.8 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
              ¿Quién entra por {courtPlayers.find(p => p.id === playerOutId)?.name ?? "..."}?
            </Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {bench.length === 0 ? (
                <Text style={{ textAlign: 'center', paddingVertical: 24, color: '#94A3B8' }}>No hay jugadoras en el banco</Text>
              ) : (
                bench.map((player) => (
                  <TouchableOpacity key={player.id} onPress={() => handleSelectIn(player)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 8 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(30,111,217,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '700', color: '#1E6FD9' }}>{player.number}</Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>{player.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{player.position}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSubstitution(false)} style={{ width: '100%', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Roster Picker Modal ── */}
      <Modal visible={showRosterPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: Dimensions.get('window').height * 0.75 }}>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              {pickerSlotIndex === 6 ? 'Seleccionar Líbero' : 'Seleccionar Jugador'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Jugadores convocados</Text>

            <ScrollView style={{ maxHeight: 350 }}>
              {convocados.length === 0 ? (
                <Text style={{ textAlign: 'center', paddingVertical: 24, color: '#94A3B8' }}>No hay jugadores convocados para este partido</Text>
              ) : (
                convocados.map((rp) => {
                  const alreadyAssigned = assignedSlots.some(p => p !== null && p.id === rp.id);
                  return (
                    <TouchableOpacity
                      key={rp.id}
                      disabled={alreadyAssigned}
                      onPress={() => {
                        const player = rosterToPlayer(rp as any, pickerSlotIndex === 6);
                        const updated = [...assignedSlots];
                        updated[pickerSlotIndex!] = player;
                        setAssignedSlots(updated);
                        setShowRosterPicker(false);
                        setPickerSlotIndex(null);
                      }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 12,
                        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 8,
                        opacity: alreadyAssigned ? 0.4 : 1,
                        backgroundColor: alreadyAssigned ? '#F1F5F9' : '#fff',
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: alreadyAssigned ? '#CBD5E1' : '#1E6FD9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '700', color: '#fff' }}>{rp.number}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>{rp.name}</Text>
                      </View>
                      {alreadyAssigned && (
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>YA ASIGNADO</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity onPress={() => { setShowRosterPicker(false); setPickerSlotIndex(null); }} style={{ width: '100%', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── End Set Modal ── */}
      <Modal visible={showEndSet} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏐</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: '700', marginBottom: 8 }}>
              {pendingSetEnd && pendingSetEnd.home > pendingSetEnd.away ? "¡Ganaron el Set!" : "¡Perdieron el Set!"}
            </Text>
            {pendingSetEnd && (
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: '700', marginBottom: 8 }}>
                <Text style={{ color: '#3D8EF5' }}>{pendingSetEnd.home}</Text>
                <Text style={{ color: 'rgba(0,0,0,0.2)' }}> - </Text>
                <Text>{pendingSetEnd.away}</Text>
              </Text>
            )}
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Set {currentSet} · Ver estadísticas y continuar</Text>
            <View style={styles`flex-row gap-3`}>
              <TouchableOpacity onPress={() => { setShowEndSet(false); setPendingSetEnd(null); }} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600' }}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmEndSet} style={{ flex: 1, backgroundColor: '#1E6FD9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#fff' }}>VER STATS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Set Results Modal ── */}
      <Modal visible={showSetResults} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#F4F7FB', borderRadius: 24, padding: 16, maxHeight: Dimensions.get('window').height * 0.9 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: '700', color: '#0D1F33' }}>Resultados — Set {currentSet}</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Sets: <Text style={{ color: '#1E6FD9', fontWeight: 'bold' }}>{setsWon.home}</Text> - <Text style={{ fontWeight: 'bold' }}>{setsWon.away}</Text></Text>
            </View>

            <View style={[styles`flex-row pb-2`, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 8 }]}>
              <Text style={[styles`col-span-2`, { fontFamily: 'Barlow Condensed', fontSize: 12, color: '#94A3B8' }]}>JUGADOR</Text>
              <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 12, color: '#94A3B8', textAlign: 'center' }]}>PTS</Text>
              <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 12, color: '#94A3B8', textAlign: 'center' }]}>ATK</Text>
              <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 12, color: '#94A3B8', textAlign: 'center' }]}>SAQ</Text>
              <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 12, color: '#94A3B8', textAlign: 'center' }]}>ERR</Text>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {completedSetStats.sort((a, b) => b.puntos - a.puntos).map((p) => (
                <View key={p.id} style={[styles`flex-row items-center py-2`, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
                  <View style={styles`col-span-2`}>
                    <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '600', color: '#0D1F33' }}>#{p.number}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B' }} numberOfLines={1}>{p.name.split(" ")[0]}</Text>
                  </View>
                  <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: '700', textAlign: 'center', color: p.puntos > 0 ? '#1E6FD9' : '#CBD5E1' }]}>{p.puntos}</Text>
                  <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 16, textAlign: 'center', color: '#0D1F33' }]}>{p.ataquesPts}</Text>
                  <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 16, textAlign: 'center', color: '#0D1F33' }]}>{p.saquesPts}</Text>
                  <Text style={[styles`w-1/6`, { fontFamily: 'Barlow Condensed', fontSize: 16, textAlign: 'center', color: p.errores > 0 ? '#EF4444' : '#CBD5E1' }]}>{p.errores}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={startNextSet} style={{ width: '100%', backgroundColor: '#1E6FD9', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>
                {setsWon.home >= 3 || setsWon.away >= 3 ? "VER RESUMEN FINAL" : `INICIAR SET ${currentSet + 1}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Match Over Modal ── */}
      <Modal visible={matchOver} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>{setsWon.home > setsWon.away ? "🏆" : "💪"}</Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 26, fontWeight: '700', color: '#0D1F33', marginBottom: 8 }}>
              {setsWon.home > setsWon.away ? "¡Partido Ganado!" : "Partido Finalizado"}
            </Text>
            <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 40, fontWeight: '700', marginBottom: 16 }}>
              <Text style={{ color: '#3D8EF5' }}>{setsWon.home}</Text>
              <Text style={{ color: 'rgba(0,0,0,0.2)' }}> - </Text>
              <Text>{setsWon.away}</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Guardar las estadísticas en el servidor</Text>
            
            <TouchableOpacity 
                onPress={submitMatch} 
                disabled={isSubmitting}
                style={{ width: '100%', backgroundColor: isSubmitting ? '#94A3B8' : '#1E6FD9', paddingVertical: 14, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              {isSubmitting && <ActivityIndicator color="#fff" />}
              <Text style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>
                {isSubmitting ? 'GUARDANDO...' : 'FINALIZAR Y GUARDAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
