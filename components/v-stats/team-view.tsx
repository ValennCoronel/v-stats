"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Calendar, Trophy, ChevronRight } from "lucide-react"
import { useProfileStore, type Team } from "@/lib/stores/profile-store"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

interface TeamViewProps {
  teamId: string
}

export function TeamView({ teamId }: TeamViewProps) {
  const router = useRouter()
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Find the team inside the active profile
  const team = activeProfile.teams.find((t) => t.id.toString() === teamId)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches")
      if (res.ok) {
        const data = await res.json()
        // Here we'd ideally filter by teamId on the backend, 
        // but for now we'll just show the latest matches 
        setMatches(data.matches || [])
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  if (!team) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4">
        <p className="text-[#64748B] mb-4">Equipo no encontrado</p>
        <button onClick={() => router.push("/dashboard")} className="text-[#1E6FD9] font-medium">
          Volver al Inicio
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
            <p style={{ ...barlow, fontSize: "11px", letterSpacing: "1.5px", opacity: 0.55 }}>
              {activeProfile.clubName}
            </p>
            <h1 style={{ ...barlow, fontSize: "22px", fontWeight: 700, lineHeight: 1.2 }}>
              {team.name}
            </h1>
          </div>
          <div className="size-3 rounded-full flex-shrink-0" style={{ background: activeProfile.color }} />
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl py-3 px-2 text-center">
            <div style={{ ...barlow, fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>{team.players}</div>
            <div style={{ ...barlow, fontSize: "10px", letterSpacing: "0.5px", opacity: 0.6, mt: "2px" }}>JUGADORES</div>
          </div>
          <div className="bg-white/10 rounded-xl py-3 px-2 text-center">
            <div style={{ ...barlow, fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>{team.matches}</div>
            <div style={{ ...barlow, fontSize: "10px", letterSpacing: "0.5px", opacity: 0.6, mt: "2px" }}>PARTIDOS</div>
          </div>
          <div className="bg-white/10 rounded-xl py-3 px-2 text-center">
            <div style={{ ...barlow, fontSize: "20px", fontWeight: 700, lineHeight: 1, color: activeProfile.color }}>{team.record}</div>
            <div style={{ ...barlow, fontSize: "10px", letterSpacing: "0.5px", opacity: 0.6, mt: "2px" }}>RÉCORD</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#0D1F33", letterSpacing: "0.5px" }}>
            HISTORIAL DE PARTIDOS
          </h2>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            {matches.length} {matches.length === 1 ? "partido" : "partidos"}
          </span>
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="text-center py-10 text-[#64748B]">Cargando...</div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 bg-[#E2E8F0] rounded-full flex items-center justify-center mb-4">
              <Trophy className="size-7 text-[#94A3B8]" />
            </div>
            <p style={{ ...barlow, fontSize: "18px", fontWeight: 600, color: "#0D1F33" }}>Sin partidos</p>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
              Comenzá a registrar partidos para este equipo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isWin = match.result === "WIN"
              const isLoss = match.result === "LOSS"
              return (
                <Card key={match.id} className="bg-white p-3 shadow-sm border-[#E2E8F0] flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: isWin ? "#16A34A15" : isLoss ? "#EF444415" : "#E2E8F0" }}
                  >
                    <span style={{ ...barlow, fontSize: "18px", fontWeight: 700, color: isWin ? "#16A34A" : isLoss ? "#EF4444" : "#64748B", lineHeight: 1 }}>
                      {isWin ? "V" : isLoss ? "D" : "E"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#0D1F33" }} className="truncate">
                        vs {match.opponent?.name || match.opponent}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(new Date(match.date), "d MMM yyyy", { locale: es })}
                      </span>
                      {match.tournament && (
                        <span className="truncate max-w-[100px]">{match.tournament?.name || match.tournament}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span style={{ ...barlow, fontSize: "20px", fontWeight: 700, color: "#0D1F33" }}>
                      {match.finalScore || "0-0"}
                    </span>
                    <ChevronRight className="size-4 text-[#CBD5E1]" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB - Create Match */}
      <button
        onClick={() => router.push(`/match?teamId=${team.id}`)}
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg z-40 flex items-center justify-center text-white"
        style={{ background: activeProfile.color }}
      >
        <Plus className="size-6" />
      </button>
    </div>
  )
}
