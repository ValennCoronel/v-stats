"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { POSITIONS, POSITION_LABELS, type Position } from "@/lib/types/volleyball"

export interface PlayerData {
  id: string
  name: string
  number: number
  position: string
  injuryHistory: string | null
  avatarUrl: string | null
  isActive: boolean
}

interface PlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player?: PlayerData | null
  onSaved: () => void
}

export function PlayerDialog({ open, onOpenChange, player, onSaved }: PlayerDialogProps) {
  const isEditing = !!player
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [position, setPosition] = useState<string>("")
  const [injuryHistory, setInjuryHistory] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (player) {
        setName(player.name)
        setNumber(String(player.number))
        setPosition(player.position)
        setInjuryHistory(player.injuryHistory || "")
        setAvatarPreview(player.avatarUrl)
      } else {
        setName("")
        setNumber("")
        setPosition("")
        setInjuryHistory("")
        setAvatarPreview(null)
      }
    }
  }, [open, player])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Usá PNG, JPG o JPEG.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    if (!number || parseInt(number) < 0) {
      toast.error("El número de camiseta es requerido")
      return
    }
    if (!position) {
      toast.error("La posición es requerida")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...(isEditing && { id: player.id }),
        name: name.trim(),
        number: parseInt(number),
        position,
        injuryHistory: injuryHistory.trim() || null,
        avatarUrl: avatarPreview,
      }

      const res = await fetch("/api/players", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isEditing ? "Jugador actualizado" : "Jugador agregado exitosamente")
        onSaved()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Error al guardar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Jugador" : "Agregar Jugador"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del jugador"
              : "Completá los datos para agregar un nuevo jugador al plantel"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-20 w-20 ring-2 ring-border ring-offset-2 ring-offset-background">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {name ? getInitials(name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {avatarPreview ? "Cambiar foto" : "Subir foto"}
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setAvatarPreview(null)}
                >
                  <X className="h-3 w-3" />
                  Quitar
                </Button>
              )}
            </div>
          </div>

          {/* Name + Number row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="playerName">Nombre completo</Label>
              <Input
                id="playerName"
                placeholder="Nombre y apellido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playerNumber">N° Camiseta</Label>
              <Input
                id="playerNumber"
                type="number"
                min={0}
                max={99}
                placeholder="#"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="bg-input border-border text-center font-mono"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Posición</Label>
            <Select value={position} onValueChange={setPosition} disabled={isSaving}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Seleccionar posición" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {POSITION_LABELS[pos as Position]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Injury History */}
          <div className="space-y-2">
            <Label htmlFor="injuryHistory">Historial de lesiones</Label>
            <Textarea
              id="injuryHistory"
              placeholder="Ej: Esguince tobillo izquierdo (Mar 2024), Tendinitis hombro derecho (Ago 2023)..."
              value={injuryHistory}
              onChange={(e) => setInjuryHistory(e.target.value)}
              className="bg-input border-border min-h-[80px] resize-none"
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? "Guardar Cambios" : "Agregar Jugador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
