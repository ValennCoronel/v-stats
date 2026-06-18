import { api } from '../api';

export type Match = {
  id: string;
  teamId: string;
  opponent: string;
  opponentTeamId: string | null;
  tournament: string | null;
  tournamentId: string | null;
  date: string;
  result: string | null;
  finalScore: string | null;
  setScores: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  opponentTeam?: { id: string; name: string; logoUrl: string | null };
  tournamentRef?: { id: string; name: string; logoUrl: string | null };
  _count?: { playerStats: number; actions: number };
};

export type MatchDetail = {
  match: Match;
  playerStats: any[];
  teamStats: {
    ataques: number;
    bloqueos: number;
    aces: number;
    errores: number;
    puntosTotales: number;
  };
  topPerformers: {
    name: string;
    stat: string;
    type: string;
  }[];
};

export type MatchActionPayload = {
  playerId: string;
  action: string;
  set: number;
  timestamp: string;
  activePlayerIds: string[];
};

type MatchesResponse = { matches: Match[] };
type MatchResponse = { match: Match };

export const matchesService = {
  async getMatches(teamId: string, status?: string, limit?: number) {
    let url = `/api/matches?teamId=${teamId}`;
    if (status) url += `&status=${status}`;
    if (limit) url += `&limit=${limit}`;
    return api.get<MatchesResponse>(url);
  },

  async getMatch(id: string) {
    return api.get<MatchDetail>(`/api/matches/${id}`);
  },

  async createFinishedMatch(data: {
    teamId: string;
    opponent: string;
    opponentTeamId?: string;
    tournament?: string;
    tournamentId?: string;
    date: string;
    result: string;
    finalScore: string;
    setScores: any[];
    actions: MatchActionPayload[];
    allPlayers: string[];
  }) {
    return api.post<MatchResponse>('/api/matches', data);
  },
};
