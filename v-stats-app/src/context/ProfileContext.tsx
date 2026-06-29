import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clubsService, Club } from '../services/clubs.service';
import { teamsService, Team } from '../services/teams.service';
import { playersService, Player as ApiPlayer } from '../services/players.service';

// ── Types ────────────────────────────────────────────────────────────────

export type Player = {
  id: string;
  name: string;
  dni: string;
  number: number;
  position: string;
  isActive: boolean;
};

export type TeamProfile = {
  id: string;
  name: string;
  gender?: string | null;
  category?: string | null;
  roster: Player[];
  matchCount: number;
  matches?: any[];
};

export type ClubProfile = {
  id: string;
  clubName: string;
  city: string;
  role: string;
  color: string;
  teams: TeamProfile[];
  players: Player[];
};

export type Coach = {
  name: string;
  email: string;
  avatarSrc: string | null;
};

// ── Context Type ─────────────────────────────────────────────────────────

interface ProfileContextType {
  coach: Coach;
  profiles: ClubProfile[];
  activeProfile: ClubProfile;
  activeProfileId: string;
  isLoading: boolean;
  error: string | null;
  switchProfile: (id: string) => void;
  addProfile: (data: { clubName: string; city: string; role?: string; color?: string }) => Promise<void>;
  updateProfile: (id: string, data: { clubName?: string; city?: string; color?: string; role?: string }) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  addTeam: (profileId: string, teamData: { name: string }) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const EMPTY_PROFILE: ClubProfile = {
  id: '__empty__',
  clubName: 'Sin Club',
  city: '-',
  role: 'coach',
  color: '#1E6FD9',
  teams: [],
  players: [],
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();

  const [profiles, setProfiles] = useState<ClubProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coach: Coach = {
    name: user?.displayName || user?.email?.split('@')[0] || 'Coach',
    email: user?.email || '',
    avatarSrc: null,
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || EMPTY_PROFILE;

  // ── Load clubs + teams + players on auth ──────────────────────────────

  const loadProfiles = useCallback(async () => {
    if (!isAuthenticated) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const clubsRes = await clubsService.getClubs();
      if (!clubsRes.data?.clubs) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      const clubProfiles: ClubProfile[] = [];

      for (const club of clubsRes.data.clubs) {
        // Load teams for this club
        const teamsRes = await teamsService.getTeams(club.id);
        const teams: TeamProfile[] = [];

        if (teamsRes.data?.teams) {
          for (const team of teamsRes.data.teams) {
            // Load players for this team
            const playersRes = await playersService.getPlayers(club.id, team.id);
            const roster: Player[] = (playersRes.data?.players || [])
              .filter((p: ApiPlayer) => p.isActive)
              .map((p: ApiPlayer) => ({
                id: p.id,
                name: p.name,
                dni: p.dni,
                number: p.number,
                position: p.position,
                isActive: p.isActive,
              }));

            teams.push({
              id: team.id,
              name: team.name,
              gender: team.gender,
              category: team.category,
              roster,
              matchCount: team._count?.matches || 0,
            });
          }
        }

        // Load players for this club directly
        const clubPlayersRes = await playersService.getPlayers(club.id);
        const clubPlayers: Player[] = (clubPlayersRes.data?.players || [])
          .filter((p: ApiPlayer) => p.isActive)
          .map((p: ApiPlayer) => ({
            id: p.id,
            name: p.name,
            dni: p.dni,
            number: p.number,
            position: p.position,
            isActive: p.isActive,
          }));

        clubProfiles.push({
          id: club.id,
          clubName: club.name,
          city: club.city,
          role: club.role,
          color: club.color,
          teams,
          players: clubPlayers,
        });
      }

      setProfiles(clubProfiles);
      if (clubProfiles.length > 0 && !clubProfiles.find(p => p.id === activeProfileId)) {
        setActiveProfileId(clubProfiles[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // ── Actions ─────────────────────────────────────────────────────────

  const switchProfile = (id: string) => setActiveProfileId(id);

  const addProfile = async (data: { clubName: string; city: string; role?: string; color?: string }) => {
    const res = await clubsService.createClub({
      name: data.clubName,
      city: data.city,
      color: data.color,
      role: data.role,
    });
    if (res.data?.club) {
      await loadProfiles();
    }
  };

  const updateProfile = async (id: string, data: { clubName?: string; city?: string; color?: string; role?: string }) => {
    const updateData: any = {};
    if (data.clubName) updateData.name = data.clubName;
    if (data.city) updateData.city = data.city;
    if (data.color) updateData.color = data.color;
    if (data.role) updateData.role = data.role;

    const res = await clubsService.updateClub(id, updateData);
    if (res.data?.club) {
      await loadProfiles();
    }
  };

  const deleteProfile = async (id: string) => {
    const res = await clubsService.deleteClub(id);
    if (res.data?.success) {
      if (activeProfileId === id) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfileId(remaining[0]?.id || '');
      }
      await loadProfiles();
    }
  };

  const addTeam = async (profileId: string, teamData: { name: string }) => {
    const res = await teamsService.createTeam({
      clubId: profileId,
      name: teamData.name,
    });
    if (res.data?.team) {
      await loadProfiles();
    }
  };

  return (
    <ProfileContext.Provider value={{
      coach, profiles, activeProfile, activeProfileId, isLoading, error,
      switchProfile, addProfile, updateProfile, deleteProfile, addTeam,
      refreshProfiles: loadProfiles,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile debe usarse dentro de ProfileProvider');
  return context;
};
