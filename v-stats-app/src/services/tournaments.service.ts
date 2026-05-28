import { api } from '../api/api';

export type Tournament = {
  id: string;
  name: string;
  logoUrl: string | null;
  lastUsedAt: string | null;
};

type TournamentsResponse = { tournaments: Tournament[] };
type TournamentResponse = { tournament: Tournament };

export const tournamentsService = {
  async getTournaments(search?: string) {
    let url = '/api/tournaments';
    if (search) url += `?search=${encodeURIComponent(search)}`;
    return api.get<TournamentsResponse>(url);
  },

  async createTournament(data: { name: string; logoUrl?: string }) {
    return api.post<TournamentResponse>('/api/tournaments', data);
  },

  async updateTournament(id: string, data: { name?: string; logoUrl?: string }) {
    return api.put<TournamentResponse>('/api/tournaments', { id, ...data });
  },

  async deleteTournament(id: string) {
    return api.del<{ success: boolean }>(`/api/tournaments?id=${id}`);
  },
};
