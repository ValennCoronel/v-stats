"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore } from "@/lib/stores/match-store"
import { Button } from "@/components/ui/button"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

export const Scoreboard = React.memo(function Scoreboard() {
  const opponent = useMatchStore((s) => s.opponent)
  const sets = useMatchStore((s) => s.sets)
  const currentSet = useMatchStore((s) => s.currentSet)
  const pointsPerSet = useMatchStore((s) => s.pointsPerSet)
  const pointsLastSet = useMatchStore((s) => s.pointsLastSet)
  const addPointUs = useMatchStore((s) => s.addPointUs)
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
    <div className="bg-white rounded-2xl p-4 shadow-sm relative mb-4">
      {/* Set indicator Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {sets.map((_, i) => (
          <div
            key={i}
            className={cn(
              "px-4 py-1.5 rounded-full whitespace-nowrap transition-colors",
              i === currentSet
                ? "bg-[#1E6FD9] text-white"
                : "bg-[#F4F7FB] text-[#64748B]"
            )}
            style={{ ...barlow, fontSize: "14px", fontWeight: 600, letterSpacing: "0.5px" }}
          >
            SET {i + 1}
          </div>
        ))}
        {/* Next set preview */}
        <div
          className="px-4 py-1.5 rounded-full bg-white border border-dashed border-[#CBD5E1] text-[#94A3B8] whitespace-nowrap"
          style={{ ...barlow, fontSize: "14px", fontWeight: 600, letterSpacing: "0.5px" }}
        >
          SET {sets.length + 1}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Us */}
        <div className="flex-1 flex flex-col items-center">
          <div style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#1E6FD9", marginBottom: "4px" }}>
            NOSOTROS
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={removePointUs}
              disabled={currentScore.us === 0}
              className="size-8 rounded-full bg-[#F4F7FB] text-[#64748B] flex items-center justify-center font-bold disabled:opacity-50"
            >
              -
            </button>
            <div
              className="text-[#0D1F33] min-w-[60px] text-center"
              style={{ ...barlow, fontSize: "54px", fontWeight: 700, lineHeight: 1 }}
            >
              {currentScore.us}
            </div>
            <button
              onClick={addPointUs}
              className="size-8 rounded-full bg-[#1E6FD9]/10 text-[#1E6FD9] flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
          <div className="mt-2 text-[#64748B]" style={{ fontSize: "12px", fontWeight: 500 }}>
            Sets: {setsWon.us}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="h-10 w-px bg-[#E2E8F0] mb-2" />
          <span className="text-[#94A3B8] text-[10px] font-bold">VS</span>
          <div className="h-10 w-px bg-[#E2E8F0] mt-2" />
        </div>

        {/* Rival */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="truncate max-w-[100px] text-center"
            style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#0D1F33", marginBottom: "4px" }}
          >
            {opponent || "RIVAL"}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={removePointRival}
              disabled={currentScore.them === 0}
              className="size-8 rounded-full bg-[#F4F7FB] text-[#64748B] flex items-center justify-center font-bold disabled:opacity-50"
            >
              -
            </button>
            <div
              className="text-[#0D1F33] min-w-[60px] text-center"
              style={{ ...barlow, fontSize: "54px", fontWeight: 700, lineHeight: 1 }}
            >
              {currentScore.them}
            </div>
            <button
              onClick={addPointRival}
              className="size-8 rounded-full bg-[#1E6FD9]/10 text-[#1E6FD9] flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
          <div className="mt-2 text-[#64748B]" style={{ fontSize: "12px", fontWeight: 500 }}>
            Sets: {setsWon.them}
          </div>
        </div>
      </div>
      
      {/* Target points info */}
      <div className="absolute top-4 right-4 text-[#94A3B8]" style={{ ...barlow, fontSize: "12px" }}>
        A {targetPoints} pts
      </div>
    </div>
  )
})
