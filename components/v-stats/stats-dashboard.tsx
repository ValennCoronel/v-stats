"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Home, BarChart3, Settings, Plus, ChevronDown, Check,
  Building2, MapPin, Users, UserPlus
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useProfileStore, type ClubProfile } from "@/lib/stores/profile-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { POSITION_LABELS } from "@/lib/types/volleyball"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  coach: "Entrenador",
  assistant: "Asistente",
}

export function StatsDashboard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const coach = useProfileStore((s) => s.coach)
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)
  const switchProfile = useProfileStore((s) => s.switchProfile)
  const addTeamLocal = useProfileStore((s) => s.addTeamLocal)
  const fetchProfiles = useProfileStore((s) => s.fetchProfiles)

  // Modals
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Forms
  const [teamName, setTeamName] = useState("")
  const [playerForm, setPlayerForm] = useState({ name: "", dni: "", number: "", position: "OUTSIDE_HITTER", teamId: "" })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const displayName = user?.displayName || coach.name
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleSwitch = (id: string) => {
    switchProfile(id)
    setShowSwitcher(false)
  }

  const handleAddTeam = async () => {
    if (!teamName.trim() || !activeProfile) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: activeProfile.id,
          name: teamName.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        addTeamLocal(activeProfile.id, {
          id: data.team.id,
          clubId: activeProfile.id,
          name: data.team.name,
          players: 0,
          matches: 0,
          record: "0-0",
        })
        setTeamName("")
        setShowAddTeam(false)
      } else {
        const err = await res.json()
        setFormError(err.error || "Error al crear equipo")
      }
    } catch (e) {
      setFormError("Error de red")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPlayer = async () => {
    if (!playerForm.name.trim() || !playerForm.dni.trim() || !playerForm.number || !playerForm.teamId || !activeProfile) return
    setIsSaving(true)
    setFormError("")
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: activeProfile.id,
          teamId: playerForm.teamId,
          dni: playerForm.dni.trim(),
          name: playerForm.name.trim(),
          number: playerForm.number,
          position: playerForm.position,
        }),
      })
      if (res.ok) {
        // Player created successfully
        // We could fetch players here or let the team page handle it
        setShowAddPlayer(false)
        setPlayerForm({ name: "", dni: "", number: "", position: "OUTSIDE_HITTER", teamId: "" })
      } else {
        const err = await res.json()
        setFormError(err.error || "Error al crear jugador")
      }
    } catch (e) {
      setFormError("Error de red")
    } finally {
      setIsSaving(false)
    }
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-[#64748B] mb-4">No tienes clubes registrados.</p>
        <Button onClick={() => router.push("/settings")} className="bg-[#1E6FD9]">
          Configurar Perfil
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* ── Header ── */}
      <div className="bg-[#0D1F33] text-white px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-white/20">
              {coach.avatarSrc && <AvatarImage src={coach.avatarSrc} />}
              <AvatarFallback className="bg-[#1E6FD9] text-white" style={{ ...barlow, fontSize: "16px", fontWeight: 700 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p style={{ fontSize: "11px", opacity: 0.5, letterSpacing: "0.5px" }}>Bienvenido,</p>
              <p style={{ ...barlow, fontSize: "17px", fontWeight: 700, lineHeight: 1 }}>{displayName}</p>
            </div>
          </div>
          <button onClick={() => router.push("/settings")} className="size-9 rounded-full bg-white/10 flex items-center justify-center">
            <Settings className="size-4 text-white" />
          </button>
        </div>

        <button
          onClick={() => setShowSwitcher(true)}
          className="w-full flex items-center justify-between bg-white/10 border border-white/15 rounded-xl px-4 py-3 active:bg-white/15 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${activeProfile.color}30` }}>
              <Building2 className="size-4" style={{ color: activeProfile.color }} />
            </div>
            <div className="text-left">
              <p style={{ ...barlow, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>{activeProfile.name || activeProfile.clubName}</p>
              <p style={{ fontSize: "11px", opacity: 0.55, marginTop: "2px" }}>{activeProfile.city} · {roleLabel[activeProfile.role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ ...barlow, fontSize: "10px", letterSpacing: "1px", opacity: 0.5 }}>CAMBIAR</span>
            <ChevronDown className="size-4 opacity-50" />
          </div>
        </button>
      </div>

      {/* ── Teams List ── */}
      <div className="px-4 pt-5 pb-32 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 style={{ ...barlow, fontSize: "18px", fontWeight: 700, color: "#0D1F33", letterSpacing: "0.5px" }}>MIS EQUIPOS</h2>
          <span style={{ fontSize: "13px", color: "#64748B" }}>{activeProfile.teams?.length || 0} equipos</span>
        </div>

        {(!activeProfile.teams || activeProfile.teams.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 bg-[#E2E8F0] rounded-full flex items-center justify-center mb-4">
              <Building2 className="size-7 text-[#94A3B8]" />
            </div>
            <p style={{ ...barlow, fontSize: "18px", fontWeight: 600, color: "#0D1F33" }}>Sin equipos aún</p>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>Agregá el primer equipo de {activeProfile.name || activeProfile.clubName}</p>
          </div>
        ) : (
          activeProfile.teams.map((team) => (
            <Card
              key={team.id}
              className="bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative"
              onClick={() => router.push(`/team/${team.id}`)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l" style={{ background: activeProfile.color }} />
              <div className="pl-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 style={{ ...barlow, fontSize: "19px", fontWeight: 600, color: "#0D1F33" }}>{team.name}</h3>
                  <Badge style={{ ...barlow, fontSize: "11px", letterSpacing: "0.5px", background: activeProfile.color, color: "#fff" }}>VÓLEY</Badge>
                </div>
                <div className="flex gap-5 text-sm">
                  <div><span className="text-[#64748B]">Jugadores </span><span style={{ color: "#0D1F33", fontWeight: 500 }}>{team.players}</span></div>
                  <div><span className="text-[#64748B]">Partidos </span><span style={{ color: "#0D1F33", fontWeight: 500 }}>{team.matches}</span></div>
                  <div><span className="text-[#64748B]">Record </span><span style={{ color: activeProfile.color, fontWeight: 600 }}>{team.record}</span></div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── FAB Menu ── */}
      {fabOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)}></div>
      )}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="flex flex-col gap-3 items-end mb-2 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => { setFormError(""); setTeamName(""); setShowAddTeam(true); setFabOpen(false) }}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md text-[#0D1F33]"
            >
              <span style={{ ...barlow, fontSize: "16px", fontWeight: 600 }}>Añadir Equipo</span>
              <div className="size-8 bg-[#F4F7FB] rounded-full flex items-center justify-center">
                <Users className="size-4 text-[#1E6FD9]" />
              </div>
            </button>
            <button
              onClick={() => { setFormError(""); setPlayerForm({ name: "", dni: "", number: "", position: "OUTSIDE_HITTER", teamId: "" }); setShowAddPlayer(true); setFabOpen(false) }}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md text-[#0D1F33]"
            >
              <span style={{ ...barlow, fontSize: "16px", fontWeight: 600 }}>Añadir Jugador</span>
              <div className="size-8 bg-[#F4F7FB] rounded-full flex items-center justify-center">
                <UserPlus className="size-4 text-[#16A34A]" />
              </div>
            </button>
          </div>
        )}
        <Button
          onClick={() => setFabOpen(!fabOpen)}
          className="size-14 rounded-full shadow-lg transition-transform duration-200"
          style={{ background: activeProfile.color, transform: fabOpen ? "rotate(45deg)" : "rotate(0)" }}
        >
          <Plus className="size-6" />
        </Button>
      </div>

      {/* ── Add Team Modal ── */}
      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33" }}>Nuevo Equipo</DialogTitle>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>Agregar equipo en <strong>{activeProfile.name || activeProfile.clubName}</strong></p>
          {formError && <div className="text-red-500 text-sm font-medium mb-2">{formError}</div>}
          <div className="space-y-4">
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>NOMBRE DEL EQUIPO</label>
              <Input
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
                placeholder="Ej: Equipo Femenino Senior"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTeam()}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddTeam(false)}>CANCELAR</Button>
              <Button className="flex-1 text-white" style={{ background: activeProfile.color, ...barlow, letterSpacing: "1px" }} onClick={handleAddTeam} disabled={!teamName.trim() || isSaving}>
                {isSaving ? "GUARDANDO..." : "AGREGAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Player Modal ── */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33" }}>Nuevo Jugador</DialogTitle>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>Asignar jugador en <strong>{activeProfile.name || activeProfile.clubName}</strong></p>
          {formError && <div className="text-red-500 text-sm font-medium mb-2">{formError}</div>}
          <div className="space-y-4">
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>DNI</label>
              <Input className="mt-1" placeholder="Ej: 38123456" value={playerForm.dni} onChange={(e) => setPlayerForm({...playerForm, dni: e.target.value})} />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>NOMBRE COMPLETO</label>
              <Input className="mt-1" placeholder="Ej: Facundo Conte" value={playerForm.name} onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>NÚMERO</label>
                <Input className="mt-1" type="number" placeholder="Ej: 7" value={playerForm.number} onChange={(e) => setPlayerForm({...playerForm, number: e.target.value})} />
              </div>
              <div>
                <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>POSICIÓN</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-1"
                  value={playerForm.position}
                  onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})}
                >
                  {Object.entries(POSITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>EQUIPO BASE</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-1"
                value={playerForm.teamId}
                onChange={(e) => setPlayerForm({...playerForm, teamId: e.target.value})}
              >
                <option value="">Seleccionar Equipo...</option>
                {activeProfile.teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPlayer(false)}>CANCELAR</Button>
              <Button className="flex-1 text-white bg-[#16A34A] hover:bg-[#15803d]" style={{ ...barlow, letterSpacing: "1px" }} onClick={handleAddPlayer} disabled={!playerForm.name || !playerForm.dni || !playerForm.number || !playerForm.teamId || isSaving}>
                {isSaving ? "GUARDANDO..." : "AGREGAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Club Switcher Modal ── */}
      <Dialog open={showSwitcher} onOpenChange={setShowSwitcher}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33", marginBottom: "4px" }}>Cambiar de Club</DialogTitle>
          <div className="space-y-2 mb-4">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} isActive={profile.id === activeProfile.id} onSelect={() => handleSwitch(profile.id)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProfileCard({ profile, isActive, onSelect }: { profile: ClubProfile, isActive: boolean, onSelect: () => void }) {
  const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }
  return (
    <button onClick={onSelect} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${isActive ? "border-[#1E6FD9] bg-[#1E6FD9]/5" : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"}`}>
      <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${profile.color}20` }}>
        <Building2 className="size-5" style={{ color: profile.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#0D1F33", lineHeight: 1.2 }} className="truncate">{profile.name || profile.clubName}</div>
        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }} className="flex items-center gap-1.5"><MapPin className="size-3" /> {profile.city}</div>
      </div>
      {isActive && <div className="size-5 bg-[#1E6FD9] rounded-full flex items-center justify-center"><Check className="size-3 text-white" strokeWidth={3} /></div>}
    </button>
  )
}
