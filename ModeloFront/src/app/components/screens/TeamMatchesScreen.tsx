import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ChevronRight, Play, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

const barlow = { fontFamily: "'Barlow Condensed', sans-serif" };

type MatchStatus = 'live' | 'upcoming' | 'finished';

type Match = {
  id: number;
  opponent: string;
  date: string;
  time: string;
  status: MatchStatus;
  location: string;
  // finished
  result?: 'W' | 'L';
  setsWon?: number;
  setsLost?: number;
  setScores?: string[];
  // live
  liveScore?: { home: number; away: number; set: number };
};

const teamsData: Record<string, { name: string; matches: Match[] }> = {
  '1': {
    name: 'Equipo Femenino Senior',
    matches: [
      {
        id: 101,
        opponent: 'Club Náutico',
        date: 'HOY',
        time: '19:30',
        status: 'live',
        location: 'Gimnasio Central',
        liveScore: { home: 18, away: 15, set: 2 },
      },
      {
        id: 102,
        opponent: 'Atlético Belgrano',
        date: 'Sáb 10 May',
        time: '18:00',
        status: 'upcoming',
        location: 'Club Belgrano',
      },
      {
        id: 103,
        opponent: 'Los Pumas VC',
        date: 'Mié 14 May',
        time: '20:00',
        status: 'upcoming',
        location: 'Gimnasio Central',
      },
      {
        id: 104,
        opponent: 'Riviera Vóley',
        date: 'Sáb 3 May',
        time: '17:00',
        status: 'finished',
        location: 'Riviera Club',
        result: 'W',
        setsWon: 3,
        setsLost: 1,
        setScores: ['25-20', '22-25', '25-18', '25-21'],
      },
      {
        id: 105,
        opponent: 'Deportivo Norte',
        date: 'Mié 30 Abr',
        time: '19:00',
        status: 'finished',
        location: 'Gimnasio Central',
        result: 'W',
        setsWon: 3,
        setsLost: 0,
        setScores: ['25-15', '25-17', '25-14'],
      },
      {
        id: 106,
        opponent: 'Club Náutico',
        date: 'Sáb 26 Abr',
        time: '16:00',
        status: 'finished',
        location: 'Club Náutico',
        result: 'L',
        setsWon: 1,
        setsLost: 3,
        setScores: ['20-25', '25-22', '19-25', '18-25'],
      },
      {
        id: 107,
        opponent: 'Atlético Belgrano',
        date: 'Mié 23 Abr',
        time: '20:00',
        status: 'finished',
        location: 'Gimnasio Central',
        result: 'W',
        setsWon: 3,
        setsLost: 2,
        setScores: ['25-23', '18-25', '25-20', '20-25', '15-12'],
      },
      {
        id: 108,
        opponent: 'Los Pumas VC',
        date: 'Sáb 19 Abr',
        time: '17:30',
        status: 'finished',
        location: 'Pumas Gym',
        result: 'W',
        setsWon: 3,
        setsLost: 0,
        setScores: ['25-18', '25-21', '25-19'],
      },
    ],
  },
  '2': {
    name: 'Equipo Masculino U19',
    matches: [
      {
        id: 201,
        opponent: 'Colegio San Martín',
        date: 'Vie 9 May',
        time: '15:00',
        status: 'upcoming',
        location: 'San Martín Gym',
      },
      {
        id: 202,
        opponent: 'Club Universidad',
        date: 'Sáb 17 May',
        time: '11:00',
        status: 'upcoming',
        location: 'Gimnasio Central',
      },
      {
        id: 203,
        opponent: 'Deportivo Sur',
        date: 'Mar 5 May',
        time: '18:00',
        status: 'finished',
        location: 'Deportivo Sur',
        result: 'W',
        setsWon: 3,
        setsLost: 1,
        setScores: ['25-22', '21-25', '25-19', '25-20'],
      },
      {
        id: 204,
        opponent: 'Club Universitario',
        date: 'Sáb 26 Abr',
        time: '10:00',
        status: 'finished',
        location: 'Gimnasio Central',
        result: 'L',
        setsWon: 0,
        setsLost: 3,
        setScores: ['18-25', '20-25', '22-25'],
      },
    ],
  },
  '3': {
    name: 'Equipo Juvenil Femenino',
    matches: [
      {
        id: 301,
        opponent: 'Escuela Deportiva A',
        date: 'Dom 11 May',
        time: '10:00',
        status: 'upcoming',
        location: 'Gimnasio Central',
      },
      {
        id: 302,
        opponent: 'Club Juvenil Norte',
        date: 'Sáb 3 May',
        time: '09:00',
        status: 'finished',
        location: 'Club Norte',
        result: 'W',
        setsWon: 2,
        setsLost: 0,
        setScores: ['25-14', '25-18'],
      },
      {
        id: 303,
        opponent: 'Escuela Deportiva B',
        date: 'Sáb 26 Abr',
        time: '11:00',
        status: 'finished',
        location: 'Gimnasio Central',
        result: 'L',
        setsWon: 1,
        setsLost: 2,
        setScores: ['25-20', '18-25', '14-25'],
      },
    ],
  },
};

export default function TeamMatchesScreen() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [startMatchId, setStartMatchId] = useState<number | null>(null);

  const teamData = teamsData[teamId ?? '1'] ?? teamsData['1'];
  const { name, matches } = teamData;

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  const startingMatch = matches.find(m => m.id === startMatchId);

  const handleMatchPress = (match: Match) => {
    if (match.status === 'live') {
      navigate(`/match/${match.id}`, { state: { teamId: teamId ?? '1' } });
    } else if (match.status === 'finished') {
      navigate(`/stats/${match.id}`);
    } else {
      setStartMatchId(match.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-[#0D1F33] text-white">
        <div className="flex items-center gap-3 px-4 pt-10 pb-5">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center justify-center size-8 rounded-full bg-white/10 flex-shrink-0"
          >
            <ArrowLeft className="size-4 text-white" />
          </button>
          <div className="flex-1">
            <p style={{ ...barlow, fontSize: '11px', letterSpacing: '1.5px', opacity: 0.55 }}>
              MIS EQUIPOS
            </p>
            <h1 style={{ ...barlow, fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
              {name}
            </h1>
          </div>
          <div
            className="bg-white/10 rounded-lg px-3 py-1.5 text-center"
            style={{ ...barlow, fontSize: '12px', letterSpacing: '0.5px', opacity: 0.85 }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
              {matches.filter(m => m.status === 'finished' && m.result === 'W').length}-
              {matches.filter(m => m.status === 'finished' && m.result === 'L').length}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>RECORD</div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex border-t border-white/10">
          {[
            { label: 'EN CURSO', value: liveMatches.length, highlight: liveMatches.length > 0 },
            { label: 'PRÓXIMOS', value: upcomingMatches.length, highlight: false },
            { label: 'JUGADOS', value: finishedMatches.length, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="flex-1 text-center py-3">
              <div
                style={{ ...barlow, fontSize: '20px', fontWeight: 700, lineHeight: 1 }}
                className={highlight ? 'text-red-400' : 'text-white'}
              >
                {value}
              </div>
              <div style={{ ...barlow, fontSize: '10px', letterSpacing: '1px', opacity: 0.5 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 pb-10">
        {/* EN CURSO */}
        {liveMatches.length > 0 && (
          <section>
            <SectionTitle label="EN CURSO" color="#EF4444" dot />
            {liveMatches.map(match => (
              <LiveCard key={match.id} match={match} onPress={() => handleMatchPress(match)} />
            ))}
          </section>
        )}

        {/* PRÓXIMOS */}
        {upcomingMatches.length > 0 && (
          <section>
            <SectionTitle label="PRÓXIMOS PARTIDOS" color="#1E6FD9" />
            <div className="space-y-2">
              {upcomingMatches.map(match => (
                <UpcomingCard key={match.id} match={match} onPress={() => handleMatchPress(match)} />
              ))}
            </div>
          </section>
        )}

        {/* FINALIZADOS */}
        {finishedMatches.length > 0 && (
          <section>
            <SectionTitle label="FINALIZADOS" color="#64748B" />
            <div className="space-y-2">
              {finishedMatches.map(match => (
                <FinishedCard key={match.id} match={match} onPress={() => handleMatchPress(match)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Start Match Modal */}
      <Dialog open={startMatchId !== null} onOpenChange={() => setStartMatchId(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <div className="text-center pt-2 pb-1">
            <div className="size-16 bg-[#1E6FD9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="size-7 text-[#1E6FD9] fill-[#1E6FD9]" />
            </div>
            <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33' }}>
              Iniciar Partido
            </DialogTitle>
            {startingMatch && (
              <p className="text-[#64748B] mt-2 mb-1" style={{ fontSize: '14px' }}>
                {name}
              </p>
            )}
            {startingMatch && (
              <div
                className="bg-[#F4F7FB] rounded-xl px-4 py-3 mt-4 mb-5 text-left space-y-2"
              >
                <Row label="Rival" value={startingMatch.opponent} />
                <Row label="Fecha" value={startingMatch.date} />
                <Row label="Hora" value={startingMatch.time} />
                <Row label="Sede" value={startingMatch.location} />
              </div>
            )}
            <p className="text-[#64748B] mb-5" style={{ fontSize: '13px' }}>
              ¿Confirmás que querés iniciar este partido?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStartMatchId(null)}
                style={{ ...barlow, letterSpacing: '1px' }}
              >
                CANCELAR
              </Button>
              <Button
                className="flex-1 bg-[#1E6FD9] hover:bg-[#1557B0]"
                onClick={() => {
                  setStartMatchId(null);
                  navigate(`/match/${startMatchId}`, { state: { teamId: teamId ?? '1' } });
                }}
                style={{ ...barlow, letterSpacing: '1px' }}
              >
                INICIAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Sub-components ── */

function SectionTitle({ label, color, dot }: { label: string; color: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {dot && <div className="size-2 rounded-full bg-red-500 animate-pulse" />}
      <span
        style={{
          ...barlow,
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '1.5px',
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function LiveCard({ match, onPress }: { match: Match; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="w-full bg-[#0D1F33] text-white rounded-xl p-4 flex items-center gap-3 shadow-md active:opacity-90"
    >
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-2 bg-red-400 rounded-full animate-pulse" />
          <span style={{ ...barlow, fontSize: '11px', letterSpacing: '1px', color: '#EF4444' }}>EN VIVO · SET {match.liveScore?.set}</span>
        </div>
        <div style={{ ...barlow, fontSize: '18px', fontWeight: 700 }}>{match.opponent}</div>
        <div style={{ fontSize: '12px', opacity: 0.55, marginTop: '2px' }}>{match.location}</div>
      </div>
      <div className="text-right mr-3">
        <div style={{ ...barlow, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#3D8EF5' }}>
          {match.liveScore?.home}
          <span style={{ fontSize: '20px', opacity: 0.4, margin: '0 4px' }}>-</span>
          <span style={{ color: '#FFFFFF' }}>{match.liveScore?.away}</span>
        </div>
      </div>
      <ChevronRight className="size-5 opacity-40 flex-shrink-0" />
    </button>
  );
}

function UpcomingCard({ match, onPress }: { match: Match; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="w-full bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-[#E2E8F0] active:bg-[#F4F7FB]"
    >
      <div className="size-10 rounded-xl bg-[#1E6FD9]/10 flex items-center justify-center flex-shrink-0">
        <Clock className="size-5 text-[#1E6FD9]" />
      </div>
      <div className="flex-1 text-left">
        <div style={{ ...barlow, fontSize: '17px', fontWeight: 600, color: '#0D1F33' }}>
          {match.opponent}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>
          {match.date} · {match.time} · {match.location}
        </div>
      </div>
      <div
        className="bg-[#1E6FD9] text-white rounded-lg px-3 py-1.5 flex-shrink-0"
        style={{ ...barlow, fontSize: '11px', letterSpacing: '1px' }}
      >
        INICIAR
      </div>
    </button>
  );
}

function FinishedCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const isWin = match.result === 'W';
  return (
    <button
      onClick={onPress}
      className="w-full bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-[#E2E8F0] active:bg-[#F4F7FB]"
    >
      <div
        className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isWin ? 'bg-green-50' : 'bg-red-50'
        }`}
      >
        <CheckCircle2 className={`size-5 ${isWin ? 'text-green-500' : 'text-red-400'}`} />
      </div>
      <div className="flex-1 text-left">
        <div style={{ ...barlow, fontSize: '17px', fontWeight: 600, color: '#0D1F33' }}>
          {match.opponent}
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
          {match.date} · {match.setScores?.join('  ')}
        </div>
      </div>
      <div className="text-right flex-shrink-0 mr-1">
        <div
          style={{
            ...barlow,
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: 1,
            color: isWin ? '#16A34A' : '#EF4444',
          }}
        >
          {match.setsWon}-{match.setsLost}
        </div>
        <div style={{ ...barlow, fontSize: '10px', color: '#64748B', letterSpacing: '0.5px' }}>SETS</div>
      </div>
      <ChevronRight className="size-4 text-[#CBD5E1] flex-shrink-0" />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ ...barlow, fontSize: '13px', color: '#64748B', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ ...barlow, fontSize: '14px', fontWeight: 600, color: '#0D1F33' }}>
        {value}
      </span>
    </div>
  );
}
