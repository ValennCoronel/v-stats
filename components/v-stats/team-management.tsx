"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { 
  Upload, 
  UserPlus, 
  Pencil, 
  Trash2,
  Loader2,
  RefreshCw,
  Save,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { POSITION_LABELS, type Position } from "@/lib/types/volleyball"
import { PlayerDialog, type PlayerData } from "./player-dialog"
import { PlayerDetail } from "./player-detail"

export function TeamManagement() {
  // Team state
  const [teamName, setTeamName] = useState("")
  const [savedTeamName, setSavedTeamName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Players state
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)

  // Dialog state
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null)
  const [detailPlayer, setDetailPlayer] = useState<PlayerData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PlayerData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- Team data ---
  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/teams")
      if (res.ok) {
        const data = await res.json()
        setTeamName(data.team.name)
        setSavedTeamName(data.team.name)
        setLogoUrl(data.team.logoUrl)
      }
    } catch {
      toast.error("Error al cargar datos del equipo")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // --- Players data ---
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players")
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.players)
      }
    } catch {
      toast.error("Error al cargar jugadores")
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [])

  useEffect(() => {
    fetchTeam()
    fetchPlayers()
  }, [fetchTeam, fetchPlayers])

  // --- Logo handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveLogo = async () => {
    if (!logoPreview) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: logoPreview }),
      })
      if (res.ok) {
        setLogoUrl(logoPreview)
        setLogoPreview(null)
        toast.success("Logo guardado con éxito")
      } else {
        toast.error("Error al guardar el logo")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelPreview = () => {
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSaveTeamName = async () => {
    if (!teamName.trim()) {
      toast.error("El nombre del equipo no puede estar vacío")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      if (res.ok) {
        setSavedTeamName(teamName.trim())
        toast.success("Nombre del equipo actualizado")
      } else {
        toast.error("Error al guardar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsSaving(false)
    }
  }

  // --- Player handlers ---
  const handleAddPlayer = () => {
    setEditingPlayer(null)
    setPlayerDialogOpen(true)
  }

  const handleEditPlayer = (player: PlayerData) => {
    setEditingPlayer(player)
    setPlayerDialogOpen(true)
  }

  const handleViewPlayer = (player: PlayerData) => {
    setDetailPlayer(player)
    setDetailOpen(true)
  }

  const handleDeletePlayer = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/players?id=${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success(`${deleteTarget.name} eliminado del plantel`)
        fetchPlayers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const displayLogo = logoPreview || logoUrl
  const hasUnsavedPreview = !!logoPreview
  const nameChanged = teamName.trim() !== savedTeamName

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">Manage your team info and roster</p>
        </div>

        {/* Team Info Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Edit Team Info</CardTitle>
            <CardDescription>Update your team name and logo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {displayLogo ? (
                    <Image
                      src={displayLogo}
                      alt="Team logo"
                      fill
                      className="object-cover rounded-xl"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Click to upload</span>
                    </div>
                  )}
                </div>
                {hasUnsavedPreview ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleCancelPreview}
                      disabled={isSaving}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reemplazar
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white"
                      onClick={handleSaveLogo}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Guardar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {logoUrl ? "Cambiar Logo" : "Upload Logo"}
                  </Button>
                )}
              </div>

              {/* Team Name Input */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="teamName" className="text-foreground">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <Button
                className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white self-end"
                onClick={handleSaveTeamName}
                disabled={isSaving || !nameChanged}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Roster Management */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Roster Management</CardTitle>
              <CardDescription>{players.length} players on roster</CardDescription>
            </div>
            <Button
              className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-2"
              onClick={handleAddPlayer}
            >
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingPlayers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No hay jugadores en el plantel</p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleAddPlayer}
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar el primero
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-muted-foreground">Jersey #</TableHead>
                        <TableHead className="text-muted-foreground">Player</TableHead>
                        <TableHead className="text-muted-foreground">Position</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id} className="border-border">
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-foreground">
                              #{player.number}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                onClick={() => handleViewPlayer(player)}
                              >
                                <AvatarImage src={player.avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleViewPlayer(player)}
                              >
                                {player.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {POSITION_LABELS[player.position as Position] || player.position}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditPlayer(player)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(player)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => handleViewPlayer(player)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={player.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {player.name}
                            </span>
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              #{player.number}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {POSITION_LABELS[player.position as Position] || player.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditPlayer(player)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(player)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Player Add/Edit Dialog */}
      <PlayerDialog
        open={playerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        player={editingPlayer}
        onSaved={fetchPlayers}
      />

      {/* Player Detail Sheet */}
      <PlayerDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        player={detailPlayer}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{deleteTarget?.name}</strong> (#{deleteTarget?.number}) del plantel. 
              Esta acción no se puede deshacer y se perderán todas las estadísticas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDeletePlayer}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
