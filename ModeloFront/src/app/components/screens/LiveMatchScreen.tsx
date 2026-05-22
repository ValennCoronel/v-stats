import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type Player = {
  id: number;
  number: string;
  name: string;
  position: string;
  isLibero?: boolean;
};

type ActionRecord = {
  id: string;
  playerId: number;
  action: string;
  result: string;
  homeScoreBefore: number;
  awayScoreBefore: number;
};

type PlayerSetStats = {
  id: number;
  number: string;
  name: string;
  position: string;
  puntos: number;
  ataquesPts: number;
  saquesPts: number;
  bloqueosPts: number;
  recepciones: number;
  errores: number;
};

const initialCourtPlayers: Player[] = [
  {
    id: 1,
    number: "5",
    name: "María González",
    position: "Opuesta",
  },
  {
    id: 2,
    number: "12",
    name: "Ana Rodríguez",
    position: "Central",
  },
  {
    id: 3,
    number: "8",
    name: "Laura Pérez",
    position: "Punta",
  },
  {
    id: 4,
    number: "3",
    name: "Sofia Martínez",
    position: "Armadora",
  },
  {
    id: 5,
    number: "7",
    name: "Carolina López",
    position: "Central",
  },
  {
    id: 6,
    number: "10",
    name: "Valentina Silva",
    position: "Punta",
  },
];

const liberoPlayer: Player = {
  id: 7,
  number: "1",
  name: "Florencia Castro",
  position: "Líbero",
  isLibero: true,
};

const initialBench: Player[] = [
  {
    id: 8,
    number: "4",
    name: "Micaela Fernández",
    position: "Punta",
  },
  {
    id: 9,
    number: "9",
    name: "Julieta Morales",
    position: "Central",
  },
  {
    id: 10,
    number: "11",
    name: "Camila Ruiz",
    position: "Opuesta",
  },
];

const actions = [
  { id: "recepcion", name: "RECEPCIÓN", icon: "🛡️" },
  { id: "ataque", name: "ATAQUE", icon: "⚡" },
  { id: "saque", name: "SAQUE", icon: "🎯" },
  { id: "bloqueo", name: "BLOQUEO", icon: "🧱" },
  { id: "defensa", name: "DEFENSA", icon: "🤸" },
  { id: "error", name: "ERROR", icon: "❌" },
];

const results = [
  {
    id: "dbl",
    symbol: "#",
    label: "DBL+",
    color: "green" as const,
  },
  {
    id: "pos",
    symbol: "+",
    label: "POS",
    color: "green" as const,
  },
  {
    id: "neut",
    symbol: "!",
    label: "NEUT",
    color: "gray" as const,
  },
  {
    id: "exc",
    symbol: "/",
    label: "EXC",
    color: "gray" as const,
  },
  {
    id: "neg",
    symbol: "–",
    label: "NEG",
    color: "red" as const,
  },
  {
    id: "err",
    symbol: "=",
    label: "ERR",
    color: "red" as const,
  },
];

const barlow = { fontFamily: "'Barlow Condensed', sans-serif" };

function initStats(
  players: Player[],
  libero: Player,
): Record<number, PlayerSetStats> {
  const allPlayers = [...players, libero];
  const map: Record<number, PlayerSetStats> = {};
  allPlayers.forEach((p) => {
    map[p.id] = {
      id: p.id,
      number: p.number,
      name: p.name,
      position: p.position,
      puntos: 0,
      ataquesPts: 0,
      saquesPts: 0,
      bloqueosPts: 0,
      recepciones: 0,
      errores: 0,
    };
  });
  return map;
}

function isSetOver(
  home: number,
  away: number,
  setNum: number,
): boolean {
  const minScore = setNum === 5 ? 15 : 25;
  return (
    (home >= minScore || away >= minScore) &&
    Math.abs(home - away) >= 2
  );
}

export default function LiveMatchScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const teamId =
    (location.state as { teamId?: string } | null)?.teamId ??
    "1";

  const [courtPlayers, setCourtPlayers] = useState<Player[]>(
    initialCourtPlayers,
  );
  const [bench, setBench] = useState<Player[]>(initialBench);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsWon, setSetsWon] = useState({ home: 0, away: 0 });

  const [selectedPlayer, setSelectedPlayer] = useState<
    number | null
  >(null);
  const [selectedAction, setSelectedAction] = useState<
    string | null
  >(null);
  const [selectedResult, setSelectedResult] = useState<
    string | null
  >(null);

  const [actionHistory, setActionHistory] = useState<
    ActionRecord[]
  >([]);
  const [currentSetStats, setCurrentSetStats] = useState<
    Record<number, PlayerSetStats>
  >(initStats(initialCourtPlayers, liberoPlayer));

  // Substitution state
  const [showSubstitution, setShowSubstitution] =
    useState(false);
  const [subStep, setSubStep] = useState<"out" | "in">("out");
  const [playerOutId, setPlayerOutId] = useState<number | null>(
    null,
  );

  // End of set
  const [showEndSet, setShowEndSet] = useState(false);
  const [pendingSetEnd, setPendingSetEnd] = useState<{
    home: number;
    away: number;
  } | null>(null);
  const [showSetResults, setShowSetResults] = useState(false);
  const [completedSetStats, setCompletedSetStats] = useState<
    PlayerSetStats[]
  >([]);
  const [matchOver, setMatchOver] = useState(false);

  const canRegister =
    selectedPlayer !== null &&
    selectedAction !== null &&
    selectedResult !== null;

  // Auto-detect set end after score changes
  useEffect(() => {
    if (
      !showEndSet &&
      !showSetResults &&
      (homeScore > 0 || awayScore > 0)
    ) {
      if (isSetOver(homeScore, awayScore, currentSet)) {
        setPendingSetEnd({ home: homeScore, away: awayScore });
        setShowEndSet(true);
      }
    }
  }, [homeScore, awayScore]);

  const applyScore = (
    newHome: number,
    newAway: number,
    record: ActionRecord,
  ) => {
    setActionHistory((h) => [...h, record]);
    setHomeScore(newHome);
    setAwayScore(newAway);
  };

  const updatePlayerStat = (
    playerId: number,
    action: string,
    result: string,
    homePoint: boolean,
    awayPoint: boolean,
  ) => {
    setCurrentSetStats((prev) => {
      const s = {
        ...(prev[playerId] ?? {
          id: playerId,
          number: "",
          name: "",
          position: "",
          puntos: 0,
          ataquesPts: 0,
          saquesPts: 0,
          bloqueosPts: 0,
          recepciones: 0,
          errores: 0,
        }),
      };
      if (action === "ataque" && result === "dbl") {
        s.ataquesPts++;
        s.puntos++;
      }
      if (action === "saque" && result === "dbl") {
        s.saquesPts++;
        s.puntos++;
      }
      if (action === "bloqueo" && result === "dbl") {
        s.bloqueosPts++;
        s.puntos++;
      }
      if (action === "recepcion") s.recepciones++;
      if (
        result === "err" &&
        (action === "recepcion" ||
          action === "ataque" ||
          action === "saque")
      )
        s.errores++;
      return { ...prev, [playerId]: s };
    });
  };

  const handleRegister = () => {
    if (!canRegister) return;

    const homePoint =
      (selectedAction === "ataque" ||
        selectedAction === "saque" ||
        selectedAction === "bloqueo") &&
      selectedResult === "dbl";

    const awayPoint =
      (selectedAction === "recepcion" ||
        selectedAction === "ataque" ||
        selectedAction === "saque") &&
      selectedResult === "err";

    const record: ActionRecord = {
      id: Date.now().toString(),
      playerId: selectedPlayer!,
      action: selectedAction!,
      result: selectedResult!,
      homeScoreBefore: homeScore,
      awayScoreBefore: awayScore,
    };

    updatePlayerStat(
      selectedPlayer!,
      selectedAction!,
      selectedResult!,
      homePoint,
      awayPoint,
    );
    applyScore(
      homePoint ? homeScore + 1 : homeScore,
      awayPoint ? awayScore + 1 : awayScore,
      record,
    );

    setSelectedPlayer(null);
    setSelectedAction(null);
    setSelectedResult(null);
  };

  const handleRivalError = (type: "saque" | "ataque") => {
    const record: ActionRecord = {
      id: Date.now().toString(),
      playerId: -1,
      action: `rival_${type}`,
      result: "error",
      homeScoreBefore: homeScore,
      awayScoreBefore: awayScore,
    };
    applyScore(homeScore + 1, awayScore, record);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    const last = actionHistory[actionHistory.length - 1];
    setHomeScore(last.homeScoreBefore);
    setAwayScore(last.awayScoreBefore);
    setActionHistory((h) => h.slice(0, -1));

    // Reverse stat update for registered player actions
    if (last.playerId > 0) {
      setCurrentSetStats((prev) => {
        const s = {
          ...(prev[last.playerId] ?? {
            id: last.playerId,
            number: "",
            name: "",
            position: "",
            puntos: 0,
            ataquesPts: 0,
            saquesPts: 0,
            bloqueosPts: 0,
            recepciones: 0,
            errores: 0,
          }),
        };
        if (last.action === "ataque" && last.result === "dbl") {
          s.ataquesPts = Math.max(0, s.ataquesPts - 1);
          s.puntos = Math.max(0, s.puntos - 1);
        }
        if (last.action === "saque" && last.result === "dbl") {
          s.saquesPts = Math.max(0, s.saquesPts - 1);
          s.puntos = Math.max(0, s.puntos - 1);
        }
        if (
          last.action === "bloqueo" &&
          last.result === "dbl"
        ) {
          s.bloqueosPts = Math.max(0, s.bloqueosPts - 1);
          s.puntos = Math.max(0, s.puntos - 1);
        }
        if (last.action === "recepcion")
          s.recepciones = Math.max(0, s.recepciones - 1);
        if (last.result === "err")
          s.errores = Math.max(0, s.errores - 1);
        return { ...prev, [last.playerId]: s };
      });
    }
  };

  const confirmEndSet = () => {
    const scored = pendingSetEnd ?? {
      home: homeScore,
      away: awayScore,
    };
    const homeWon = scored.home > scored.away;
    const newSetsWon = {
      home: homeWon ? setsWon.home + 1 : setsWon.home,
      away: homeWon ? setsWon.away : setsWon.away + 1,
    };
    setSetsWon(newSetsWon);

    // Gather set stats for all players currently tracked
    const allPlayers = [...courtPlayers, liberoPlayer];
    const statsArr = allPlayers.map(
      (p) =>
        currentSetStats[p.id] ?? {
          id: p.id,
          number: p.number,
          name: p.name,
          position: p.position,
          puntos: 0,
          ataquesPts: 0,
          saquesPts: 0,
          bloqueosPts: 0,
          recepciones: 0,
          errores: 0,
        },
    );
    setCompletedSetStats(statsArr);

    setShowEndSet(false);
    setPendingSetEnd(null);
    setShowSetResults(true);
  };

  const startNextSet = () => {
    // Check if match is over (best of 5: first to 3 sets)
    const { home, away } = setsWon;
    if (home >= 3 || away >= 3) {
      setMatchOver(true);
      setShowSetResults(false);
      return;
    }
    setHomeScore(0);
    setAwayScore(0);
    setCurrentSet((s) => s + 1);
    setActionHistory([]);
    setCurrentSetStats(initStats(courtPlayers, liberoPlayer));
    setShowSetResults(false);
  };

  // Substitution handlers
  const openSubstitution = () => {
    setSubStep("out");
    setPlayerOutId(null);
    setShowSubstitution(true);
  };

  const handleSelectOut = (playerId: number) => {
    setPlayerOutId(playerId);
    setSubStep("in");
  };

  const handleSelectIn = (benchPlayer: Player) => {
    if (playerOutId === null) return;
    const outPlayer = courtPlayers.find(
      (p) => p.id === playerOutId,
    );
    if (!outPlayer) {
      setShowSubstitution(false);
      return;
    }
    setCourtPlayers((prev) =>
      prev.map((p) => (p.id === playerOutId ? benchPlayer : p)),
    );
    setBench((prev) =>
      prev.map((p) =>
        p.id === benchPlayer.id ? outPlayer : p,
      ),
    );
    // Add to stats tracking
    setCurrentSetStats((prev) => ({
      ...prev,
      [benchPlayer.id]: prev[benchPlayer.id] ?? {
        id: benchPlayer.id,
        number: benchPlayer.number,
        name: benchPlayer.name,
        position: benchPlayer.position,
        puntos: 0,
        ataquesPts: 0,
        saquesPts: 0,
        bloqueosPts: 0,
        recepciones: 0,
        errores: 0,
      },
    }));
    if (selectedPlayer === playerOutId) setSelectedPlayer(null);
    setShowSubstitution(false);
  };

  const handleBack = () => {
    navigate(`/team/${teamId}`);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F4F7FB]">
      {/* TOP DARK ZONE */}
      <div className="bg-[#0D1F33] text-white flex-shrink-0">
        {/* Row 1: Back | Set Tabs | EN VIVO */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button
            onClick={handleBack}
            className="flex items-center justify-center size-8 rounded-full bg-white/10 flex-shrink-0"
          >
            <ArrowLeft className="size-4 text-white" />
          </button>

          <div className="flex gap-1.5 flex-1">
            {[1, 2, 3, 4, 5].map((set) => (
              <button
                key={set}
                className={`flex-1 py-1.5 rounded-full text-white transition-all ${
                  currentSet === set
                    ? "bg-[#1E6FD9]"
                    : set < currentSet
                      ? "bg-white/20"
                      : "bg-white/10 border border-white/15"
                }`}
                style={{
                  ...barlow,
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                {set < currentSet ? `${set}✓` : `S${set}`}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Scoreboard */}
        <div className="flex items-center justify-between px-5 pb-1">
          {/* Home */}
          <div className="flex-1">
            <div
              style={{
                ...barlow,
                fontSize: "11px",
                letterSpacing: "1px",
                opacity: 0.6,
              }}
            >
              EQUIPO LOCAL
            </div>
            <div
              style={{
                ...barlow,
                fontSize: "54px",
                fontWeight: 700,
                lineHeight: 1,
                color: "#3D8EF5",
              }}
            >
              {homeScore}
            </div>
          </div>

          {/* Center: sets won + undo */}
          <div className="flex flex-col items-center gap-1 px-3">
            <span
              style={{
                ...barlow,
                fontSize: "13px",
                opacity: 0.4,
                letterSpacing: "2px",
              }}
            >
              VS
            </span>
            <div
              style={{
                ...barlow,
                fontSize: "16px",
                fontWeight: 700,
                opacity: 0.9,
              }}
            >
              {setsWon.home} – {setsWon.away}
            </div>
            <button
              onClick={handleUndo}
              disabled={actionHistory.length === 0}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                actionHistory.length > 0
                  ? "bg-orange-500/80 active:bg-orange-500"
                  : "bg-white/10 opacity-40"
              }`}
            >
              <RotateCcw className="size-3 text-white" />
              <span
                style={{
                  ...barlow,
                  fontSize: "10px",
                  color: "white",
                  letterSpacing: "0.5px",
                }}
              >
                DESHACER
              </span>
            </button>
          </div>

          {/* Away */}
          <div className="flex-1 text-right">
            <div
              style={{
                ...barlow,
                fontSize: "11px",
                letterSpacing: "1px",
                opacity: 0.6,
              }}
            >
              EQUIPO VISITANTE
            </div>
            <div
              style={{
                ...barlow,
                fontSize: "54px",
                fontWeight: 700,
                lineHeight: 1,
                color: "#FFFFFF",
              }}
            >
              {awayScore}
            </div>
          </div>
        </div>

        {/* Row 3: FIN DE SET manual */}
        <div className="flex justify-center px-4 pb-3">
          <button
            onClick={() => {
              setPendingSetEnd({
                home: homeScore,
                away: awayScore,
              });
              setShowEndSet(true);
            }}
            className="w-full border border-white/25 text-white rounded-lg py-2 transition-all hover:bg-white/10 active:bg-white/20"
            style={{
              ...barlow,
              fontSize: "13px",
              letterSpacing: "1.5px",
            }}
          >
            FIN DE SET MANUAL
          </button>
        </div>
      </div>

      {/* BOTTOM LIGHT ZONE */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 py-3 gap-3">
        {/* ① JUGADOR EN CANCHA */}
        <div className="flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3
              style={{
                ...barlow,
                fontSize: "15px",
                fontWeight: 600,
                color: "#0D1F33",
                letterSpacing: "0.5px",
              }}
            >
              ① JUGADOR EN CANCHA
            </h3>
            <button
              onClick={openSubstitution}
              className="bg-[#1E6FD9] text-white rounded-md px-3 py-1"
              style={{
                ...barlow,
                fontSize: "11px",
                letterSpacing: "1px",
              }}
            >
              CAMBIO →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            {courtPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`bg-white rounded-lg px-2 py-2 text-left shadow-sm transition-all ${
                  selectedPlayer === player.id
                    ? "border-2 border-[#1E6FD9] bg-[#1E6FD9]/5"
                    : "border-2 border-transparent"
                }`}
              >
                <div
                  style={{
                    ...barlow,
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1E6FD9",
                    lineHeight: 1,
                  }}
                >
                  {player.number}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#0D1F33",
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{ fontSize: "9px", color: "#64748B" }}
                >
                  {player.position}
                </div>
              </button>
            ))}
          </div>

          {/* Libero */}
          <button
            onClick={() => setSelectedPlayer(liberoPlayer.id)}
            className={`w-full bg-[#0D1F33] text-white rounded-lg flex items-center gap-2 px-3 py-2 transition-all ${
              selectedPlayer === liberoPlayer.id
                ? "ring-2 ring-[#1E6FD9] ring-offset-1"
                : ""
            }`}
          >
            <div
              className="bg-[#1E6FD9] px-2 py-0.5 rounded text-white"
              style={{
                ...barlow,
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              L
            </div>
            <div className="flex-1 text-left">
              <div
                style={{
                  ...barlow,
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                {liberoPlayer.number} - {liberoPlayer.name}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.65 }}>
                {liberoPlayer.position}
              </div>
            </div>
          </button>
        </div>

        {/* ② ACCIÓN */}
        <div className="flex-shrink-0">
          <h3
            style={{
              ...barlow,
              fontSize: "15px",
              fontWeight: 600,
              color: "#0D1F33",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            ② ACCIÓN
          </h3>
          <div className="grid grid-cols-6 gap-1.5">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`bg-white rounded-lg flex flex-col items-center justify-center py-2 shadow-sm transition-all ${
                  selectedAction === action.id
                    ? "border-2 border-[#1E6FD9] bg-[#1E6FD9]/5"
                    : "border-2 border-transparent"
                }`}
              >
                <div
                  style={{ fontSize: "18px", lineHeight: 1 }}
                >
                  {action.icon}
                </div>
                <div
                  style={{
                    ...barlow,
                    fontSize: "8px",
                    letterSpacing: "0.3px",
                    color: "#0D1F33",
                    marginTop: "3px",
                  }}
                >
                  {action.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ③ RESULTADO */}
        <div className="flex-shrink-0">
          <h3
            style={{
              ...barlow,
              fontSize: "15px",
              fontWeight: 600,
              color: "#0D1F33",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            ③ RESULTADO
          </h3>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result.id)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  selectedResult === result.id
                    ? "ring-2 ring-[#0D1F33] ring-offset-1"
                    : ""
                } ${
                  result.color === "green"
                    ? "bg-green-500 text-white"
                    : result.color === "red"
                      ? "bg-red-500 text-white"
                      : "bg-slate-400 text-white"
                }`}
              >
                <div
                  style={{
                    ...barlow,
                    fontSize: "18px",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {result.symbol}
                </div>
                <div style={{ ...barlow, fontSize: "8px" }}>
                  {result.label}
                </div>
              </button>
            ))}
          </div>

          {/* Hint line */}
          {selectedAction && selectedResult && (
            <div
              className={`text-center py-1 px-3 rounded-lg mb-2 ${
                (selectedAction === "ataque" ||
                  selectedAction === "saque" ||
                  selectedAction === "bloqueo") &&
                selectedResult === "dbl"
                  ? "bg-green-100 text-green-700"
                  : (selectedAction === "recepcion" ||
                        selectedAction === "ataque" ||
                        selectedAction === "saque") &&
                      selectedResult === "err"
                    ? "bg-red-100 text-red-600"
                    : "bg-[#F4F7FB] text-[#64748B]"
              }`}
              style={{
                ...barlow,
                fontSize: "12px",
                letterSpacing: "0.5px",
              }}
            >
              {(selectedAction === "ataque" ||
                selectedAction === "saque" ||
                selectedAction === "bloqueo") &&
              selectedResult === "dbl"
                ? "✅ PUNTO PROPIO"
                : (selectedAction === "recepcion" ||
                      selectedAction === "ataque" ||
                      selectedAction === "saque") &&
                    selectedResult === "err"
                  ? "❌ PUNTO RIVAL"
                  : "—"}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={!canRegister}
            className={`w-full rounded-lg py-2.5 mb-2 text-white transition-all ${
              canRegister
                ? "bg-[#1E6FD9] active:bg-[#1557B0]"
                : "bg-[#1E6FD9]/30 cursor-not-allowed"
            }`}
            style={{
              ...barlow,
              fontSize: "14px",
              letterSpacing: "1.5px",
            }}
          >
            REGISTRAR ACCIÓN
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRivalError("saque")}
              className="bg-[#0D1F33] text-white rounded-lg py-2.5 active:opacity-80"
              style={{ ...barlow, fontSize: "12px" }}
            >
              🚀 ERR. SAQUE RIVAL
            </button>
            <button
              onClick={() => handleRivalError("ataque")}
              className="bg-[#0D1F33] text-white rounded-lg py-2.5 active:opacity-80"
              style={{ ...barlow, fontSize: "12px" }}
            >
              💥 ERR. ATAQUE RIVAL
            </button>
          </div>
        </div>
      </div>

      {/* ── Substitution Modal ── */}
      <Dialog
        open={showSubstitution}
        onOpenChange={setShowSubstitution}
      >
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle
              style={{ ...barlow, fontSize: "20px" }}
            >
              {subStep === "out"
                ? "¿Quién sale?"
                : "¿Quién entra?"}
            </DialogTitle>
          </DialogHeader>

          {subStep === "out" ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {courtPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectOut(player.id)}
                  className="w-full bg-white border border-[#E2E8F0] hover:border-[#EF4444] p-3 rounded-lg flex items-center gap-3 transition-all"
                >
                  <div className="bg-[#EF4444]/10 rounded-full size-10 flex items-center justify-center flex-shrink-0">
                    <span
                      style={{
                        ...barlow,
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#EF4444",
                      }}
                    >
                      {player.number}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      style={{
                        ...barlow,
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#0D1F33",
                      }}
                    >
                      {player.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                      }}
                    >
                      {player.position}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  marginBottom: "8px",
                }}
              >
                Sale:{" "}
                <strong>
                  {
                    courtPlayers.find(
                      (p) => p.id === playerOutId,
                    )?.name
                  }
                </strong>
              </p>
              {bench.length === 0 ? (
                <p
                  className="text-center py-6 text-[#94A3B8]"
                  style={{ fontSize: "14px" }}
                >
                  No hay jugadoras en el banco
                </p>
              ) : (
                bench.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectIn(player)}
                    className="w-full bg-white border border-[#E2E8F0] hover:border-[#1E6FD9] p-3 rounded-lg flex items-center gap-3 transition-all"
                  >
                    <div className="bg-[#1E6FD9]/10 rounded-full size-10 flex items-center justify-center flex-shrink-0">
                      <span
                        style={{
                          ...barlow,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1E6FD9",
                        }}
                      >
                        {player.number}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        style={{
                          ...barlow,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0D1F33",
                        }}
                      >
                        {player.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748B",
                        }}
                      >
                        {player.position}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          <Button
            onClick={() => setShowSubstitution(false)}
            variant="outline"
            className="w-full mt-2"
          >
            CANCELAR
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── End Set Modal ── */}
      <Dialog
        open={showEndSet}
        onOpenChange={(open) => {
          if (!open) {
            setShowEndSet(false);
            setPendingSetEnd(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🏐</div>
            <DialogTitle
              style={{
                ...barlow,
                fontSize: "24px",
                marginBottom: "8px",
              }}
            >
              {pendingSetEnd &&
              pendingSetEnd.home > pendingSetEnd.away
                ? "¡Ganaron el Set!"
                : "¡Perdieron el Set!"}
            </DialogTitle>
            {pendingSetEnd && (
              <div
                style={{
                  ...barlow,
                  fontSize: "36px",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#3D8EF5" }}>
                  {pendingSetEnd.home}
                </span>
                <span style={{ opacity: 0.3, margin: "0 8px" }}>
                  –
                </span>
                <span>{pendingSetEnd.away}</span>
              </div>
            )}
            <p className="text-sm text-[#64748B] mb-6">
              Set {currentSet} · Ver estadísticas y continuar
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowEndSet(false);
                  setPendingSetEnd(null);
                }}
                variant="outline"
                className="flex-1"
              >
                CANCELAR
              </Button>
              <Button
                onClick={confirmEndSet}
                className="flex-1 bg-[#1E6FD9] hover:bg-[#1557B0]"
              >
                VER STATS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Set Results Modal ── */}
      <Dialog open={showSetResults} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <div className="text-center mb-4">
            <DialogTitle
              style={{
                ...barlow,
                fontSize: "22px",
                fontWeight: 700,
                color: "#0D1F33",
              }}
            >
              Resultados — Set {currentSet}
            </DialogTitle>
            <p
              style={{
                fontSize: "13px",
                color: "#64748B",
                marginTop: "4px",
              }}
            >
              Sets:{" "}
              <strong style={{ color: "#1E6FD9" }}>
                {setsWon.home}
              </strong>{" "}
              – <strong>{setsWon.away}</strong>
            </p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* Header */}
            <div
              className="grid grid-cols-6 gap-1 px-2 pb-1"
              style={{
                ...barlow,
                fontSize: "10px",
                color: "#94A3B8",
                letterSpacing: "0.5px",
              }}
            >
              <div className="col-span-2">JUGADORA</div>
              <div className="text-center">PTS</div>
              <div className="text-center">ATK</div>
              <div className="text-center">SAQ</div>
              <div className="text-center">ERR</div>
            </div>
            {completedSetStats
              .sort((a, b) => b.puntos - a.puntos)
              .map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-6 gap-1 items-center bg-white rounded-xl px-3 py-2 shadow-sm"
                >
                  <div className="col-span-2">
                    <div
                      style={{
                        ...barlow,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0D1F33",
                        lineHeight: 1.2,
                      }}
                    >
                      #{p.number}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#64748B",
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name.split(" ")[0]}
                    </div>
                  </div>
                  <div
                    className="text-center"
                    style={{
                      ...barlow,
                      fontSize: "18px",
                      fontWeight: 700,
                      color:
                        p.puntos > 0 ? "#1E6FD9" : "#CBD5E1",
                    }}
                  >
                    {p.puntos}
                  </div>
                  <div
                    className="text-center"
                    style={{
                      ...barlow,
                      fontSize: "16px",
                      color: "#0D1F33",
                    }}
                  >
                    {p.ataquesPts}
                  </div>
                  <div
                    className="text-center"
                    style={{
                      ...barlow,
                      fontSize: "16px",
                      color: "#0D1F33",
                    }}
                  >
                    {p.saquesPts}
                  </div>
                  <div
                    className="text-center"
                    style={{
                      ...barlow,
                      fontSize: "16px",
                      color:
                        p.errores > 0 ? "#EF4444" : "#CBD5E1",
                    }}
                  >
                    {p.errores}
                  </div>
                </div>
              ))}
          </div>

          <Button
            onClick={startNextSet}
            className="w-full mt-4 bg-[#1E6FD9] hover:bg-[#1557B0] text-white"
            style={{ ...barlow, letterSpacing: "1px" }}
          >
            {setsWon.home >= 3 || setsWon.away >= 3
              ? "FINALIZAR PARTIDO"
              : `INICIAR SET ${currentSet + 1}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Match Over Modal ── */}
      <Dialog open={matchOver} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <div className="text-center py-4">
            <div className="text-5xl mb-4">
              {setsWon.home > setsWon.away ? "🏆" : "💪"}
            </div>
            <DialogTitle
              style={{
                ...barlow,
                fontSize: "26px",
                fontWeight: 700,
                color: "#0D1F33",
                marginBottom: "8px",
              }}
            >
              {setsWon.home > setsWon.away
                ? "¡Partido Ganado!"
                : "Partido Finalizado"}
            </DialogTitle>
            <div
              style={{
                ...barlow,
                fontSize: "40px",
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: "16px",
              }}
            >
              <span style={{ color: "#3D8EF5" }}>
                {setsWon.home}
              </span>
              <span style={{ opacity: 0.3, margin: "0 10px" }}>
                –
              </span>
              <span>{setsWon.away}</span>
            </div>
            <p className="text-sm text-[#64748B] mb-6">
              Resultado final en sets
            </p>
            <Button
              onClick={() => navigate(`/team/${teamId}`)}
              className="w-full bg-[#1E6FD9] hover:bg-[#1557B0]"
              style={{ ...barlow, letterSpacing: "1px" }}
            >
              VER LISTA DE PARTIDOS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}