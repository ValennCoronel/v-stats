"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Play,
  CheckCheck,
  Shield,
  Loader2,
  ArrowLeft,
  Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"
import { POSITION_LABELS, type Position } from "@/lib/types/volleyball"

interface PlayerData {
  id: string
  name: string
  number: number
  position: string
  avatarUrl: string | null
  isActive: boolean
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
  opponent,
  opponentId,
  tournament,
  tournamentId,
  matchDate,
  onBack,
}: MatchSetupProps) {
  const router = useRouter()
  const startMatch = useMatchStore((s) => s.startMatch)

  // Players from API
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [liberoIds, setLiberoIds] = useState<Set<string>>(new Set())

  // Set configuration
  const [pointsPerSet, setPointsPerSet] = useState(25)
  const [pointsLastSet, setPointsLastSet] = useState(15)
  const [minDifference, setMinDifference] = useState(2)

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players")
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.players.filter((p: PlayerData) => p.isActive))
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Handlers
  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // Also remove from liberos if deselected
        setLiberoIds((lib) => {
          const l = new Set(lib)
          l.delete(id)
          return l
        })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleLibero = (id: string) => {
    setLiberoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= 2) return prev // max 2 liberos
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(players.map((p) => p.id)))
  }

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const selectedCount = selectedIds.size
  const canStart = selectedCount >= 6

  const handleStartMatch = () => {
    if (!canStart) return

    const selected = players.filter((p) => selectedIds.has(p.id))
    const liberoPlayers = selected.filter((p) => liberoIds.has(p.id))
    const nonLiberoPlayers = selected.filter((p) => !liberoIds.has(p.id))

    // First 6 non-libero go to court, rest to bench
    const court: MatchPlayer[] = nonLiberoPlayers.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      avatarUrl: p.avatarUrl,
    }))

    const bench: MatchPlayer[] = nonLiberoPlayers.slice(6).map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      avatarUrl: p.avatarUrl,
    }))

    const liberos: MatchPlayer[] = liberoPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      isLibero: true,
      avatarUrl: p.avatarUrl,
    }))

    const allPlayers: MatchPlayer[] = [...court, ...bench, ...liberos]

    const matchId = `match-${Date.now()}`

    startMatch({
      matchId,
      opponent,
      opponentId,
      tournament,
      tournamentId,
      matchDate,
      pointsPerSet,
      pointsLastSet,
      minDifference,
      courtPlayers: court,
      benchPlayers: bench,
      liberos,
      allPlayers,
    })

    router.push(`/match/${matchId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold text-foreground">
                Selección de Jugadores
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                vs {opponent} — Seleccioná al menos 6 jugadores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set Configuration */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Configuración del Partido</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Puntos por Set</Label>
                <Input
                  type="number"
                  min={1}
                  value={pointsPerSet}
                  onChange={(e) => setPointsPerSet(parseInt(e.target.value) || 25)}
                  className="bg-input border-border h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Puntos 5to Set</Label>
                <Input
                  type="number"
                  min={1}
                  value={pointsLastSet}
                  onChange={(e) => setPointsLastSet(parseInt(e.target.value) || 15)}
                  className="bg-input border-border h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Diferencia Mín.</Label>
                <Input
                  type="number"
                  min={0}
                  value={minDifference}
                  onChange={(e) => setMinDifference(parseInt(e.target.value) || 2)}
                  className="bg-input border-border h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Player selection header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Plantel ({selectedCount} seleccionados)
              </span>
              {selectedCount < 6 && (
                <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                  Mínimo 6
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={selectAll}>
              <CheckCheck className="h-3.5 w-3.5" />
              Seleccionar todos
            </Button>
          </div>

          {/* Players list */}
          <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
            {players.map((player) => {
              const isSelected = selectedIds.has(player.id)
              const isLibero = liberoIds.has(player.id)

              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-3 transition-colors border",
                    isSelected
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-transparent hover:bg-muted/50"
                  )}
                >
                  {/* Left: checkbox + player info */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`player-${player.id}`}
                      checked={isSelected}
                      onCheckedChange={() => togglePlayer(player.id)}
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={player.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {player.name}
                        </span>
                        <Badge variant="outline" className="font-mono text-xs">
                          #{player.number}
                        </Badge>
                        {isLibero && (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            Líbero
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {POSITION_LABELS[player.position as Position] || player.position}
                      </span>
                    </div>
                  </div>

                  {/* Right: libero toggle */}
                  {isSelected && (
                    <Button
                      variant={isLibero ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "gap-1 text-xs h-7",
                        isLibero
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "text-muted-foreground"
                      )}
                      onClick={() => toggleLibero(player.id)}
                      disabled={!isLibero && liberoIds.size >= 2}
                    >
                      <Shield className="h-3 w-3" />
                      Líbero
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {selectedCount - liberoIds.size} en cancha/cambios · {liberoIds.size} líbero(s)
            </span>
            <span>
              Sets a {pointsPerSet} pts (5to a {pointsLastSet}), dif. {minDifference}
            </span>
          </div>

          {/* Start button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-3"
            onClick={handleStartMatch}
            disabled={!canStart}
          >
            <Play className="h-6 w-6" />
            Iniciar Partido ({selectedCount} jugadores)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
