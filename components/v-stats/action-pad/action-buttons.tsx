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

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

export const ActionButtons = React.memo(function ActionButtons() {
  const selectedPlayerId = useMatchStore((s) => s.selectedPlayerId)
  const recordAction = useMatchStore((s) => s.recordAction)
  const substitutionMode = useMatchStore((s) => s.substitutionMode)

  const handleAction = (action: VolleyballActionKey) => {
    if (!selectedPlayerId) return
    recordAction(action)
  }

  const isDisabled = !selectedPlayerId || substitutionMode !== "none"

  return (
    <div className="space-y-4">
      {/* Positive actions */}
      <div>
        <span style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#16A34A", display: "block", marginBottom: "8px" }}>
          ACCIONES POSITIVAS
        </span>
        <div className="grid grid-cols-3 gap-2">
          {POSITIVE_ACTIONS.map((key) => {
            const action = VOLLEYBALL_ACTIONS[key]
            const isPunto = key === "punto" || key === "ace"
            return (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={isDisabled}
                className={cn(
                  "rounded-xl px-2 py-3 flex flex-col items-center justify-center transition-all duration-100 active:scale-95 border-2",
                  isDisabled
                    ? "border-[#E2E8F0] bg-[#F4F7FB] text-[#94A3B8] cursor-not-allowed"
                    : isPunto
                      ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20"
                      : "border-[#E2E8F0] bg-white text-[#0D1F33] hover:border-[#16A34A] hover:text-[#16A34A]"
                )}
              >
                <span style={{ ...barlow, fontSize: "16px", fontWeight: 600 }}>{action.shortLabel}</span>
                {isPunto && !isDisabled && (
                  <span style={{ fontSize: "10px", fontWeight: 500, color: "#16A34A", marginTop: "2px" }}>+1 PTO</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Negative actions */}
      <div>
        <span style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#EF4444", display: "block", marginBottom: "8px" }}>
          ERRORES
        </span>
        <div className="grid grid-cols-3 gap-2">
          {NEGATIVE_ACTIONS.map((key) => {
            const action = VOLLEYBALL_ACTIONS[key]
            return (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={isDisabled}
                className={cn(
                  "rounded-xl px-2 py-3 flex flex-col items-center justify-center transition-all duration-100 active:scale-95 border-2",
                  isDisabled
                    ? "border-[#E2E8F0] bg-[#F4F7FB] text-[#94A3B8] cursor-not-allowed"
                    : "border-[#E2E8F0] bg-white text-[#0D1F33] hover:border-[#EF4444] hover:text-[#EF4444]"
                )}
              >
                <span style={{ ...barlow, fontSize: "16px", fontWeight: 600 }}>{action.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
