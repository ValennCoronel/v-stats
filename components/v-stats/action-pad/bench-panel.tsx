"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"
import { Shield, ArrowRightLeft, X } from "lucide-react"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

export const BenchPanel = React.memo(function BenchPanel() {
  const benchPlayers = useMatchStore((s) => s.benchPlayers)
  const liberos = useMatchStore((s) => s.liberos)
  const substitutionMode = useMatchStore((s) => s.substitutionMode)
  const substitutionSourceId = useMatchStore((s) => s.substitutionSourceId)
  const startSubstitution = useMatchStore((s) => s.startSubstitution)
  const startLiberoSub = useMatchStore((s) => s.startLiberoSub)
  const cancelSubstitution = useMatchStore((s) => s.cancelSubstitution)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Active Substitution Mode Banner */}
      {substitutionMode !== "none" && (
        <div className="flex items-center justify-between rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 mb-4">
          <span className="text-sm font-medium text-[#D97706]">
            Modo cambio activo
          </span>
          <button
            onClick={cancelSubstitution}
            className="flex items-center gap-1 text-xs font-semibold text-[#D97706] bg-white px-2 py-1 rounded-lg border border-[#F59E0B]/30"
          >
            <X className="size-3" />
            CANCELAR
          </button>
        </div>
      )}

      {/* Changes (Bench) */}
      <div className="mb-4">
        <span style={{ ...barlow, fontSize: "14px", letterSpacing: "1px", color: "#64748B", display: "block", marginBottom: "8px" }}>
          CAMBIOS ({benchPlayers.length})
        </span>
        {benchPlayers.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Sin suplentes</p>
        ) : (
          <div className="space-y-2">
            {benchPlayers.map((player) => (
              <BenchPlayerItem
                key={player.id}
                player={player}
                isActive={substitutionSourceId === player.id && substitutionMode === "bench"}
                onActivate={() => startSubstitution(player.id)}
                disabled={substitutionMode === "libero"}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-[#E2E8F0] my-4" />

      {/* Liberos */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="size-4 text-[#F59E0B]" />
          <span style={{ ...barlow, fontSize: "14px", letterSpacing: "1px", color: "#F59E0B", display: "block" }}>
            LÍBEROS ({liberos.length})
          </span>
        </div>
        {liberos.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Sin líberos designados</p>
        ) : (
          <div className="space-y-2">
            {liberos.map((player) => (
              <BenchPlayerItem
                key={player.id}
                player={player}
                isActive={substitutionSourceId === player.id && substitutionMode === "libero"}
                onActivate={() => startLiberoSub(player.id)}
                disabled={substitutionMode === "bench"}
                isLibero
              />
            ))}
          </div>
        )}
        {liberos.length > 0 && (
          <p className="text-[11px] text-[#94A3B8] mt-2">Solo reemplaza zagueros (fila de atrás)</p>
        )}
      </div>
    </div>
  )
})

interface BenchPlayerItemProps {
  player: MatchPlayer
  isActive: boolean
  onActivate: () => void
  disabled: boolean
  isLibero?: boolean
}

function BenchPlayerItem({
  player,
  isActive,
  onActivate,
  disabled,
  isLibero = false,
}: BenchPlayerItemProps) {
  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left border-2",
        isActive
          ? "bg-[#F59E0B]/10 border-[#F59E0B]"
          : disabled
            ? "bg-[#F4F7FB] border-[#E2E8F0] opacity-50 cursor-not-allowed"
            : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]",
        isLibero && !isActive && !disabled && "hover:border-[#F59E0B]/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-7 rounded-md flex items-center justify-center font-bold text-sm",
            isLibero ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#F4F7FB] text-[#64748B]",
            isActive && "bg-[#F59E0B] text-white"
          )}
          style={barlow}
        >
          {player.number}
        </div>
        <span className="text-[15px] font-medium text-[#0D1F33] truncate max-w-[120px]">
          {player.name.split(" ")[0]}
        </span>
      </div>
      <ArrowRightLeft
        className={cn(
          "size-4 shrink-0",
          isActive ? "text-[#F59E0B]" : "text-[#94A3B8]"
        )}
      />
    </button>
  )
}
