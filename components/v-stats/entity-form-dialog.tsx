"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ImageIcon, Upload, RefreshCw } from "lucide-react"
import Image from "next/image"

export interface EntityData {
  id: string
  name: string
  logoUrl: string | null
  lastUsedAt: string | null
}

interface EntityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity: EntityData | null // null = create mode
  entityType: "opponent" | "tournament"
  onSaved: (entity: EntityData) => void
  apiBasePath: string // "/api/opponent-teams" or "/api/tournaments"
}

export function EntityFormDialog({
  open,
  onOpenChange,
  entity,
  entityType,
  onSaved,
  apiBasePath,
}: EntityFormDialogProps) {
  const [name, setName] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [existingLogo, setExistingLogo] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!entity

  useEffect(() => {
    if (open) {
      if (entity) {
        setName(entity.name)
        setExistingLogo(entity.logoUrl)
        setLogoPreview(null)
      } else {
        setName("")
        setExistingLogo(null)
        setLogoPreview(null)
      }
    }
  }, [open, entity])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)

    try {
      const payload: { name: string; logoUrl?: string | null } = {
        name: name.trim(),
      }

      // Only include logo if changed
      if (logoPreview) {
        payload.logoUrl = logoPreview
      }

      const url = isEditing ? `${apiBasePath}/${entity.id}` : apiBasePath
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        const saved = data.team || data.tournament
        onSaved(saved)
        onOpenChange(false)
      }
    } catch {
      // Silent fail — toast handled upstream
    } finally {
      setIsSaving(false)
    }
  }

  const displayLogo = logoPreview || existingLogo
  const label =
    entityType === "opponent" ? "Equipo Rival" : "Torneo / Liga"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${label}` : `Nuevo ${label}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modificá el nombre o logo del ${label.toLowerCase()}.`
              : `Cargá el nombre y logo del nuevo ${label.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayLogo ? (
                <Image
                  src={displayLogo}
                  alt="Logo"
                  fill
                  className="object-cover rounded-xl"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">
                    Logo
                  </span>
                </div>
              )}
            </div>
            {logoPreview ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setLogoPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                <RefreshCw className="h-3 w-3" />
                Cambiar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {existingLogo ? "Cambiar Logo" : "Subir Logo"}
              </Button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="entity-name" className="text-foreground">
              Nombre
            </Label>
            <Input
              id="entity-name"
              placeholder={
                entityType === "opponent"
                  ? "Nombre del equipo rival"
                  : "Nombre del torneo o liga"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-2"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
