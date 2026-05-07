"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { EntityData } from "./entity-form-dialog"

interface EntityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity: EntityData | null
  entityType: "opponent" | "tournament"
  apiBasePath: string
  onDeleted: () => void
}

export function EntityDeleteDialog({
  open,
  onOpenChange,
  entity,
  entityType,
  apiBasePath,
  onDeleted,
}: EntityDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [matchInfo, setMatchInfo] = useState<{
    hasMatches: boolean
    matchCount: number
    message: string
  } | null>(null)
  const [confirmedForce, setConfirmedForce] = useState(false)

  const label =
    entityType === "opponent" ? "equipo rival" : "torneo"

  const handleDelete = async () => {
    if (!entity) return
    setIsDeleting(true)

    try {
      const res = await fetch(`${apiBasePath}/${entity.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(
          `${entity.name} eliminado correctamente`
        )
        onDeleted()
        onOpenChange(false)
        setMatchInfo(null)
        setConfirmedForce(false)
      } else if (res.status === 409) {
        // Has matches — show warning
        const data = await res.json()
        setMatchInfo({
          hasMatches: true,
          matchCount: data.matchCount,
          message: data.error,
        })
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setMatchInfo(null)
      setConfirmedForce(false)
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {matchInfo
              ? `⚠️ ${entity?.name} tiene partidos asociados`
              : `¿Eliminar ${label}?`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {matchInfo ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{matchInfo.message}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se encontraron <strong>{matchInfo.matchCount}</strong>{" "}
                    partido(s) que hacen referencia a este {label}. 
                    Al eliminarlo, ya no podrás filtrar o agrupar estadísticas por este nombre.
                  </p>
                </div>
              ) : (
                <span>
                  Estás por eliminar a <strong>{entity?.name}</strong>. 
                  Esta acción no se puede deshacer.
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          {matchInfo ? (
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault()
                // Warn but don't delete — per user request, just inform
                toast.info(
                  "No se puede eliminar mientras tenga partidos asociados."
                )
                handleClose(false)
              }}
              disabled={isDeleting}
            >
              Entendido
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
