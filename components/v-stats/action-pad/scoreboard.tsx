"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore } from "@/lib/stores/match-store"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"

export const Scoreboard = React.memo(function Scoreboard() {
  const opponent = useMatchStore((s) => s.opponent)
  const sets = useMatchStore((s) => s.sets)
  const currentSet = useMatchStore((s) => s.currentSet)
  const pointsPerSet = useMatchStore((s) => s.pointsPerSet)
  const pointsLastSet = useMatchStore((s) => s.pointsLastSet)
  const addPointRival = useMatchStore((s) => s.addPointRival)
  const removePointUs = useMatchStore((s) => s.removePointUs)
  const removePointRival = useMatchStore((s) => s.removePointRival)

  const currentScore = sets[currentSet] || { us: 0, them: 0 }
  const targetPoints = currentSet >= 4 ? pointsLastSet : pointsPerSet

  // Count set wins
  const setsWon = { us: 0, them: 0 }
  sets.forEach((set, i) => {
    if (i < currentSet) {
      if (set.us > set.them) setsWon.us++
      else if (set.them > set.us) setsWon.them++
    }
  })

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      {/* Set indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Set {currentSet + 1}
          <span className="text-muted-foreground/50 ml-1.5 normal-case">
            (a {targetPoints} pts)
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {sets.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full",
                i === currentSet
                  ? "bg-[#0a67ec]"
                  : i < currentSet
                  ? sets[i].us > sets[i].them
                    ? "bg-success"
                    : "bg-destructive"
                  : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-between">
        {/* Our team — auto-incremented by PTO */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">
            Nosotros
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full opacity-60"
              onClick={removePointUs}
              disabled={currentScore.us === 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-3xl sm:text-4xl font-bold font-mono text-foreground tabular-nums min-w-[48px] text-center">
              {currentScore.us}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-success hover:text-success hover:bg-success/10"
              onClick={useMatchStore((s) => s.addPointUs)}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <span className="text-[10px] sm:text-xs text-primary font-semibold mt-0.5">
            Sets: {setsWon.us}
          </span>
        </div>

        {/* Separator */}
        <div className="text-2xl sm:text-3xl font-light text-muted-foreground/30 px-2">
          —
        </div>

        {/* Opponent — manual */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 truncate max-w-[100px]">
            {opponent || "Rival"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full opacity-60"
              onClick={removePointRival}
              disabled={currentScore.them === 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-3xl sm:text-4xl font-bold font-mono text-foreground tabular-nums min-w-[48px] text-center">
              {currentScore.them}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
              onClick={addPointRival}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <span className="text-[10px] sm:text-xs text-destructive font-semibold mt-0.5">
            Sets: {setsWon.them}
          </span>
        </div>
      </div>
    </div>
  )
})
