import { api } from '../api';

export type Team = {
  id: string;
  clubId: string;
  name: string;
  logoUrl: string | null;
  gender: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { players: number; matches: number };
};

type TeamsResponse = { teams: Team[] };
type TeamResponse = { team: Team };

export const teamsService = {
  async getTeams(clubId: string) {
    return api.get<TeamsResponse>(`/api/teams?clubId=${clubId}`);
  },

  async createTeam(data: { clubId: string; name: string; logoUrl?: string; gender?: string; category?: string }) {
    return api.post<TeamResponse>('/api/teams', data);
  },

  async updateTeam(id: string, data: { name?: string; logoUrl?: string; gender?: string; category?: string }) {
    return api.put<TeamResponse>('/api/teams', { id, ...data });
  },

  async deleteTeam(id: string) {
    return api.del<{ success: boolean }>(`/api/teams?id=${id}`);
  },
};
