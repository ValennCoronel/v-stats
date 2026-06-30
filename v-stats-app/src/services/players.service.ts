import { api } from '../api';

export type Player = {
  id: string;
  clubId: string;
  teamId: string;
  dni: string;
  name: string;
  number: number;
  position: string;
  injuryHistory: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  team?: { name: string };
};

type PlayersResponse = { players: Player[] };
type PlayerResponse = { player: Player };

export const playersService = {
  async getPlayers(clubId: string, teamId?: string) {
    let url = `/api/players?clubId=${clubId}`;
    if (teamId) url += `&teamId=${teamId}`;
    return api.get<PlayersResponse>(url);
  },

  async createPlayer(data: {
    clubId: string;
    teamId: string;
    dni: string;
    name: string;
    number: number;
    position: string;
    injuryHistory?: string;
    avatarUrl?: string;
  }) {
    return api.post<PlayerResponse>('/api/players', data);
  },

  async updatePlayer(id: string, data: Partial<Omit<Player, 'id' | 'clubId' | 'createdAt' | 'updatedAt'>>) {
    return api.put<PlayerResponse>('/api/players', { id, ...data });
  },

  async deletePlayer(id: string) {
    return api.del<{ success: boolean }>(`/api/players?id=${id}`);
  },
};
