"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  AlertTriangle,
  Calendar,
  Hash,
  MapPin,
  User,
} from "lucide-react"
import { POSITION_LABELS, type Position } from "@/lib/types/volleyball"
import type { PlayerData } from "./player-dialog"

interface PlayerDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: PlayerData | null
}

export function PlayerDetail({ open, onOpenChange, player }: PlayerDetailProps) {
  if (!player) return null

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const positionLabel =
    POSITION_LABELS[player.position as Position] || player.position

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">Detalle del Jugador</SheetTitle>
          <SheetDescription className="sr-only">
            Información detallada del jugador
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-4">
          {/* Profile header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
              <AvatarImage src={player.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">
                {player.name}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-base px-3 py-1"
                >
                  #{player.number}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-0">
                  {positionLabel}
                </Badge>
              </div>
            </div>
            <Badge
              variant={player.isActive ? "default" : "secondary"}
              className={
                player.isActive
                  ? "bg-emerald-500/15 text-emerald-500 border-0"
                  : "bg-muted text-muted-foreground border-0"
              }
            >
              <Activity className="h-3 w-3 mr-1" />
              {player.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Datos Personales
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label="Nombre"
                value={player.name}
              />
              <DetailRow
                icon={<Hash className="h-4 w-4" />}
                label="N° Camiseta"
                value={`#${player.number}`}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Posición"
                value={positionLabel}
              />
            </div>
          </div>

          <Separator />

          {/* Injury History */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Historial de Lesiones
            </h3>
            {player.injuryHistory ? (
              <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {player.injuryHistory}
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Sin historial de lesiones registrado
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Stats placeholder */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Estadísticas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Partidos" value="—" />
              <StatCard label="Puntos" value="—" />
              <StatCard label="Aces" value="—" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Las estadísticas se actualizan al finalizar cada partido
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  )
}
