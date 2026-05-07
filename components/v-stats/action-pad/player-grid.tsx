"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"

interface PlayerGridProps {
  players: MatchPlayer[]
}

export const PlayerGrid = React.memo(function PlayerGrid({ players }: PlayerGridProps) {
  const selectedPlayerId = useMatchStore((s) => s.selectedPlayerId)
  const selectPlayer = useMatchStore((s) => s.selectPlayer)

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {players.map((player) => {
        const isSelected = selectedPlayerId === player.id
        return (
          <button
            key={player.id}
            onClick={() => selectPlayer(isSelected ? null : player.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl p-3 sm:p-4 transition-all duration-150 active:scale-95",
              "border-2 min-h-[72px] sm:min-h-[88px]",
              isSelected
                ? "border-[#0a67ec] bg-[#0a67ec]/15 shadow-lg shadow-[#0a67ec]/20"
                : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "text-xl sm:text-2xl font-bold font-mono leading-none",
                isSelected ? "text-[#0a67ec]" : "text-foreground"
              )}
            >
              {player.number}
            </span>
            <span
              className={cn(
                "text-[10px] sm:text-xs mt-1 font-medium truncate w-full text-center leading-tight",
                isSelected ? "text-[#0a67ec]" : "text-muted-foreground"
              )}
            >
              {player.name.split(" ")[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
})
