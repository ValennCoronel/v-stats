"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"

// Volleyball court positions:
// Front row: Position 4 (left), Position 3 (center), Position 2 (right)
// Back row:  Position 5 (left), Position 6 (center), Position 1 (right)
// courtPlayers indices map: [0]=Pos1, [1]=Pos2, [2]=Pos3, [3]=Pos4, [4]=Pos5, [5]=Pos6

const POSITION_LABELS_MAP = ["Ataque 1", "Armador", "Ataque 2", "Defensor 1", "Defensor 2", "Defensor 3"]
const FRONT_ROW_INDICES = [0, 1, 2] // Pos1, Pos2, Pos3 (top row)
const BACK_ROW_INDICES = [3, 4, 5]  // Pos4, Pos5, Pos6 (bottom row)

export const CourtView = React.memo(function CourtView() {
  const courtPlayers = useMatchStore((s) => s.courtPlayers)
  const selectedPlayerId = useMatchStore((s) => s.selectedPlayerId)
  const selectPlayer = useMatchStore((s) => s.selectPlayer)
  const reorderCourtPlayers = useMatchStore((s) => s.reorderCourtPlayers)
  const substitutionMode = useMatchStore((s) => s.substitutionMode)
  const executeSubstitution = useMatchStore((s) => s.executeSubstitution)
  const executeLiberoSub = useMatchStore((s) => s.executeLiberoSub)

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (substitutionMode !== "none") return
    setDragFrom(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }, [substitutionMode])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOver(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      reorderCourtPlayers(fromIndex, toIndex)
    }
    setDragFrom(null)
    setDragOver(null)
  }, [reorderCourtPlayers])

  const handleDragEnd = useCallback(() => {
    setDragFrom(null)
    setDragOver(null)
  }, [])

  const handlePlayerClick = (player: MatchPlayer, index: number) => {
    if (substitutionMode === "bench") {
      executeSubstitution(player.id)
    } else if (substitutionMode === "libero") {
      // Libero can only replace back row (indices 3, 4, 5)
      if (index >= 3) {
        executeLiberoSub(player.id)
      }
    } else {
      selectPlayer(selectedPlayerId === player.id ? null : player.id)
    }
  }

  const renderPlayer = (index: number) => {
    const player = courtPlayers[index]
    if (!player) return null

    const isSelected = selectedPlayerId === player.id
    const isDragging = dragFrom === index
    const isDragTarget = dragOver === index
    const isBackRow = index >= 3
    const canLiberoSub = substitutionMode === "libero" && isBackRow
    const isSubMode = substitutionMode !== "none"

    return (
      <button
        key={player.id}
        type="button"
        draggable={substitutionMode === "none"}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => handlePlayerClick(player, index)}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl p-2 sm:p-3 transition-all duration-150",
          "border-2 min-h-[64px] sm:min-h-[80px] min-w-[72px] sm:min-w-[88px] cursor-pointer select-none",
          isDragging && "opacity-40 scale-95",
          isDragTarget && "ring-2 ring-primary ring-offset-2",
          isSelected
            ? "border-[#0a67ec] bg-[#0a67ec]/15 shadow-lg shadow-[#0a67ec]/20"
            : isSubMode
              ? canLiberoSub || substitutionMode === "bench"
                ? "border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20 animate-pulse"
                : "border-border bg-card/50 opacity-50"
              : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30",
          player.isLibero && "border-amber-500/50"
        )}
      >
        <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-medium mb-0.5">
          {POSITION_LABELS_MAP[index]}
        </span>
        <span
          className={cn(
            "text-lg sm:text-xl font-bold font-mono leading-none",
            isSelected ? "text-[#0a67ec]" : "text-foreground"
          )}
        >
          {player.number}
        </span>
        <span
          className={cn(
            "text-[9px] sm:text-xs mt-0.5 font-medium truncate max-w-[68px] text-center leading-tight",
            isSelected ? "text-[#0a67ec]" : "text-muted-foreground"
          )}
        >
          {player.name.split(" ")[0]}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Cancha
        {substitutionMode !== "none" && (
          <span className="ml-2 text-amber-500 normal-case">
            — Seleccioná un jugador para cambiar
          </span>
        )}
      </span>

      <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 sm:p-4 space-y-2">
        {/* Net indicator */}
        <div className="text-center">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Red ↑</span>
        </div>

        {/* Front row: P4, P3, P2 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {FRONT_ROW_INDICES.map(renderPlayer)}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-emerald-700/30" />

        {/* Back row: P5, P6, P1 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {BACK_ROW_INDICES.map(renderPlayer)}
        </div>
      </div>
    </div>
  )
})
