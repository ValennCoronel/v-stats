"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, Award, Target, Shield, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useProfileStore } from "@/lib/stores/profile-store"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

interface StatData {
  totalMatches: number
  winRate: number
  setsWon: number
  topScorers: any[]
  recentMatches: any[]
}

function StatKpi({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number | string
  unit?: string
  color: string
}) {
  return (
    <div className="text-center">
      <div
        style={{
          ...barlow,
          fontSize: "11px",
          color: "#94A3B8",
          letterSpacing: "0.5px",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{ ...barlow, fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: "13px", fontWeight: 500 }}>{unit}</span>
        )}
      </div>
    </div>
  )
}

function MedalIcon({ rank }: { rank: number }) {
  const colors = ["#F59E0B", "#94A3B8", "#D97706"]
  if (rank > 3) return null
  return (
    <div
      className="size-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: colors[rank - 1] }}
    >
      <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff" }}>
        {rank}
      </span>
    </div>
  )
}

export function StatsScreen() {
  const router = useRouter()
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)
  const [stats, setStats] = useState<StatData | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, playersRes] = await Promise.all([
        fetch(`/api/stats?clubId=${activeProfile.id}`),
        fetch(`/api/players?clubId=${activeProfile.id}`),
      ])
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (playersRes.ok) {
        const data = await playersRes.json()
        setPlayers(data.players?.filter((p: any) => p.isActive) || [])
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [activeProfile?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalMatches = stats?.totalMatches || 0
  const winRate = stats?.winRate || 0
  const setsWon = stats?.setsWon || 0
  const losses = totalMatches - Math.round((totalMatches * winRate) / 100)
  const wins = totalMatches - losses

  // Build player stats from topScorers
  const topScorers = stats?.topScorers || []
  const topScorer = topScorers[0]
  const topBlocker = topScorers.length > 1 ? topScorers[1] : topScorers[0]

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-[#64748B] mb-4">No tienes clubes registrados.</p>
        <button onClick={() => router.push("/settings")} className="bg-[#1E6FD9] text-white px-4 py-2 rounded-md font-medium">
          Configurar Perfil
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-24">
      {/* Header */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="size-4 text-white" />
          </button>
          <div className="flex-1">
            <p
              style={{
                ...barlow,
                fontSize: "11px",
                letterSpacing: "1.5px",
                opacity: 0.55,
              }}
            >
              ESTADÍSTICAS
            </p>
            <h1
              style={{
                ...barlow,
                fontSize: "22px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {activeProfile.name || activeProfile.clubName}
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
            { label: "PARTIDOS", value: totalMatches, color: "#fff" },
            { label: "GANADOS", value: wins, color: "#4ADE80" },
            { label: "PERDIDOS", value: losses, color: "#F87171" },
            { label: "EFECT.", value: `${winRate}%`, color: "#3D8EF5" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/10 rounded-xl py-3 text-center">
              <div
                style={{
                  ...barlow,
                  fontSize: "22px",
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  ...barlow,
                  fontSize: "9px",
                  letterSpacing: "0.8px",
                  opacity: 0.6,
                  marginTop: "3px",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Líderes de temporada */}
        {topScorers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3 px-0.5">
              <Award className="size-4 text-[#64748B]" />
              <span
                style={{
                  ...barlow,
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  color: "#64748B",
                }}
              >
                LÍDERES DE TEMPORADA
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "PUNTOS",
                  player: topScorer,
                  value: topScorer?.puntos || 0,
                  icon: <TrendingUp className="size-4" />,
                  color: "#1E6FD9",
                },
                {
                  label: "BLOQUEOS",
                  player: topBlocker,
                  value: topBlocker?.bloqueos || 0,
                  icon: <Shield className="size-4" />,
                  color: "#7C3AED",
                },
                {
                  label: "ACES",
                  player: topScorer,
                  value: topScorer?.aces || 0,
                  icon: <Target className="size-4" />,
                  color: "#16A34A",
                },
              ].map(({ label, player, value, icon, color }) => (
                <Card key={label} className="bg-white p-3 shadow-sm text-center">
                  <div
                    className="size-7 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ background: `${color}18`, color }}
                  >
                    {icon}
                  </div>
                  <div
                    style={{
                      ...barlow,
                      fontSize: "9px",
                      letterSpacing: "0.8px",
                      color: "#94A3B8",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      ...barlow,
                      fontSize: "22px",
                      fontWeight: 700,
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#0D1F33",
                      marginTop: "4px",
                      lineHeight: 1.2,
                    }}
                  >
                    {player?.name?.split(" ")[0] || "—"}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ranking de jugadores */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-0.5">
            <BarChart3 className="size-4 text-[#64748B]" />
            <span
              style={{
                ...barlow,
                fontSize: "12px",
                letterSpacing: "1.5px",
                color: "#64748B",
              }}
            >
              RENDIMIENTO INDIVIDUAL
            </span>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-[#64748B]">Cargando...</div>
            ) : topScorers.length === 0 ? (
              <div className="text-center py-8 text-[#64748B]">
                No hay estadísticas de jugadores aún
              </div>
            ) : (
              topScorers.map((player: any, idx: number) => {
                const initials = player.name
                  ? player.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "??"
                return (
                  <Card key={player.id || idx} className="bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <MedalIcon rank={idx + 1} />
                      {idx >= 3 && (
                        <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F4F7FB]">
                          <span
                            style={{
                              ...barlow,
                              fontSize: "10px",
                              color: "#94A3B8",
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                      )}
                      <Avatar className="size-9 flex-shrink-0">
                        <AvatarFallback
                          className="text-white"
                          style={{
                            ...barlow,
                            fontSize: "13px",
                            fontWeight: 700,
                            background: activeProfile.color,
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span
                          style={{
                            ...barlow,
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#0D1F33",
                          }}
                        >
                          {player.name?.split(" ")[0] || "Jugador"}
                        </span>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                          Ata: {player.ataques || 0} · Blo: {player.bloqueos || 0} · Ace:{" "}
                          {player.aces || 0}
                        </div>
                      </div>

                      {/* KPIs */}
                      <div className="flex gap-4 flex-shrink-0">
                        <StatKpi
                          label="PTS"
                          value={player.puntos || 0}
                          color="#1E6FD9"
                        />
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Sets stats */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-0.5">
            <Target className="size-4 text-[#64748B]" />
            <span
              style={{
                ...barlow,
                fontSize: "12px",
                letterSpacing: "1.5px",
                color: "#64748B",
              }}
            >
              TEMPORADA
            </span>
          </div>
          <Card className="bg-white shadow-sm px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div
                  style={{
                    ...barlow,
                    fontSize: "11px",
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  SETS WON
                </div>
                <div
                  style={{
                    ...barlow,
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1E6FD9",
                    lineHeight: 1,
                  }}
                >
                  {setsWon}
                </div>
              </div>
              <div className="text-center border-x border-[#F4F7FB]">
                <div
                  style={{
                    ...barlow,
                    fontSize: "11px",
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  PARTIDOS
                </div>
                <div
                  style={{
                    ...barlow,
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#0D1F33",
                    lineHeight: 1,
                  }}
                >
                  {totalMatches}
                </div>
              </div>
              <div className="text-center">
                <div
                  style={{
                    ...barlow,
                    fontSize: "11px",
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  EFECT. %
                </div>
                <div
                  style={{
                    ...barlow,
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#16A34A",
                    lineHeight: 1,
                  }}
                >
                  {winRate}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
