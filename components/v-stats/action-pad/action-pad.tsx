"use client"

import React, { useState } from "react"
import { useMatchStore } from "@/lib/stores/match-store"
import { CourtView } from "./court-view"
import { ActionButtons } from "./action-buttons"
import { Scoreboard } from "./scoreboard"
import { BenchPanel } from "./bench-panel"
import { VOLLEYBALL_ACTIONS } from "@/lib/types/volleyball"
import type { VolleyballActionKey } from "@/lib/types/volleyball"
import { ArrowLeft, Undo2, Users, Square, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

const ActionLog = React.memo(function ActionLog() {
  const actions = useMatchStore((s) => s.actions)
  const undoLastAction = useMatchStore((s) => s.undoLastAction)

  const last5 = actions.slice(-5).reverse()

  if (last5.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p className="text-sm text-[#94A3B8]">Sin acciones registradas</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span style={{ ...barlow, fontSize: "14px", letterSpacing: "1px", color: "#64748B" }}>
          ÚLTIMAS ACCIONES
        </span>
        {actions.length > 0 && (
          <button
            onClick={undoLastAction}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#1E6FD9] bg-[#1E6FD9]/10 px-3 py-1 rounded-full"
          >
            <Undo2 className="size-3.5" />
            <span style={{ ...barlow, letterSpacing: "0.5px" }}>DESHACER</span>
          </button>
        )}
      </div>
      <div className="space-y-2">
        {last5.map((action) => {
          const actionDef = VOLLEYBALL_ACTIONS[action.action as VolleyballActionKey]
          return (
            <div
              key={action.id}
              className="flex items-center justify-between rounded-xl bg-[#F4F7FB] px-3 py-2 border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#1E6FD9]" style={{ ...barlow, fontSize: "16px" }}>
                  #{action.playerNumber}
                </span>
                <span className="text-[14px] font-medium text-[#0D1F33]">
                  {action.playerName.split(" ")[0]}
                </span>
              </div>
              <span
                className={cn(
                  "font-bold px-2 py-0.5 rounded-md text-[12px]",
                  actionDef?.type === "positive" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#EF4444]/10 text-[#EF4444]"
                )}
              >
                {actionDef?.shortLabel || action.action}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export function ActionPad() {
  const status = useMatchStore((s) => s.status)
  const courtPlayers = useMatchStore((s) => s.courtPlayers)
  const opponent = useMatchStore((s) => s.opponent)
  const endMatch = useMatchStore((s) => s.endMatch)
  const resetMatch = useMatchStore((s) => s.resetMatch)
  const actions = useMatchStore((s) => s.actions)
  const sets = useMatchStore((s) => s.sets)
  const currentSet = useMatchStore((s) => s.currentSet)
  const router = useRouter()
  const [showBench, setShowBench] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // If no active match, show a message
  if (status === "idle" || status === "setup" || courtPlayers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-4">
        <div className="text-center space-y-4">
          <p className="text-lg text-[#64748B]">No hay un partido activo</p>
          <button
            onClick={() => router.push("/match")}
            className="bg-[#1E6FD9] hover:bg-[#1557B0] text-white px-6 py-3 rounded-xl"
            style={{ ...barlow, fontSize: "18px", letterSpacing: "1px" }}
          >
            INICIAR PARTIDO
          </button>
        </div>
      </div>
    )
  }

  if (status === "finished") {
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
      } catch (e) {
        console.error("Error saving match:", e)
      } finally {
        setIsSaving(false)
        resetMatch()
        router.push("/dashboard") // Go back to dashboard instead of /history
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="size-16 bg-[#1E6FD9]/10 text-[#1E6FD9] rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#0D1F33] mb-2" style={barlow}>Partido Finalizado</h2>
          <p className="text-[#64748B] mb-1">vs {opponent}</p>
          <div className="text-[20px] font-bold text-[#1E6FD9] mb-4">{result} ({setsUs}-{setsThem})</div>
          
          <div className="space-y-3">
            <button
              onClick={handleSaveAndExit}
              className="w-full bg-[#1E6FD9] hover:bg-[#1557B0] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{ ...barlow, fontSize: "16px", letterSpacing: "1px" }}
              disabled={isSaving}
            >
              {isSaving ? "GUARDANDO..." : "GUARDAR PARTIDO"}
            </button>
            <button
              onClick={() => { resetMatch(); router.push("/match") }}
              className="w-full bg-white border-2 border-[#E2E8F0] text-[#64748B] hover:text-[#0D1F33] py-3.5 rounded-xl font-bold"
              style={{ ...barlow, fontSize: "16px", letterSpacing: "1px" }}
            >
              DESCARTAR
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col pb-8">
      {/* Header */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/match")}
            className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <p style={{ ...barlow, fontSize: "11px", letterSpacing: "1.5px", opacity: 0.55 }}>V-STATS</p>
            <h1 style={{ ...barlow, fontSize: "20px", fontWeight: 700, lineHeight: 1.1 }} className="truncate max-w-[140px]">
              vs {opponent}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bench Button */}
          <button
            onClick={() => setShowBench(true)}
            className="size-10 rounded-full bg-[#1E6FD9] flex items-center justify-center relative"
          >
            <Users className="size-5 text-white" />
          </button>
          {/* End Match Button */}
          <button
            onClick={endMatch}
            className="h-10 px-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center gap-1.5 transition-colors"
          >
            <Square className="size-4 text-white" fill="currentColor" />
            <span style={{ ...barlow, fontSize: "14px", fontWeight: 700, color: "white", letterSpacing: "0.5px" }}>FIN</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Scoreboard */}
        <Scoreboard />

        {/* Court view */}
        <CourtView />

        {/* Action log */}
        <div className="mb-4">
          <ActionLog />
        </div>

        {/* Actions */}
        <ActionButtons />
      </div>

      {/* Bench Modal */}
      <Dialog open={showBench} onOpenChange={setShowBench}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl p-0 overflow-hidden bg-[#F4F7FB] border-0">
          <div className="bg-[#0D1F33] px-6 py-4 flex items-center justify-between">
            <DialogTitle style={{ ...barlow, fontSize: "20px", fontWeight: 700, color: "white" }}>
              Banca y Cambios
            </DialogTitle>
          </div>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <BenchPanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
