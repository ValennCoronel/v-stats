import { api } from '../api';

export type OpponentTeam = {
  id: string;
  name: string;
  logoUrl: string | null;
  lastUsedAt: string | null;
};

type OpponentTeamsResponse = { teams: OpponentTeam[] };
type OpponentTeamResponse = { team: OpponentTeam };

export const opponentTeamsService = {
  async getOpponentTeams(search?: string) {
    let url = '/api/opponent-teams';
    if (search) url += `?search=${encodeURIComponent(search)}`;
    return api.get<OpponentTeamsResponse>(url);
  },

  async createOpponentTeam(data: { name: string; logoUrl?: string }) {
    return api.post<OpponentTeamResponse>('/api/opponent-teams', data);
  },

  async updateOpponentTeam(id: string, data: { name?: string; logoUrl?: string }) {
    return api.put<OpponentTeamResponse>('/api/opponent-teams', { id, ...data });
  },

  async deleteOpponentTeam(id: string) {
    return api.del<{ success: boolean }>(`/api/opponent-teams?id=${id}`);
  },
};
