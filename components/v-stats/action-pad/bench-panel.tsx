"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useMatchStore, type MatchPlayer } from "@/lib/stores/match-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowRightLeft, Shield, X } from "lucide-react"

export const BenchPanel = React.memo(function BenchPanel() {
  const benchPlayers = useMatchStore((s) => s.benchPlayers)
  const liberos = useMatchStore((s) => s.liberos)
  const substitutionMode = useMatchStore((s) => s.substitutionMode)
  const substitutionSourceId = useMatchStore((s) => s.substitutionSourceId)
  const startSubstitution = useMatchStore((s) => s.startSubstitution)
  const startLiberoSub = useMatchStore((s) => s.startLiberoSub)
  const cancelSubstitution = useMatchStore((s) => s.cancelSubstitution)

  return (
    <div className="space-y-4">
      {/* Cancel substitution banner */}
      {substitutionMode !== "none" && (
        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5">
          <span className="text-xs font-medium text-amber-600">
            Modo cambio activo
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs text-amber-600 hover:text-amber-700"
            onClick={cancelSubstitution}
          >
            <X className="h-3 w-3" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Bench (substitutes) */}
      <div className="space-y-1.5">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Cambios ({benchPlayers.length})
        </span>
        {benchPlayers.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-1 py-2">
            Sin suplentes
          </p>
        ) : (
          <div className="space-y-1">
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

      <Separator />

      {/* Liberos */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <Shield className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-500">
            Líberos ({liberos.length})
          </span>
        </div>
        {liberos.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-1 py-2">
            Sin líberos designados
          </p>
        ) : (
          <div className="space-y-1">
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
          <p className="text-[10px] text-muted-foreground/50 px-1">
            Solo reemplaza zagueros (fila de atrás)
          </p>
        )}
      </div>
    </div>
  )
})

// ─── Bench Player Item ────────────────────────────────────────

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
        "w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all text-left",
        isActive
          ? "bg-amber-500/20 border border-amber-500/40 ring-1 ring-amber-500/30"
          : disabled
            ? "bg-muted/20 opacity-40 cursor-not-allowed"
            : "bg-muted/30 hover:bg-muted/50 border border-transparent",
        isLibero && !isActive && !disabled && "hover:border-amber-500/30"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs px-1.5",
            isLibero && "border-amber-500/30 text-amber-600",
            isActive && "border-amber-500 text-amber-500"
          )}
        >
          #{player.number}
        </Badge>
        <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
          {player.name.split(" ")[0]}
        </span>
      </div>
      <ArrowRightLeft
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isActive ? "text-amber-500" : "text-muted-foreground/40"
        )}
      />
    </button>
  )
}
