import { api } from '../api/api';

export type TeamShareLinkResponse = {
  shareLink: {
    id: string;
    token: string;
    url: string;
    createdAt: string;
    updatedAt: string;
    team: {
      id: string;
      name: string;
    };
  };
};

export const shareLinksService = {
  async createTeamShareLink(clubId: string, teamId: string) {
    return api.post<TeamShareLinkResponse>('/api/share-links', { clubId, teamId });
  },
};
