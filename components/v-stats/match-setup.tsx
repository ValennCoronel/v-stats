"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import {
  Users, Play, CheckCheck, Shield, Loader2, ArrowLeft, Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"
import { POSITION_LABELS, type Position } from "@/lib/types/volleyball"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

interface PlayerData {
  id: string
  name: string
  number: number
  position: string
  avatarUrl: string | null
  isActive: boolean
  team?: { name: string }
}

interface MatchSetupProps {
  opponent: string
  opponentId: string | null
  tournament: string
  tournamentId: string | null
  matchDate: string
  onBack: () => void
}

export function MatchSetup({
  opponent, opponentId, tournament, tournamentId, matchDate, onBack,
}: MatchSetupProps) {
  const router = useRouter()
  const startMatch = useMatchStore((s) => s.startMatch)
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)

  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [liberoIds, setLiberoIds] = useState<Set<string>>(new Set())
  const [pointsPerSet, setPointsPerSet] = useState(25)
  const [pointsLastSet, setPointsLastSet] = useState(15)
  const [minDifference, setMinDifference] = useState(2)

  const fetchPlayers = useCallback(async () => {
    if (!activeProfile) return
    try {
      const res = await fetch(`/api/players?clubId=${activeProfile.id}`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.players.filter((p: PlayerData) => p.isActive))
      }
    } catch { /* */ }
    finally { setIsLoading(false) }
  }, [activeProfile])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setLiberoIds((lib) => { const l = new Set(lib); l.delete(id); return l })
      } else { next.add(id) }
      return next
    })
  }

  const toggleLibero = (id: string) => {
    setLiberoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else { if (next.size >= 2) return prev; next.add(id) }
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(players.map((p) => p.id)))

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const selectedCount = selectedIds.size
  const canStart = selectedCount >= 6

  const handleStartMatch = () => {
    if (!canStart) return
    const selected = players.filter((p) => selectedIds.has(p.id))
    const liberoPlayers = selected.filter((p) => liberoIds.has(p.id))
    const nonLiberoPlayers = selected.filter((p) => !liberoIds.has(p.id))

    const court: MatchPlayer[] = nonLiberoPlayers.slice(0, 6).map((p) => ({ id: p.id, name: p.name, number: p.number, position: p.position, avatarUrl: p.avatarUrl }))
    const bench: MatchPlayer[] = nonLiberoPlayers.slice(6).map((p) => ({ id: p.id, name: p.name, number: p.number, position: p.position, avatarUrl: p.avatarUrl }))
    const liberos: MatchPlayer[] = liberoPlayers.map((p) => ({ id: p.id, name: p.name, number: p.number, position: p.position, isLibero: true, avatarUrl: p.avatarUrl }))
    const allPlayers: MatchPlayer[] = [...court, ...bench, ...liberos]
    const matchId = `match-${Date.now()}`

    startMatch({ matchId, opponent, opponentId, tournament, tournamentId, matchDate, pointsPerSet, pointsLastSet, minDifference, courtPlayers: court, benchPlayers: bench, liberos, allPlayers })
    router.push(`/match/${matchId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E6FD9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="size-4 text-white" />
          </button>
          <div className="flex-1">
            <p style={{ ...barlow, fontSize: "11px", letterSpacing: "1.5px", opacity: 0.55 }}>NUEVO PARTIDO</p>
            <h1 style={{ ...barlow, fontSize: "20px", fontWeight: 700, lineHeight: 1.2 }}>vs {opponent}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-32 space-y-5">
        {/* Match Config */}
        <Card className="bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-[#64748B]" />
            <span style={{ ...barlow, fontSize: "12px", letterSpacing: "1.5px", color: "#64748B" }}>CONFIGURACIÓN</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#64748B]">Pts por Set</Label>
              <Input type="number" min={1} value={pointsPerSet} onChange={(e) => setPointsPerSet(parseInt(e.target.value) || 25)} className="bg-white border-[#E2E8F0] h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#64748B]">Pts 5to Set</Label>
              <Input type="number" min={1} value={pointsLastSet} onChange={(e) => setPointsLastSet(parseInt(e.target.value) || 15)} className="bg-white border-[#E2E8F0] h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#64748B]">Dif. Mín.</Label>
              <Input type="number" min={0} value={minDifference} onChange={(e) => setMinDifference(parseInt(e.target.value) || 2)} className="bg-white border-[#E2E8F0] h-9 text-sm" />
            </div>
          </div>
        </Card>

        {/* Player selection header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#64748B]" />
            <span style={{ ...barlow, fontSize: "12px", letterSpacing: "1.5px", color: "#64748B" }}>
              PLANTEL ({selectedCount} SELECCIONADOS)
            </span>
            {selectedCount < 6 && (
              <Badge className="bg-red-100 text-red-600 border-0 text-[10px]">Mínimo 6</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-[#E2E8F0]" onClick={selectAll}>
            <CheckCheck className="h-3.5 w-3.5" />
            Todos
          </Button>
        </div>

        {/* Players list */}
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {players.map((player) => {
            const isSelected = selectedIds.has(player.id)
            const isLibero = liberoIds.has(player.id)
            return (
              <Card
                key={player.id}
                className={cn(
                  "bg-white shadow-sm overflow-hidden transition-all",
                  isSelected && "ring-2 ring-[#1E6FD9]/30"
                )}
              >
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Checkbox id={`player-${player.id}`} checked={isSelected} onCheckedChange={() => togglePlayer(player.id)} />
                    <Avatar className="size-9">
                      <AvatarImage src={player.avatarUrl || ""} />
                      <AvatarFallback className="bg-[#1E6FD9]/10 text-[#1E6FD9] text-xs" style={barlow}>{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#0D1F33]">{player.name}</span>
                        <span className="font-mono text-xs text-[#64748B]">#{player.number}</span>
                        {isLibero && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-0.5">
                            <Shield className="size-2.5" /> Líbero
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#94A3B8]">
                          {POSITION_LABELS[player.position as Position] || player.position}
                        </span>
                        {player.team && (
                          <span className="text-[10px] text-[#64748B] bg-[#F4F7FB] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                            {player.team.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Button
                      variant={isLibero ? "default" : "outline"}
                      size="sm"
                      className={cn("gap-1 text-xs h-7", isLibero ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-[#64748B] border-[#E2E8F0]")}
                      onClick={() => toggleLibero(player.id)}
                      disabled={!isLibero && liberoIds.size >= 2}
                    >
                      <Shield className="h-3 w-3" /> Líbero
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-[#64748B] px-1">
          <span>{selectedCount - liberoIds.size} en cancha/cambios · {liberoIds.size} líbero(s)</span>
          <span>Sets a {pointsPerSet} pts</span>
        </div>

        {/* Start button */}
        <Button
          className="w-full h-14 text-lg bg-[#1E6FD9] hover:bg-[#1557B0] text-white gap-3"
          style={{ ...barlow, letterSpacing: "1px" }}
          onClick={handleStartMatch}
          disabled={!canStart}
        >
          <Play className="h-6 w-6" />
          INICIAR PARTIDO ({selectedCount})
        </Button>
      </div>
    </div>
  )
}
