import { useNavigate } from 'react-router';
import { ArrowLeft, Home, BarChart3, Settings, TrendingUp, Award, Target, Shield } from 'lucide-react';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useProfile } from '../../context/ProfileContext';

const barlow = { fontFamily: "'Barlow Condensed', sans-serif" };

type PlayerSeasonStats = {
  id: number;
  name: string;
  position: string;
  initials: string;
  number: string;
  eficiencia: number;
  puntos: number;
  bloqueos: number;
  saques: number;
  recepciones: number;
  destacado?: boolean;
};

const clubPlayerStats: Record<string, PlayerSeasonStats[]> = {
  p1: [
    { id: 1, name: 'María González', position: 'Opuesta', initials: 'MG', number: '5', eficiencia: 72, puntos: 148, bloqueos: 18, saques: 22, recepciones: 85, destacado: true },
    { id: 6, name: 'Valentina Silva', position: 'Punta', initials: 'VS', number: '10', eficiencia: 68, puntos: 132, bloqueos: 12, saques: 19, recepciones: 79, destacado: true },
    { id: 5, name: 'Carolina López', position: 'Central', initials: 'CL', number: '7', eficiencia: 65, puntos: 110, bloqueos: 31, saques: 14, recepciones: 68 },
    { id: 2, name: 'Ana Rodríguez', position: 'Central', initials: 'AR', number: '12', eficiencia: 61, puntos: 97, bloqueos: 28, saques: 11, recepciones: 72 },
    { id: 4, name: 'Sofia Martínez', position: 'Armadora', initials: 'SM', number: '3', eficiencia: 59, puntos: 34, bloqueos: 8, saques: 27, recepciones: 88 },
    { id: 3, name: 'Laura Pérez', position: 'Punta', initials: 'LP', number: '8', eficiencia: 63, puntos: 121, bloqueos: 9, saques: 21, recepciones: 91 },
    { id: 7, name: 'Florencia Castro', position: 'Líbero', initials: 'FC', number: '1', eficiencia: 88, puntos: 0, bloqueos: 0, saques: 0, recepciones: 94 },
  ],
  p2: [
    { id: 11, name: 'Lucía Torres', position: 'Opuesta', initials: 'LT', number: '4', eficiencia: 70, puntos: 138, bloqueos: 15, saques: 20, recepciones: 76, destacado: true },
    { id: 12, name: 'Daniela Ramos', position: 'Central', initials: 'DR', number: '9', eficiencia: 66, puntos: 112, bloqueos: 29, saques: 13, recepciones: 70, destacado: true },
    { id: 13, name: 'Camila Vega', position: 'Punta', initials: 'CV', number: '2', eficiencia: 62, puntos: 98, bloqueos: 10, saques: 18, recepciones: 82 },
  ],
  p3: [
    { id: 21, name: 'Martina Cruz', position: 'Opuesta', initials: 'MC', number: '6', eficiencia: 67, puntos: 89, bloqueos: 11, saques: 15, recepciones: 73, destacado: true },
    { id: 22, name: 'Agustina Paz', position: 'Central', initials: 'AP', number: '11', eficiencia: 58, puntos: 72, bloqueos: 22, saques: 9, recepciones: 65 },
  ],
};

const teamSeasonData: Record<string, { wins: number; losses: number; setsWon: number; setsLost: number; totalPoints: number }> = {
  p1: { wins: 16, losses: 5, setsWon: 52, setsLost: 24, totalPoints: 642 },
  p2: { wins: 10, losses: 4, setsWon: 33, setsLost: 18, totalPoints: 412 },
  p3: { wins: 5, losses: 3, setsWon: 17, setsLost: 11, totalPoints: 219 },
};

function StatKpi({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color: string }) {
  return (
    <div className="text-center">
      <div style={{ ...barlow, fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ ...barlow, fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: '13px', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function MedalIcon({ rank }: { rank: number }) {
  const colors = ['#F59E0B', '#94A3B8', '#D97706'];
  if (rank > 3) return null;
  return (
    <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors[rank - 1] }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{rank}</span>
    </div>
  );
}

export default function StatsScreen() {
  const navigate = useNavigate();
  const { activeProfile } = useProfile();

  const players = clubPlayerStats[activeProfile.id] ?? clubPlayerStats['p1'];
  const season = teamSeasonData[activeProfile.id] ?? teamSeasonData['p1'];
  const totalMatches = season.wins + season.losses;
  const winRate = Math.round((season.wins / Math.max(totalMatches, 1)) * 100);

  const sortedByPoints = [...players].sort((a, b) => b.puntos - a.puntos);
  const topScorer = sortedByPoints[0];
  const topBlocker = [...players].sort((a, b) => b.bloqueos - a.bloqueos)[0];
  const topRecepcion = [...players].sort((a, b) => b.recepciones - a.recepciones)[0];

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-24">

      {/* Header */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/home')}
            className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="size-4 text-white" />
          </button>
          <div className="flex-1">
            <p style={{ ...barlow, fontSize: '11px', letterSpacing: '1.5px', opacity: 0.55 }}>ESTADÍSTICAS</p>
            <h1 style={{ ...barlow, fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
              {activeProfile.clubName}
            </h1>
          </div>
          <div
            className="size-3 rounded-full flex-shrink-0"
            style={{ background: activeProfile.color }}
          />
        </div>

        {/* Season overview row */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: 'PARTIDOS', value: totalMatches, color: '#fff' },
            { label: 'GANADOS', value: season.wins, color: '#4ADE80' },
            { label: 'PERDIDOS', value: season.losses, color: '#F87171' },
            { label: 'EFECT.', value: `${winRate}%`, color: '#3D8EF5' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/10 rounded-xl py-3 text-center">
              <div style={{ ...barlow, fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ ...barlow, fontSize: '9px', letterSpacing: '0.8px', opacity: 0.6, marginTop: '3px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Líderes de temporada */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-0.5">
            <Award className="size-4 text-[#64748B]" />
            <span style={{ ...barlow, fontSize: '12px', letterSpacing: '1.5px', color: '#64748B' }}>LÍDERES DE TEMPORADA</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PUNTOS', player: topScorer, value: topScorer?.puntos, icon: <TrendingUp className="size-4" />, color: '#1E6FD9' },
              { label: 'BLOQUEOS', player: topBlocker, value: topBlocker?.bloqueos, icon: <Shield className="size-4" />, color: '#7C3AED' },
              { label: 'RECEP.', player: topRecepcion, value: `${topRecepcion?.recepciones}%`, icon: <Target className="size-4" />, color: '#16A34A' },
            ].map(({ label, player, value, icon, color }) => (
              <Card key={label} className="bg-white p-3 shadow-sm text-center">
                <div className="size-7 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: `${color}18`, color }}>
                  {icon}
                </div>
                <div style={{ ...barlow, fontSize: '9px', letterSpacing: '0.8px', color: '#94A3B8', marginBottom: '4px' }}>{label}</div>
                <div style={{ ...barlow, fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '10px', color: '#0D1F33', marginTop: '4px', lineHeight: 1.2 }}>
                  {player?.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>{player?.position}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Ranking de jugadores */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-0.5">
            <BarChart3 className="size-4 text-[#64748B]" />
            <span style={{ ...barlow, fontSize: '12px', letterSpacing: '1.5px', color: '#64748B' }}>RENDIMIENTO INDIVIDUAL</span>
          </div>
          <div className="space-y-2">
            {sortedByPoints.map((player, idx) => (
              <Card key={player.id} className="bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <MedalIcon rank={idx + 1} />
                  {idx >= 3 && (
                    <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F4F7FB]">
                      <span style={{ ...barlow, fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</span>
                    </div>
                  )}
                  <Avatar className="size-9 flex-shrink-0">
                    <AvatarFallback
                      className="text-white"
                      style={{ ...barlow, fontSize: '13px', fontWeight: 700, background: activeProfile.color }}
                    >
                      {player.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ ...barlow, fontSize: '16px', fontWeight: 600, color: '#0D1F33' }}>
                        #{player.number} {player.name.split(' ')[0]}
                      </span>
                      {player.destacado && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ ...barlow, background: activeProfile.color, letterSpacing: '0.3px' }}>
                          ★
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{player.position}</div>
                  </div>

                  {/* KPIs */}
                  <div className="flex gap-4 flex-shrink-0">
                    <StatKpi label="PTS" value={player.puntos} color="#1E6FD9" />
                    <StatKpi label="EFC" value={`${player.eficiencia}`} unit="%" color={player.eficiencia >= 65 ? '#16A34A' : player.eficiencia >= 55 ? '#F59E0B' : '#EF4444'} />
                    {player.position !== 'Líbero' && player.position !== 'Armadora' && (
                      <StatKpi label="BLQ" value={player.bloqueos} color="#7C3AED" />
                    )}
                    {(player.position === 'Líbero' || player.position === 'Armadora') && (
                      <StatKpi label="REC" value={`${player.recepciones}`} unit="%" color="#16A34A" />
                    )}
                  </div>
                </div>

                {/* mini bar eficiencia */}
                <div className="h-1 mx-4 mb-3 bg-[#F4F7FB] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${player.eficiencia}%`,
                      background: player.eficiencia >= 65 ? '#16A34A' : player.eficiencia >= 55 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sets stats */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-0.5">
            <Target className="size-4 text-[#64748B]" />
            <span style={{ ...barlow, fontSize: '12px', letterSpacing: '1.5px', color: '#64748B' }}>TEMPORADA</span>
          </div>
          <Card className="bg-white shadow-sm px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div style={{ ...barlow, fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', marginBottom: '4px' }}>SETS WON</div>
                <div style={{ ...barlow, fontSize: '28px', fontWeight: 700, color: '#1E6FD9', lineHeight: 1 }}>{season.setsWon}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>de {season.setsWon + season.setsLost}</div>
              </div>
              <div className="text-center border-x border-[#F4F7FB]">
                <div style={{ ...barlow, fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', marginBottom: '4px' }}>PUNTOS</div>
                <div style={{ ...barlow, fontSize: '28px', fontWeight: 700, color: '#0D1F33', lineHeight: 1 }}>{season.totalPoints}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>en total</div>
              </div>
              <div className="text-center">
                <div style={{ ...barlow, fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', marginBottom: '4px' }}>SETS %</div>
                <div style={{ ...barlow, fontSize: '28px', fontWeight: 700, color: '#16A34A', lineHeight: 1 }}>
                  {Math.round((season.setsWon / Math.max(season.setsWon + season.setsLost, 1)) * 100)}%
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>efectividad</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 flex justify-around">
        <button className="flex flex-col items-center gap-1 text-[#64748B]" onClick={() => navigate('/home')}>
          <Home className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Home</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: activeProfile.color }}>
          <BarChart3 className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#64748B]" onClick={() => navigate('/config')}>
          <Settings className="size-6" />
          <span style={{ ...barlow, fontSize: '12px' }}>Config</span>
        </button>
      </div>
    </div>
  );
}
