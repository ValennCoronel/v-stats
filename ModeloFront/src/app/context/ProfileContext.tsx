import { createContext, useContext, useState, ReactNode } from 'react';

export type AccessRole = 'admin' | 'coach' | 'assistant';

export type Team = {
  id: number;
  name: string;
  players: number;
  matches: number;
  record: string;
};

export type ClubProfile = {
  id: string;
  clubName: string;
  city: string;
  role: AccessRole;
  color: string;      // accent color for the profile badge
  teams: Team[];
};

export type Coach = {
  name: string;
  email: string;
  avatarSrc: string | null;
};

type ProfileContextType = {
  coach: Coach;
  updateCoach: (data: Partial<Coach>) => void;
  profiles: ClubProfile[];
  activeProfileId: string;
  activeProfile: ClubProfile;
  switchProfile: (id: string) => void;
  addProfile: (data: Omit<ClubProfile, 'id' | 'teams'>) => void;
  updateProfile: (id: string, data: Partial<Omit<ClubProfile, 'id' | 'teams'>>) => void;
  deleteProfile: (id: string) => void;
  addTeam: (profileId: string, team: Omit<Team, 'id'>) => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

const INITIAL_PROFILES: ClubProfile[] = [
  {
    id: 'p1',
    clubName: 'Club Atlético Vóley',
    city: 'Buenos Aires',
    role: 'admin',
    color: '#1E6FD9',
    teams: [
      { id: 1, name: 'Equipo Femenino Senior', players: 12, matches: 8, record: '6-2' },
      { id: 2, name: 'Equipo Masculino U19', players: 14, matches: 10, record: '7-3' },
      { id: 3, name: 'Equipo Juvenil Femenino', players: 10, matches: 5, record: '3-2' },
    ],
  },
  {
    id: 'p2',
    clubName: 'Polideportivo Norte',
    city: 'Rosario',
    role: 'coach',
    color: '#D97706',
    teams: [
      { id: 4, name: 'Primera División Femenino', players: 13, matches: 6, record: '4-2' },
      { id: 5, name: 'Sub-17 Mixto', players: 11, matches: 4, record: '2-2' },
    ],
  },
  {
    id: 'p3',
    clubName: 'Escuela de Vóley BA',
    city: 'Córdoba',
    role: 'assistant',
    color: '#16A34A',
    teams: [
      { id: 6, name: 'Categoría Formativa A', players: 9, matches: 3, record: '2-1' },
    ],
  },
];

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [coach, setCoach] = useState<Coach>({
    name: 'Carlos Medina',
    email: 'carlos@vstats.app',
    avatarSrc: null,
  });

  const [profiles, setProfiles] = useState<ClubProfile[]>(INITIAL_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState('p1');

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? profiles[0];

  const updateCoach = (data: Partial<Coach>) =>
    setCoach(prev => ({ ...prev, ...data }));

  const switchProfile = (id: string) => setActiveProfileId(id);

  const addProfile = (data: Omit<ClubProfile, 'id' | 'teams'>) => {
    const newProfile: ClubProfile = {
      ...data,
      id: `p${Date.now()}`,
      teams: [],
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const updateProfile = (id: string, data: Partial<Omit<ClubProfile, 'id' | 'teams'>>) =>
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

  const deleteProfile = (id: string) => {
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      if (activeProfileId === id && next.length > 0) setActiveProfileId(next[0].id);
      return next;
    });
  };

  const addTeam = (profileId: string, team: Omit<Team, 'id'>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      const newTeam: Team = { ...team, id: Date.now() };
      return { ...p, teams: [...p.teams, newTeam] };
    }));
  };

  return (
    <ProfileContext.Provider value={{
      coach, updateCoach,
      profiles, activeProfileId, activeProfile,
      switchProfile, addProfile, updateProfile, deleteProfile, addTeam,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
