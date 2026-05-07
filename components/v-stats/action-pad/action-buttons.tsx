"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore } from "@/lib/stores/match-store"
import {
  VOLLEYBALL_ACTIONS,
  POSITIVE_ACTIONS,
  NEGATIVE_ACTIONS,
  type VolleyballActionKey,
} from "@/lib/types/volleyball"

export const ActionButtons = React.memo(function ActionButtons() {
  const selectedPlayerId = useMatchStore((s) => s.selectedPlayerId)
  const recordAction = useMatchStore((s) => s.recordAction)
  const substitutionMode = useMatchStore((s) => s.substitutionMode)

  const handleAction = (action: VolleyballActionKey) => {
    if (!selectedPlayerId) return
    recordAction(action)
  }

  // Disable actions when in substitution mode or no player selected
  const isDisabled = !selectedPlayerId || substitutionMode !== "none"

  return (
    <div className="space-y-3">
      {/* Positive actions */}
      <div className="space-y-1.5">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-success/80 px-1">
          Positivas
        </span>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {POSITIVE_ACTIONS.map((key) => {
            const action = VOLLEYBALL_ACTIONS[key]
            const isPunto = key === "punto" || key === "ace"
            return (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={isDisabled}
                className={cn(
                  "rounded-lg px-2 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-100 active:scale-95",
                  "border min-h-[44px]",
                  isDisabled
                    ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                    : isPunto
                      ? "border-success/50 bg-success/20 text-success hover:bg-success/30 active:bg-success/40 ring-1 ring-success/20"
                      : "border-success/30 bg-success/10 text-success hover:bg-success/20 active:bg-success/30"
                )}
              >
                {action.shortLabel}
                {isPunto && !isDisabled && (
                  <span className="block text-[9px] opacity-60 mt-0.5">+1 punto</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Negative actions */}
      <div className="space-y-1.5">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-destructive/80 px-1">
          Errores
        </span>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {NEGATIVE_ACTIONS.map((key) => {
            const action = VOLLEYBALL_ACTIONS[key]
            return (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={isDisabled}
                className={cn(
                  "rounded-lg px-2 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-100 active:scale-95",
                  "border min-h-[44px]",
                  isDisabled
                    ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                    : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30"
                )}
              >
                {action.shortLabel}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
