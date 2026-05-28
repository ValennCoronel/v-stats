import { api } from '../api/api';

export type Club = {
  id: string;
  name: string;
  city: string;
  color: string;
  role: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  teams: any[];
};

type ClubsResponse = { clubs: Club[] };
type ClubResponse = { club: Club };

export const clubsService = {
  async getClubs() {
    return api.get<ClubsResponse>('/api/clubs');
  },

  async createClub(data: { name: string; city: string; color?: string; role?: string }) {
    return api.post<ClubResponse>('/api/clubs', data);
  },

  async updateClub(id: string, data: { name?: string; city?: string; color?: string; role?: string }) {
    return api.put<ClubResponse>(`/api/clubs/${id}`, data);
  },

  async deleteClub(id: string) {
    return api.del<{ success: boolean }>(`/api/clubs/${id}`);
  },
};
