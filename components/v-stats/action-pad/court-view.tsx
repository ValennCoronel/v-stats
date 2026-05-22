"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }
const POSITION_LABELS_MAP = ["Pos 1", "Pos 2", "Pos 3", "Pos 4", "Pos 5", "Pos 6"]
const FRONT_ROW_INDICES = [3, 2, 1] // UI visual representation: front row (4, 3, 2 in volleyball terms) -> indices 3, 2, 1
const BACK_ROW_INDICES = [4, 5, 0]  // UI visual representation: back row (5, 6, 1 in volleyball terms) -> indices 4, 5, 0

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
          "flex flex-col items-center justify-center rounded-xl p-2 transition-all duration-150 h-[80px]",
          "border-2 cursor-pointer select-none relative overflow-hidden",
          isDragging && "opacity-40 scale-95",
          isDragTarget && "ring-2 ring-[#1E6FD9] ring-offset-2",
          isSelected
            ? "border-[#1E6FD9] bg-[#1E6FD9]/10"
            : isSubMode
              ? canLiberoSub || substitutionMode === "bench"
                ? "border-[#F59E0B] bg-[#F59E0B]/10 animate-pulse"
                : "border-[#E2E8F0] bg-white opacity-50"
              : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
        )}
      >
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E6FD9]" />
        )}
        <span
          className={cn(
            "text-[24px] font-bold leading-none mt-1",
            isSelected ? "text-[#1E6FD9]" : "text-[#0D1F33]"
          )}
          style={barlow}
        >
          {player.number}
        </span>
        <span className="text-[12px] font-medium text-[#64748B] mt-1 truncate w-full text-center px-1">
          {player.name.split(" ")[0]}
        </span>
        {player.isLibero && (
          <div className="absolute bottom-1 right-1 size-3 bg-[#F59E0B] rounded-full" />
        )}
      </button>
    )
  }

  return (
    <div className="bg-[#F4F7FB] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span style={{ ...barlow, fontSize: "14px", letterSpacing: "1px", color: "#64748B" }}>
          CANCHA
        </span>
        <span style={{ fontSize: "11px", color: "#94A3B8" }}>Red arriba</span>
      </div>

      <div className="space-y-3">
        {/* Front row */}
        <div className="grid grid-cols-3 gap-3">
          {FRONT_ROW_INDICES.map(renderPlayer)}
        </div>
        {/* Separator line */}
        <div className="border-t-2 border-dashed border-[#CBD5E1]" />
        {/* Back row */}
        <div className="grid grid-cols-3 gap-3">
          {BACK_ROW_INDICES.map(renderPlayer)}
        </div>
      </div>
    </div>
  )
})
