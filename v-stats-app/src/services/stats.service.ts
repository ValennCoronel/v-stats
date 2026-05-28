import { api } from '../api/api';

export type ClubStats = {
  totalMatches: number;
  winRate: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  totalPoints: number;
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
  async getClubStats(clubId: string) {
    return api.get<ClubStats>(`/api/stats?clubId=${clubId}`);
  },
};
