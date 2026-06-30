import { api } from '../api';

export type ClubStats = {
  totalMatches: number;
  winRate: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  totalPoints: number;
  attacks: number;
  defenses: number;
  blocks: number;
  aces: number;
  errors: number;
  attackErrors: number;
  receptionErrors: number;
  serveErrors: number;
  positiveActions: number;
  negativeActions: number;
  totalActions: number;
  avgActionsPerPoint: number;
  pointsPerMatch: number;
  selectedTeam: {
    id: string;
    name: string;
  } | null;
  teamBreakdown: {
    id: string;
    name: string;
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
  }[];
  topScorers: {
    id: string;
    name: string;
    number: number;
    position: string;
    avatarUrl: string | null;
    puntos: number;
    ataques: number;
    bloqueos: number;
    aces: number;
    recepciones: number;
    errores: number;
    eficiencia: number;
    matchesPlayed: number;
  }[];
  recentMatches: any[];
};

export type PlayerStats = {
  player: {
    id: string;
    name: string;
    dni: string;
    number: number;
    position: string;
    avatarUrl: string | null;
    isActive: boolean;
    teams: { id: string; name: string }[];
  };
  selectedTeam: { id: string; name: string } | null;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  totals: {
    puntos: number;
    ataques: number;
    bloqueos: number;
    aces: number;
    defensas: number;
    ventajas: number;
    erroresAtaque: number;
    erroresRecepcion: number;
    erroresSaque: number;
    bloqueosErrados: number;
    erroresTacticos: number;
  };
  positiveActions: number;
  negativeActions: number;
  totalActions: number;
  efficiency: number;
  pointsPerMatch: number;
  actionsPerMatch: number;
  errorsPerMatch: number;
  matchTimeline: {
    matchId: string;
    teamId: string;
    teamName: string;
    opponent: string;
    tournament: string | null;
    date: string;
    result: string | null;
    finalScore: string | null;
    puntos: number;
    ataques: number;
    bloqueos: number;
    aces: number;
    defensas: number;
    ventajas: number;
    errores: number;
    eficiencia: number;
    accionesTotales: number;
  }[];
};

export const statsService = {
  async getClubStats(clubId: string, teamId?: string) {
    const teamParam = teamId ? `&teamId=${teamId}` : '';
    return api.get<ClubStats>(`/api/stats?clubId=${clubId}${teamParam}`);
  },

  async getPlayerStats(clubId: string, playerId: string, teamId?: string) {
    const teamParam = teamId ? `&teamId=${teamId}` : '';
    return api.get<PlayerStats>(`/api/stats/player?clubId=${clubId}&playerId=${playerId}${teamParam}`);
  },
};
