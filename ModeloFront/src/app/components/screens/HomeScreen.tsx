import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, BarChart3, Settings, Plus, ChevronDown, Check, Building2, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { useProfile, ClubProfile } from '../../context/ProfileContext';

const barlow = { fontFamily: "'Barlow Condensed', sans-serif" };

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  assistant: 'Asistente',
};

export default function HomeScreen() {
  const navigate = useNavigate();
  const { coach, profiles, activeProfile, switchProfile, addTeam } = useProfile();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamName, setTeamName] = useState('');

  const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSwitch = (id: string) => {
    switchProfile(id);
    setShowSwitcher(false);
  };

  const handleAddTeam = () => {
    if (!teamName.trim()) return;
    addTeam(activeProfile.id, { name: teamName.trim(), players: 0, matches: 0, record: '0-0' });
    setTeamName('');
    setShowAddTeam(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">

      {/* ── Header ── */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          {/* Coach info */}
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-white/20">
              {coach.avatarSrc && <AvatarImage src={coach.avatarSrc} />}
              <AvatarFallback
                className="bg-[#1E6FD9] text-white"
                style={{ ...barlow, fontSize: '16px', fontWeight: 700 }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.5px' }}>Bienvenido,</p>
              <p style={{ ...barlow, fontSize: '17px', fontWeight: 700, lineHeight: 1 }}>{coach.name}</p>
            </div>
          </div>

          {/* Settings shortcut */}
          <button
            onClick={() => navigate('/config')}
            className="size-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Settings className="size-4 text-white" />
          </button>
        </div>

        {/* Club Switcher pill */}
        <button
          onClick={() => setShowSwitcher(true)}
          className="w-full flex items-center justify-between bg-white/10 border border-white/15 rounded-xl px-4 py-3 active:bg-white/15 transition-all"
        >
          <div className="flex items-center gap-3">
            {/* Color dot */}
            <div
              className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${activeProfile.color}30` }}
            >
              <Building2 className="size-4" style={{ color: activeProfile.color }} />
            </div>
            <div className="text-left">
              <p style={{ ...barlow, fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>
                {activeProfile.clubName}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.55, marginTop: '2px' }}>
                {activeProfile.city} · {roleLabel[activeProfile.role]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ ...barlow, fontSize: '10px', letterSpacing: '1px', opacity: 0.5 }}>
              CAMBIAR
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </div>
        </button>
      </div>

      {/* ── Teams List ── */}
      <div className="px-4 pt-5 pb-32 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 style={{ ...barlow, fontSize: '18px', fontWeight: 700, color: '#0D1F33', letterSpacing: '0.5px' }}>
            MIS EQUIPOS
          </h2>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            {activeProfile.teams.length} equipos
          </span>
        </div>

        {activeProfile.teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 bg-[#E2E8F0] rounded-full flex items-center justify-center mb-4">
              <Building2 className="size-7 text-[#94A3B8]" />
            </div>
            <p style={{ ...barlow, fontSize: '18px', fontWeight: 600, color: '#0D1F33' }}>
              Sin equipos aún
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Agregá el primer equipo de {activeProfile.clubName}
            </p>
          </div>
        ) : (
          activeProfile.teams.map((team) => (
            <Card
              key={team.id}
              className="bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative"
              onClick={() => navigate(`/team/${team.id}`)}
            >
              {/* Left color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                style={{ background: activeProfile.color }}
              />
              <div className="pl-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 style={{ ...barlow, fontSize: '19px', fontWeight: 600, color: '#0D1F33' }}>
                    {team.name}
                  </h3>
                  <Badge
                    style={{
                      ...barlow,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      background: activeProfile.color,
                      color: '#fff',
                    }}
                  >
                    VÓLEY
                  </Badge>
                </div>
                <div className="flex gap-5 text-sm">
                  <div>
                    <span className="text-[#64748B]">Jugadores </span>
                    <span style={{ color: '#0D1F33', fontWeight: 500 }}>{team.players}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Partidos </span>
                    <span style={{ color: '#0D1F33', fontWeight: 500 }}>{team.matches}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Record </span>
                    <span style={{ color: activeProfile.color, fontWeight: 600 }}>{team.record}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => { setTeamName(''); setShowAddTeam(true); }}
        className="fixed bottom-24 right-6 size-14 rounded-full shadow-lg"
        style={{ background: activeProfile.color }}
      >
        <Plus className="size-6" />
      </Button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 flex justify-around">
        <button className="flex flex-col items-center gap-1" style={{ color: activeProfile.color }}>
          <Home className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Home</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[#64748B]"
          onClick={() => navigate('/stats/1')}
        >
          <BarChart3 className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Stats</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[#64748B]"
          onClick={() => navigate('/config')}
        >
          <Settings className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Config</span>
        </button>
      </div>

      {/* ── Add Team Modal ── */}
      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33' }}>
            Nuevo Equipo
          </DialogTitle>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            Agregar equipo en <strong>{activeProfile.clubName}</strong>
          </p>
          <div className="space-y-4">
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>
                NOMBRE DEL EQUIPO
              </label>
              <Input
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
                placeholder="Ej: Equipo Femenino Senior"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddTeam(false)}>
                CANCELAR
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ background: activeProfile.color, ...barlow, letterSpacing: '1px' }}
                onClick={handleAddTeam}
                disabled={!teamName.trim()}
              >
                AGREGAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Club Switcher Modal ── */}
      <Dialog open={showSwitcher} onOpenChange={setShowSwitcher}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33', marginBottom: '4px' }}>
            Cambiar de Club
          </DialogTitle>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            {coach.email} · {profiles.length} {profiles.length === 1 ? 'perfil' : 'perfiles'}
          </p>

          <div className="space-y-2 mb-4">
            {profiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={profile.id === activeProfile.id}
                onSelect={() => handleSwitch(profile.id)}
              />
            ))}
          </div>

          <button
            onClick={() => { setShowSwitcher(false); navigate('/config'); }}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] rounded-xl py-3 text-[#64748B] hover:border-[#1E6FD9] hover:text-[#1E6FD9] transition-colors"
          >
            <Plus className="size-4" />
            <span style={{ ...barlow, fontSize: '14px', letterSpacing: '0.5px' }}>
              AGREGAR CLUB
            </span>
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileCard({
  profile, isActive, onSelect,
}: {
  profile: ClubProfile;
  isActive: boolean;
  onSelect: () => void;
}) {
  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    coach: 'Entrenador',
    assistant: 'Asistente',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
        isActive ? 'border-[#1E6FD9] bg-[#1E6FD9]/5' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
      }`}
    >
      <div
        className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${profile.color}20` }}
      >
        <Building2 className="size-5" style={{ color: profile.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: '#0D1F33',
            lineHeight: 1.2,
          }}
          className="truncate"
        >
          {profile.clubName}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }} className="flex items-center gap-1.5">
          <MapPin className="size-3" />
          {profile.city} · {roleLabel[profile.role]}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', color: '#94A3B8' }}>
          {profile.teams.length} eq.
        </span>
        {isActive && (
          <div className="size-5 bg-[#1E6FD9] rounded-full flex items-center justify-center">
            <Check className="size-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}
