import { api } from '../api/api';

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

export const statsService = {
  async getClubStats(clubId: string, teamId?: string) {
    const teamParam = teamId ? `&teamId=${teamId}` : '';
    return api.get<ClubStats>(`/api/stats?clubId=${clubId}${teamParam}`);
  },
};
