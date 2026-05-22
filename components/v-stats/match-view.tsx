"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Play, Trophy, AlertTriangle, Users, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { EntityComboBox } from "./entity-combobox"
import { EntityFormDialog, type EntityData } from "./entity-form-dialog"
import { EntityDeleteDialog } from "./entity-delete-dialog"
import { MatchSetup } from "./match-setup"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

export function MatchView() {
  const [date, setDate] = useState<Date>(new Date())
  const router = useRouter()

  const [step, setStep] = useState<"config" | "setup">("config")
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  const [opponents, setOpponents] = useState<EntityData[]>([])
  const [recentOpponents, setRecentOpponents] = useState<EntityData[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<EntityData | null>(null)
  const [opponentSearch, setOpponentSearch] = useState("")

  const [tournaments, setTournaments] = useState<EntityData[]>([])
  const [recentTournaments, setRecentTournaments] = useState<EntityData[]>([])
  const [selectedTournament, setSelectedTournament] = useState<EntityData | null>(null)
  const [tournamentSearch, setTournamentSearch] = useState("")

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formDialogEntity, setFormDialogEntity] = useState<EntityData | null>(null)
  const [formDialogType, setFormDialogType] = useState<"opponent" | "tournament">("opponent")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDialogEntity, setDeleteDialogEntity] = useState<EntityData | null>(null)
  const [deleteDialogType, setDeleteDialogType] = useState<"opponent" | "tournament">("opponent")

  const fetchOpponents = useCallback(async () => {
    try {
      const res = await fetch("/api/opponent-teams")
      if (res.ok) {
        const data = await res.json()
        setOpponents(data.teams)
        const recent = data.teams.filter((t: EntityData) => t.lastUsedAt).slice(0, 3)
        setRecentOpponents(recent)
      }
    } catch { /* */ }
  }, [])

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments")
      if (res.ok) {
        const data = await res.json()
        setTournaments(data.tournaments)
        const recent = data.tournaments.filter((t: EntityData) => t.lastUsedAt).slice(0, 3)
        setRecentTournaments(recent)
        if (!selectedTournament && recent.length > 0) {
          setSelectedTournament(recent[0])
        }
      }
    } catch { /* */ }
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

  const handleCreateOpponent = () => { setFormDialogEntity(null); setFormDialogType("opponent"); setFormDialogOpen(true) }
  const handleEditOpponent = (entity: EntityData) => { setFormDialogEntity(entity); setFormDialogType("opponent"); setFormDialogOpen(true) }
  const handleDeleteOpponent = (entity: EntityData) => { setDeleteDialogEntity(entity); setDeleteDialogType("opponent"); setDeleteDialogOpen(true) }
  const handleCreateTournament = () => { setFormDialogEntity(null); setFormDialogType("tournament"); setFormDialogOpen(true) }
  const handleEditTournament = (entity: EntityData) => { setFormDialogEntity(entity); setFormDialogType("tournament"); setFormDialogOpen(true) }
  const handleDeleteTournament = (entity: EntityData) => { setDeleteDialogEntity(entity); setDeleteDialogType("tournament"); setDeleteDialogOpen(true) }

  const handleFormSaved = (savedEntity: EntityData) => {
    if (formDialogType === "opponent") {
      fetchOpponents()
      if (!formDialogEntity) setSelectedOpponent(savedEntity)
      else if (selectedOpponent?.id === savedEntity.id) setSelectedOpponent(savedEntity)
    } else {
      fetchTournaments()
      if (!formDialogEntity) setSelectedTournament(savedEntity)
      else if (selectedTournament?.id === savedEntity.id) setSelectedTournament(savedEntity)
    }
  }

  const handleEntityDeleted = () => {
    if (deleteDialogType === "opponent") {
      fetchOpponents()
      if (selectedOpponent?.id === deleteDialogEntity?.id) setSelectedOpponent(null)
    } else {
      fetchTournaments()
      if (selectedTournament?.id === deleteDialogEntity?.id) setSelectedTournament(null)
    }
  }

  const handleContinueToSetup = () => {
    if (!selectedOpponent || !playerCount || playerCount < 6) return
    setStep("setup")
  }

  const hasEnoughPlayers = playerCount !== null && playerCount >= 6

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

  return (
    <>
      <div className="min-h-screen bg-[#F4F7FB]">
        {/* Header */}
        <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft className="size-4 text-white" />
            </button>
            <div className="flex-1">
              <p style={{ ...barlow, fontSize: "11px", letterSpacing: "1.5px", opacity: 0.55 }}>V-STATS</p>
              <h1 style={{ ...barlow, fontSize: "22px", fontWeight: 700, lineHeight: 1.2 }}>Nuevo Partido</h1>
            </div>
            <div className="size-12 bg-white/10 rounded-full flex items-center justify-center">
              <Trophy className="size-6 text-[#3D8EF5]" />
            </div>
          </div>
        </div>

        <div className="px-4 py-5 pb-32 space-y-5">
          {/* Not enough players warning */}
          {playerCount !== null && !hasEnoughPlayers && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600">Necesitás al menos 6 jugadores</p>
                <p className="text-xs text-[#64748B]">
                  Actualmente tenés {playerCount} jugador(es) activo(s).
                </p>
              </div>
            </div>
          )}

          {/* Form sections */}
          <div className="space-y-4">
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
              <Label className="text-[#0D1F33]" style={{ ...barlow, fontSize: "14px", letterSpacing: "0.5px" }}>
                Fecha del Partido
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-[#E2E8F0] h-12",
                      !date && "text-[#94A3B8]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#64748B]" />
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

          {/* CTA */}
          <Button
            className="w-full h-14 text-lg bg-[#1E6FD9] hover:bg-[#1557B0] text-white gap-3"
            style={{ ...barlow, letterSpacing: "1px" }}
            onClick={handleContinueToSetup}
            disabled={!selectedOpponent || !hasEnoughPlayers}
          >
            <Play className="h-6 w-6" />
            CONTINUAR
          </Button>

          <p className="text-center text-sm text-[#64748B]">
            En el siguiente paso seleccionarás los jugadores del partido
          </p>
        </div>
      </div>

      <EntityFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        entity={formDialogEntity}
        entityType={formDialogType}
        onSaved={handleFormSaved}
        apiBasePath={formDialogType === "opponent" ? "/api/opponent-teams" : "/api/tournaments"}
      />
      <EntityDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entity={deleteDialogEntity}
        entityType={deleteDialogType}
        apiBasePath={deleteDialogType === "opponent" ? "/api/opponent-teams" : "/api/tournaments"}
        onDeleted={handleEntityDeleted}
      />
    </>
  )
}
