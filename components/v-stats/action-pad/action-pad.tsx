"use client"

import React from "react"
import { useMatchStore } from "@/lib/stores/match-store"
import { CourtView } from "./court-view"
import { ActionButtons } from "./action-buttons"
import { Scoreboard } from "./scoreboard"
import { BenchPanel } from "./bench-panel"
import { Button } from "@/components/ui/button"
import { VOLLEYBALL_ACTIONS } from "@/lib/types/volleyball"
import type { VolleyballActionKey } from "@/lib/types/volleyball"
import { ArrowLeft, Undo2, Square, ScrollText } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

// Memoized action log to avoid re-rendering the pad
const ActionLog = React.memo(function ActionLog() {
  const actions = useMatchStore((s) => s.actions)
  const undoLastAction = useMatchStore((s) => s.undoLastAction)

  const last5 = actions.slice(-5).reverse()

  if (last5.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Seleccioná un jugador y registrá una acción
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Últimas acciones
        </span>
        {actions.length > 0 && (
          <button
            onClick={undoLastAction}
            className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Undo2 className="h-3 w-3" />
            Deshacer
          </button>
        )}
      </div>
      {last5.map((action) => {
        const actionDef = VOLLEYBALL_ACTIONS[action.action as VolleyballActionKey]
        return (
          <div
            key={action.id}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary">
                #{action.playerNumber}
              </span>
              <span className="text-muted-foreground">
                {action.playerName.split(" ")[0]}
              </span>
            </div>
            <span
              className={cn(
                "font-semibold text-xs",
                actionDef?.type === "positive" ? "text-success" : "text-destructive"
              )}
            >
              {actionDef?.shortLabel || action.action}
            </span>
          </div>
        )
      })}
    </div>
  )
})

export function ActionPad() {
  const status = useMatchStore((s) => s.status)
  const courtPlayers = useMatchStore((s) => s.courtPlayers)
  const opponent = useMatchStore((s) => s.opponent)
  const tournament = useMatchStore((s) => s.tournament)
  const endMatch = useMatchStore((s) => s.endMatch)
  const resetMatch = useMatchStore((s) => s.resetMatch)
  const actions = useMatchStore((s) => s.actions)
  const sets = useMatchStore((s) => s.sets)
  const currentSet = useMatchStore((s) => s.currentSet)
  const router = useRouter()
  const [showLog, setShowLog] = useState(false)
  const [showBench, setShowBench] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // If no active match, show a message
  if (status === "idle" || status === "setup" || courtPlayers.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            No hay un partido activo
          </p>
          <Button
            onClick={() => router.push("/match")}
            className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white"
          >
            Iniciar un Partido
          </Button>
        </div>
      </div>
    )
  }

  if (status === "finished") {
    // Calculate result
    let setsUs = 0, setsThem = 0
    sets.forEach((set, i) => {
      if (i <= currentSet) {
        if (set.us > set.them) setsUs++
        else if (set.them > set.us) setsThem++
      }
    })
    const result = setsUs > setsThem ? "Victoria" : setsUs < setsThem ? "Derrota" : "Empate"

    const handleSaveAndExit = async () => {
      setIsSaving(true)
      try {
        const state = useMatchStore.getState()

        // Save match to DB
        const matchRes = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opponentTeamId: state.opponentId,
            tournamentId: state.tournamentId,
            date: state.matchDate,
            result: setsUs > setsThem ? "WIN" : setsUs < setsThem ? "LOSS" : "DRAW",
            finalScore: `${setsUs}-${setsThem}`,
            setScores: state.sets.slice(0, currentSet + 1),
            actions: state.actions,
            allPlayers: state.allPlayers,
            opponent: state.opponent,
            tournament: state.tournament,
          }),
        })

        if (!matchRes.ok) {
          console.error("Failed to save match")
        }
      } catch (e) {
        console.error("Error saving match:", e)
      } finally {
        setIsSaving(false)
        resetMatch()
        router.push("/history")
      }
    }

    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Partido Finalizado</h2>
          <p className="text-muted-foreground">
            vs {opponent} — {result} ({setsUs}-{setsThem})
          </p>
          <p className="text-sm text-muted-foreground">
            {actions.length} acciones registradas
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                resetMatch()
                router.push("/match")
              }}
            >
              Descartar
            </Button>
            <Button
              onClick={handleSaveAndExit}
              className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-2"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar y Ver Historial"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => router.push("/match")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight">
              vs {opponent}
            </h1>
            {tournament && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {tournament}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Toggle bench on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 md:hidden"
            onClick={() => {
              setShowBench(!showBench)
              setShowLog(false)
            }}
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 md:hidden"
            onClick={() => {
              setShowLog(!showLog)
              setShowBench(false)
            }}
          >
            <ScrollText className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 sm:h-9 gap-1.5 text-xs sm:text-sm"
            onClick={endMatch}
          >
            <Square className="h-3 w-3 sm:h-4 sm:w-4" />
            Finalizar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Action area */}
          <div className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-auto">
            {/* Scoreboard */}
            <Scoreboard />

            {/* Court view */}
            <CourtView />

            {/* Actions */}
            <ActionButtons />

            {/* Mobile: bench or log toggle */}
            {showBench && (
              <div className="md:hidden">
                <BenchPanel />
              </div>
            )}
            {showLog && (
              <div className="md:hidden">
                <ActionLog />
              </div>
            )}
          </div>

          {/* Right: Bench + Log (desktop) */}
          <div className="hidden md:flex md:flex-col w-72 lg:w-80 border-l border-border overflow-auto bg-card/30">
            <div className="p-4 flex-1 overflow-auto">
              <BenchPanel />
            </div>
            <div className="border-t border-border p-4">
              <ActionLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
