"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Play, Trophy, AlertTriangle, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { EntityComboBox } from "./entity-combobox"
import { EntityFormDialog, type EntityData } from "./entity-form-dialog"
import { EntityDeleteDialog } from "./entity-delete-dialog"
import { MatchSetup } from "./match-setup"

export function MatchView() {
  const [date, setDate] = useState<Date>(new Date())
  const router = useRouter()

  // ─── Flow state ──────────────────────────────────────────────
  const [step, setStep] = useState<"config" | "setup">("config")
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  // ─── Opponent Teams state ────────────────────────────────────
  const [opponents, setOpponents] = useState<EntityData[]>([])
  const [recentOpponents, setRecentOpponents] = useState<EntityData[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<EntityData | null>(null)
  const [opponentSearch, setOpponentSearch] = useState("")

  // ─── Tournaments state ───────────────────────────────────────
  const [tournaments, setTournaments] = useState<EntityData[]>([])
  const [recentTournaments, setRecentTournaments] = useState<EntityData[]>([])
  const [selectedTournament, setSelectedTournament] = useState<EntityData | null>(null)
  const [tournamentSearch, setTournamentSearch] = useState("")

  // ─── Dialogs state ──────────────────────────────────────────
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formDialogEntity, setFormDialogEntity] = useState<EntityData | null>(null)
  const [formDialogType, setFormDialogType] = useState<"opponent" | "tournament">("opponent")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDialogEntity, setDeleteDialogEntity] = useState<EntityData | null>(null)
  const [deleteDialogType, setDeleteDialogType] = useState<"opponent" | "tournament">("opponent")

  // ─── Fetch functions ────────────────────────────────────────
  const fetchOpponents = useCallback(async () => {
    try {
      const res = await fetch("/api/opponent-teams")
      if (res.ok) {
        const data = await res.json()
        setOpponents(data.teams)
        const recent = data.teams
          .filter((t: EntityData) => t.lastUsedAt)
          .slice(0, 3)
        setRecentOpponents(recent)
      }
    } catch {
      // silently fail
    }
  }, [])

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments")
      if (res.ok) {
        const data = await res.json()
        setTournaments(data.tournaments)
        const recent = data.tournaments
          .filter((t: EntityData) => t.lastUsedAt)
          .slice(0, 3)
        setRecentTournaments(recent)

        if (!selectedTournament && recent.length > 0) {
          setSelectedTournament(recent[0])
        }
      }
    } catch {
      // silently fail
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPlayerCount = useCallback(async () => {
    try {
      const res = await fetch("/api/players")
      if (res.ok) {
        const data = await res.json()
        const active = data.players.filter((p: { isActive: boolean }) => p.isActive)
        setPlayerCount(active.length)
      }
    } catch {
      setPlayerCount(0)
    }
  }, [])

  useEffect(() => {
    fetchOpponents()
    fetchTournaments()
    fetchPlayerCount()
  }, [fetchOpponents, fetchTournaments, fetchPlayerCount])

  // ─── Handlers ───────────────────────────────────────────────
  const handleCreateOpponent = () => {
    setFormDialogEntity(null)
    setFormDialogType("opponent")
    setFormDialogOpen(true)
  }

  const handleEditOpponent = (entity: EntityData) => {
    setFormDialogEntity(entity)
    setFormDialogType("opponent")
    setFormDialogOpen(true)
  }

  const handleDeleteOpponent = (entity: EntityData) => {
    setDeleteDialogEntity(entity)
    setDeleteDialogType("opponent")
    setDeleteDialogOpen(true)
  }

  const handleCreateTournament = () => {
    setFormDialogEntity(null)
    setFormDialogType("tournament")
    setFormDialogOpen(true)
  }

  const handleEditTournament = (entity: EntityData) => {
    setFormDialogEntity(entity)
    setFormDialogType("tournament")
    setFormDialogOpen(true)
  }

  const handleDeleteTournament = (entity: EntityData) => {
    setDeleteDialogEntity(entity)
    setDeleteDialogType("tournament")
    setDeleteDialogOpen(true)
  }

  const handleFormSaved = (savedEntity: EntityData) => {
    if (formDialogType === "opponent") {
      fetchOpponents()
      if (!formDialogEntity) {
        setSelectedOpponent(savedEntity)
      } else if (selectedOpponent?.id === savedEntity.id) {
        setSelectedOpponent(savedEntity)
      }
    } else {
      fetchTournaments()
      if (!formDialogEntity) {
        setSelectedTournament(savedEntity)
      } else if (selectedTournament?.id === savedEntity.id) {
        setSelectedTournament(savedEntity)
      }
    }
  }

  const handleEntityDeleted = () => {
    if (deleteDialogType === "opponent") {
      fetchOpponents()
      if (selectedOpponent?.id === deleteDialogEntity?.id) {
        setSelectedOpponent(null)
      }
    } else {
      fetchTournaments()
      if (selectedTournament?.id === deleteDialogEntity?.id) {
        setSelectedTournament(null)
      }
    }
  }

  const handleContinueToSetup = () => {
    if (!selectedOpponent || !playerCount || playerCount < 6) return
    setStep("setup")
  }

  const hasEnoughPlayers = playerCount !== null && playerCount >= 6

  // ─── Step: Setup (roster selection) ─────────────────────────
  if (step === "setup" && selectedOpponent) {
    return (
      <MatchSetup
        opponent={selectedOpponent.name}
        opponentId={selectedOpponent.id}
        tournament={selectedTournament?.name || ""}
        tournamentId={selectedTournament?.id || null}
        matchDate={date.toISOString()}
        onBack={() => setStep("config")}
      />
    )
  }

  // ─── Step: Config (opponent, tournament, date) ──────────────
  return (
    <>
      <div className="flex min-h-full items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-xl bg-card border-border">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                Nuevo Partido
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Configurá los detalles del partido antes de comenzar
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Not enough players warning */}
            {playerCount !== null && !hasEnoughPlayers && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Necesitás al menos 6 jugadores
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Actualmente tenés {playerCount} jugador(es) activo(s). Agregá más desde la sección Team.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5 text-xs"
                    onClick={() => router.push("/team")}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Ir a Team
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Setup Form */}
            <div className="space-y-4">
              {/* Opponent Selector */}
              <EntityComboBox
                label="Equipo Rival"
                placeholder="Buscar equipo rival..."
                value={selectedOpponent}
                onChange={setSelectedOpponent}
                entities={opponents}
                recentEntities={recentOpponents}
                onSearch={setOpponentSearch}
                searchQuery={opponentSearch}
                onCreateNew={handleCreateOpponent}
                onEdit={handleEditOpponent}
                onDelete={handleDeleteOpponent}
                entityTypeLabel="equipo"
              />

              {/* Tournament Selector */}
              <EntityComboBox
                label="Torneo / Liga"
                placeholder="Buscar torneo o liga..."
                value={selectedTournament}
                onChange={setSelectedTournament}
                entities={tournaments}
                recentEntities={recentTournaments}
                onSearch={setTournamentSearch}
                searchQuery={tournamentSearch}
                onCreateNew={handleCreateTournament}
                onEdit={handleEditTournament}
                onDelete={handleDeleteTournament}
                entityTypeLabel="torneo"
              />

              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-foreground">Fecha del Partido</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input border-border",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Start Match CTA */}
            <Button
              size="lg"
              className="w-full h-14 text-lg bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-3"
              onClick={handleContinueToSetup}
              disabled={!selectedOpponent || !hasEnoughPlayers}
            >
              <Play className="h-6 w-6" />
              Continuar
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              En el siguiente paso seleccionarás los jugadores del partido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entity Create/Edit Dialog */}
      <EntityFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        entity={formDialogEntity}
        entityType={formDialogType}
        onSaved={handleFormSaved}
        apiBasePath={
          formDialogType === "opponent"
            ? "/api/opponent-teams"
            : "/api/tournaments"
        }
      />

      {/* Entity Delete Dialog */}
      <EntityDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entity={deleteDialogEntity}
        entityType={deleteDialogType}
        apiBasePath={
          deleteDialogType === "opponent"
            ? "/api/opponent-teams"
            : "/api/tournaments"
        }
        onDeleted={handleEntityDeleted}
      />
    </>
  )
}
