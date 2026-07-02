import { Platform } from 'react-native';
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
    recentMatchesPlayed: number;
    recentWins: number;
    recentLosses: number;
    recentPuntos: number;
    recentBloqueos: number;
    recentRecepciones: number;
    recentErrores: number;
    recentEficiencia: number;
    recentForm: {
      matchId: string;
      opponent: string;
      date: string;
      result: string | null;
      puntos: number;
      eficiencia: number;
    }[];
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

  async exportClubStats(clubId: string, teamId?: string, clubName: string = 'Club', teamName?: string): Promise<{ success: boolean; error: string | null }> {
    const teamParam = teamId ? `&teamId=${teamId}` : '';
    const res = await api.getText(`/api/stats/export?clubId=${clubId}${teamParam}`);
    
    if (res.error || !res.data) {
      return { success: false, error: res.error || 'No se pudieron descargar los datos' };
    }
    
    const csvContent = res.data;
    const cleanClubName = clubName.replace(/\s+/g, '_');
    const cleanTeamName = teamName ? teamName.replace(/\s+/g, '_') : 'General';
    const filename = `${cleanClubName}_${cleanTeamName}_Stats.csv`;

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, error: null };
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Estadísticas',
            UTI: 'public.comma-separated-values-text',
          });
          return { success: true, error: null };
        } else {
          return { success: false, error: 'Compartir no disponible en este dispositivo' };
        }
      }
    } catch (e: any) {
      console.error('Export error', e);
      return { success: false, error: e.message || 'Error al guardar el archivo' };
    }
  }
};
