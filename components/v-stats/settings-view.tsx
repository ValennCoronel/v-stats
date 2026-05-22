"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ChevronRight, Camera, User, Shield, Bell,
  Building2, Lock, Fingerprint, LogOut, Trash2,
  Check, ShieldCheck, ShieldAlert, ShieldOff, Plus,
  Pencil, MoreHorizontal, MapPin,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useProfileStore, type AccessRole, type ClubProfile } from "@/lib/stores/profile-store"
import { useAuthStore } from "@/lib/stores/auth-store"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

const PROFILE_COLORS = ["#1E6FD9", "#D97706", "#16A34A", "#7C3AED", "#DC2626", "#0891B2"]

export function SettingsView() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const coach = useProfileStore((s) => s.coach)
  const updateCoach = useProfileStore((s) => s.updateCoach)
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const switchProfile = useProfileStore((s) => s.switchProfile)
  const addProfileLocal = useProfileStore((s) => s.addProfileLocal)
  const updateProfileLocal = useProfileStore((s) => s.updateProfileLocal)
  const deleteProfileLocal = useProfileStore((s) => s.deleteProfileLocal)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Coach profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [tempName, setTempName] = useState(coach.name)
  const [tempEmail, setTempEmail] = useState(coach.email)

  // Club profile management
  const [clubModal, setClubModal] = useState<{ mode: "add" | "edit"; profile?: ClubProfile } | null>(null)
  const [clubForm, setClubForm] = useState({ clubName: "", city: "", role: "admin" as AccessRole, color: PROFILE_COLORS[0] })
  const [formError, setFormError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<ClubProfile | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Notifications
  const [notifMatches, setNotifMatches] = useState(true)
  const [notifStats, setNotifStats] = useState(true)
  const [notifReminders, setNotifReminders] = useState(false)

  // Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const displayName = user?.displayName || coach.name
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) updateCoach({ avatarSrc: URL.createObjectURL(file) })
  }

  const saveProfile = () => {
    updateCoach({ name: tempName, email: tempEmail })
    setEditingProfile(false)
  }

  const openAddClub = () => {
    setFormError("")
    setClubForm({ clubName: "", city: "", role: "admin", color: PROFILE_COLORS[0] })
    setClubModal({ mode: "add" })
  }

  const openEditClub = (profile: ClubProfile) => {
    setFormError("")
    setClubForm({ clubName: profile.name || profile.clubName || "", city: profile.city, role: profile.role, color: profile.color })
    setClubModal({ mode: "edit", profile })
    setMenuOpen(null)
  }

  const saveClub = async () => {
    if (!clubForm.clubName.trim()) return
    setIsSaving(true)
    try {
      if (clubModal?.mode === "add") {
        const res = await fetch("/api/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clubForm.clubName,
            city: clubForm.city,
            role: clubForm.role,
            color: clubForm.color,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          addProfileLocal({
            id: data.club.id,
            name: data.club.name,
            clubName: data.club.name,
            city: data.club.city,
            role: data.club.role,
            color: data.club.color,
            teams: [],
          })
          setClubModal(null)
        } else {
          const err = await res.json()
          setFormError(err.error || "Error al crear club")
        }
      } else if (clubModal?.mode === "edit" && clubModal.profile) {
        const res = await fetch(`/api/clubs/${clubModal.profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clubForm.clubName,
            city: clubForm.city,
            role: clubForm.role,
            color: clubForm.color,
          }),
        })
        if (res.ok) {
          updateProfileLocal(clubModal.profile.id, {
            clubName: clubForm.clubName,
            name: clubForm.clubName,
            city: clubForm.city,
            role: clubForm.role,
            color: clubForm.color,
          })
          setClubModal(null)
        } else {
          const err = await res.json()
          setFormError(err.error || "Error al editar club")
        }
      }
    } catch (e) {
      console.error(e)
      setFormError("Error de red")
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeleteProfile = (profile: ClubProfile) => {
    setDeleteConfirm(profile)
    setMenuOpen(null)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-24">
      {/* ── Header ── */}
      <div className="bg-[#0D1F33] text-white">
        <div className="flex items-center gap-3 px-4 pt-10 pb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1">
            <p style={{ ...barlow, fontSize: "11px", letterSpacing: "1.5px", opacity: 0.55 }}>V-STATS</p>
            <h1 style={{ ...barlow, fontSize: "24px", fontWeight: 700, lineHeight: 1.1 }}>Configuración</h1>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col items-center pb-7 px-4">
          <div className="relative mb-3">
            <Avatar className="size-20 border-4 border-white/20">
              {coach.avatarSrc && <AvatarImage src={coach.avatarSrc} />}
              <AvatarFallback
                className="bg-[#1E6FD9] text-white"
                style={{ ...barlow, fontSize: "28px", fontWeight: 700 }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-7 bg-[#3D8EF5] rounded-full flex items-center justify-center border-2 border-[#0D1F33]"
            >
              <Camera className="size-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div style={{ ...barlow, fontSize: "20px", fontWeight: 700 }}>{displayName}</div>
          <div style={{ fontSize: "13px", opacity: 0.55, marginTop: "2px" }}>{user?.email || coach.email}</div>
          {activeProfile && (
            <div className="mt-2 flex items-center gap-2">
              <div className="size-2 rounded-full" style={{ background: activeProfile.color }} />
              <span style={{ fontSize: "12px", opacity: 0.65 }}>{activeProfile.name || activeProfile.clubName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-12">
        {/* ── Mis Clubes ── */}
        <Section title="MIS CLUBES" icon={<Building2 className="size-4" />}>
          {profiles.map((profile, idx) => (
            <div key={profile.id}>
              {idx > 0 && <Divider />}
              <div className="flex items-center px-3 py-3 gap-3 relative">
                <button
                  onClick={() => switchProfile(profile.id)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <div
                    className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${profile.color}20` }}
                  >
                    <Building2 className="size-4" style={{ color: profile.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ ...barlow, fontSize: "16px", fontWeight: 600, color: "#0D1F33" }}
                        className="truncate"
                      >
                        {profile.name || profile.clubName}
                      </span>
                      {profile.id === activeProfileId && (
                        <span
                          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full text-white"
                          style={{ ...barlow, background: profile.color, letterSpacing: "0.5px" }}
                        >
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="size-2.5 text-[#94A3B8]" />
                      <span style={{ fontSize: "12px", color: "#64748B" }}>{profile.city}</span>
                    </div>
                  </div>
                </button>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setMenuOpen(menuOpen === profile.id ? null : profile.id)}
                    className="size-8 rounded-full hover:bg-[#F4F7FB] flex items-center justify-center"
                  >
                    <MoreHorizontal className="size-4 text-[#94A3B8]" />
                  </button>
                  {menuOpen === profile.id && (
                    <div className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden min-w-[140px]">
                      <button
                        onClick={() => openEditClub(profile)}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#F4F7FB] text-[#0D1F33]"
                      >
                        <Pencil className="size-4 text-[#64748B]" />
                        <span style={{ fontSize: "14px" }}>Editar</span>
                      </button>
                      {profiles.length > 1 && (
                        <button
                          onClick={() => confirmDeleteProfile(profile)}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="size-4" />
                          <span style={{ fontSize: "14px" }}>Eliminar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Divider />
          <button onClick={openAddClub} className="w-full flex items-center gap-3 px-4 py-3 text-[#1E6FD9]">
            <div className="size-9 rounded-xl bg-[#1E6FD9]/10 flex items-center justify-center">
              <Plus className="size-4 text-[#1E6FD9]" />
            </div>
            <span style={{ ...barlow, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px" }}>AGREGAR CLUB</span>
          </button>
        </Section>

        {/* ── Perfil ── */}
        <Section title="PERFIL" icon={<User className="size-4" />}>
          <SettingRow
            label="Nombre"
            value={displayName}
            onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true) }}
          />
          <Divider />
          <SettingRow
            label="Correo electrónico"
            value={user?.email || coach.email}
            onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true) }}
          />
        </Section>

        {/* ── Notificaciones ── */}
        <Section title="NOTIFICACIONES" icon={<Bell className="size-4" />}>
          <SwitchRow label="Partidos programados" desc="Recordatorio 1h antes del partido" value={notifMatches} onChange={setNotifMatches} />
          <Divider />
          <SwitchRow label="Nuevas estadísticas" desc="Cuando se procesen los datos del partido" value={notifStats} onChange={setNotifStats} />
          <Divider />
          <SwitchRow label="Recordatorios de carga" desc="Si hay un partido sin datos registrados" value={notifReminders} onChange={setNotifReminders} />
        </Section>

        {/* ── Cuenta ── */}
        <Section title="CUENTA" icon={<Shield className="size-4" />}>
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-3">
            <LogOut className="size-4 text-[#64748B]" />
            <span style={{ fontSize: "15px", color: "#0D1F33" }}>Cerrar sesión</span>
          </button>
          <Divider />
          <button className="w-full flex items-center gap-3 px-4 py-3">
            <Trash2 className="size-4 text-red-400" />
            <span style={{ fontSize: "15px", color: "#EF4444" }}>Eliminar cuenta</span>
          </button>
        </Section>

        <p className="text-center" style={{ fontSize: "12px", color: "#CBD5E1" }}>
          V-Stats · v1.0.0 · Hecho para entrenadores 🏐
        </p>
      </div>

      {/* ── Edit Coach Profile Modal ── */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33" }}>Editar Perfil</DialogTitle>
          <div className="space-y-4 mt-2">
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>NOMBRE</label>
              <Input value={tempName} onChange={(e) => setTempName(e.target.value)} className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]" />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>CORREO ELECTRÓNICO</label>
              <Input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditingProfile(false)}>CANCELAR</Button>
              <Button className="flex-1 bg-[#1E6FD9] hover:bg-[#1557B0]" onClick={saveProfile} style={{ ...barlow, letterSpacing: "1px" }}>GUARDAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Club Modal ── */}
      <Dialog open={clubModal !== null} onOpenChange={() => setClubModal(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33" }}>
            {clubModal?.mode === "add" ? "Agregar Club" : "Editar Club"}
          </DialogTitle>
          {formError && <div className="text-red-500 text-sm font-medium mt-1">{formError}</div>}
          <div className="space-y-4 mt-2">
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>NOMBRE DEL CLUB</label>
              <Input
                placeholder="Ej: Club Atlético Vóley"
                value={clubForm.clubName}
                onChange={(e) => setClubForm((f) => ({ ...f, clubName: e.target.value }))}
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
              />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B" }}>CIUDAD / SEDE</label>
              <Input
                placeholder="Ej: Buenos Aires"
                value={clubForm.city}
                onChange={(e) => setClubForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
              />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B", display: "block", marginBottom: "8px" }}>ROL EN ESTE CLUB</label>
              <div className="flex gap-2">
                {(["admin", "coach", "assistant"] as AccessRole[]).map((r) => {
                  const labels = { admin: "Admin", coach: "Entrenador", assistant: "Asistente" }
                  const colors = { admin: "#1E6FD9", coach: "#D97706", assistant: "#64748B" }
                  const selected = clubForm.role === r
                  return (
                    <button
                      key={r}
                      onClick={() => setClubForm((f) => ({ ...f, role: r }))}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all ${selected ? "border-[#1E6FD9] bg-[#1E6FD9]/5" : "border-[#E2E8F0]"}`}
                      style={{ ...barlow, fontSize: "12px", color: selected ? colors[r] : "#64748B", fontWeight: selected ? 600 : 400 }}
                    >
                      {labels[r]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ ...barlow, fontSize: "12px", letterSpacing: "1px", color: "#64748B", display: "block", marginBottom: "8px" }}>COLOR DE PERFIL</label>
              <div className="flex gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setClubForm((f) => ({ ...f, color }))}
                    className="size-8 rounded-full flex items-center justify-center transition-all"
                    style={{ background: color }}
                  >
                    {clubForm.color === color && <Check className="size-4 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setClubModal(null)}>CANCELAR</Button>
              <Button
                className="flex-1 text-white"
                style={{ background: clubForm.color, ...barlow, letterSpacing: "1px" }}
                onClick={saveClub}
                disabled={!clubForm.clubName.trim() || !clubForm.city.trim() || isSaving}
              >
                {isSaving ? "GUARDANDO..." : clubModal?.mode === "add" ? "AGREGAR" : "GUARDAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Club Confirm ── */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <div className="text-center py-2">
            <div className="size-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="size-6 text-red-400" />
            </div>
            <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33", marginBottom: "8px" }}>
              ¿Eliminar perfil?
            </DialogTitle>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>
              Se eliminará el perfil de <strong>{deleteConfirm?.name || deleteConfirm?.clubName}</strong> y todos sus datos.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>CANCELAR</Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={async () => { 
                  if (deleteConfirm) {
                    setIsSaving(true)
                    try {
                      await fetch(`/api/clubs/${deleteConfirm.id}`, { method: "DELETE" })
                      deleteProfileLocal(deleteConfirm.id)
                      setDeleteConfirm(null)
                    } finally {
                      setIsSaving(false)
                    }
                  }
                }}
                disabled={isSaving}
                style={{ ...barlow, letterSpacing: "1px" }}
              >
                {isSaving ? "ELIMINANDO..." : "ELIMINAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Logout Modal ── */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <div className="text-center py-2">
            <div className="size-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="size-6 text-red-400" />
            </div>
            <DialogTitle style={{ ...barlow, fontSize: "22px", fontWeight: 700, color: "#0D1F33", marginBottom: "8px" }}>¿Cerrar sesión?</DialogTitle>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>Vas a salir de tu cuenta. Tus datos quedarán guardados.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>CANCELAR</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleLogout} style={{ ...barlow, letterSpacing: "1px" }}>SALIR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Shared sub-components ── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[#64748B]">{icon}</span>
        <span style={{ ...barlow, fontSize: "12px", letterSpacing: "1.5px", color: "#64748B" }}>{title}</span>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0]">{children}</div>
    </div>
  )
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <button onClick={onPress} className="w-full flex items-center justify-between px-4 py-3.5">
      <span style={{ fontSize: "15px", color: "#0D1F33" }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: "14px", color: "#64748B", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
        <ChevronRight className="size-4 text-[#CBD5E1] flex-shrink-0" />
      </div>
    </button>
  )
}

function SwitchRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 pr-3">
        <div style={{ fontSize: "15px", color: "#0D1F33" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "1px" }}>{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-[#F4F7FB] mx-4" />
}
