import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, ChevronRight, Camera, User, Shield, Bell,
  MapPin, Building2, Lock, Fingerprint, LogOut, Trash2,
  Check, ShieldCheck, ShieldAlert, ShieldOff, Plus,
  Pencil, MoreHorizontal, X,
} from 'lucide-react';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { useProfile, AccessRole, ClubProfile } from '../../context/ProfileContext';

const barlow = { fontFamily: "'Barlow Condensed', sans-serif" };
type SecurityLevel = 'none' | 'pin' | 'biometric';

const PROFILE_COLORS = ['#1E6FD9', '#D97706', '#16A34A', '#7C3AED', '#DC2626', '#0891B2'];

export default function ConfigScreen() {
  const navigate = useNavigate();
  const { coach, updateCoach, profiles, activeProfile, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Coach profile editing ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(coach.name);
  const [tempEmail, setTempEmail] = useState(coach.email);

  // ── Club profile management ──
  const [clubModal, setClubModal] = useState<{ mode: 'add' | 'edit'; profile?: ClubProfile } | null>(null);
  const [clubForm, setClubForm] = useState({ clubName: '', city: '', role: 'admin' as AccessRole, color: PROFILE_COLORS[0] });
  const [deleteConfirm, setDeleteConfirm] = useState<ClubProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // ── Security ──
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('none');
  const [accessRole, setAccessRole] = useState<AccessRole>(activeProfile.role);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'set' | 'confirm'>('set');
  const [firstPin, setFirstPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ── Notifications ──
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifStats, setNotifStats] = useState(true);
  const [notifReminders, setNotifReminders] = useState(false);

  // ── Logout ──
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ── Handlers ── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateCoach({ avatarSrc: URL.createObjectURL(file) });
  };

  const saveProfile = () => {
    updateCoach({ name: tempName, email: tempEmail });
    setEditingProfile(false);
  };

  const openAddClub = () => {
    setClubForm({ clubName: '', city: '', role: 'admin', color: PROFILE_COLORS[0] });
    setClubModal({ mode: 'add' });
  };

  const openEditClub = (profile: ClubProfile) => {
    setClubForm({ clubName: profile.clubName, city: profile.city, role: profile.role, color: profile.color });
    setClubModal({ mode: 'edit', profile });
    setMenuOpen(null);
  };

  const saveClub = () => {
    if (!clubForm.clubName.trim()) return;
    if (clubModal?.mode === 'add') {
      addProfile(clubForm);
    } else if (clubModal?.mode === 'edit' && clubModal.profile) {
      updateProfile(clubModal.profile.id, clubForm);
    }
    setClubModal(null);
  };

  const confirmDelete = (profile: ClubProfile) => {
    setDeleteConfirm(profile);
    setMenuOpen(null);
  };

  const handleSecurityLevel = (level: SecurityLevel) => {
    if (level === 'pin') {
      setPinStep('set'); setPinInput(''); setFirstPin(''); setPinError('');
      setShowPinModal(true);
    } else {
      setSecurityLevel(level);
      setPin('');
    }
  };

  const handlePinDigit = (d: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinStep === 'set') {
          setFirstPin(next); setPinStep('confirm'); setPinInput(''); setPinError('');
        } else {
          if (next === firstPin) {
            setPin(next); setSecurityLevel('pin'); setShowPinModal(false);
          } else {
            setPinError('Los PINs no coinciden. Intentá de nuevo.');
            setPinInput(''); setPinStep('set'); setFirstPin('');
          }
        }
      }, 120);
    }
  };

  const rolesConfig: { id: AccessRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'admin', label: 'Administrador', desc: 'Acceso total: equipos, partidos, estadísticas y configuración.', icon: <ShieldCheck className="size-5" />, color: '#1E6FD9' },
    { id: 'coach', label: 'Entrenador', desc: 'Carga de datos en vivo y visualización de estadísticas.', icon: <ShieldAlert className="size-5" />, color: '#D97706' },
    { id: 'assistant', label: 'Asistente', desc: 'Solo carga de datos durante el partido.', icon: <ShieldOff className="size-5" />, color: '#64748B' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB]">

      {/* ── Header ── */}
      <div className="bg-[#0D1F33] text-white">
        <div className="flex items-center gap-3 px-4 pt-10 pb-6">
          <button onClick={() => navigate('/home')} className="size-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1">
            <p style={{ ...barlow, fontSize: '11px', letterSpacing: '1.5px', opacity: 0.55 }}>V-STATS</p>
            <h1 style={{ ...barlow, fontSize: '24px', fontWeight: 700, lineHeight: 1.1 }}>Configuración</h1>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col items-center pb-7 px-4">
          <div className="relative mb-3">
            <Avatar className="size-20 border-4 border-white/20">
              {coach.avatarSrc && <AvatarImage src={coach.avatarSrc} />}
              <AvatarFallback className="bg-[#1E6FD9] text-white" style={{ ...barlow, fontSize: '28px', fontWeight: 700 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 size-7 bg-[#3D8EF5] rounded-full flex items-center justify-center border-2 border-[#0D1F33]">
              <Camera className="size-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div style={{ ...barlow, fontSize: '20px', fontWeight: 700 }}>{coach.name}</div>
          <div style={{ fontSize: '13px', opacity: 0.55, marginTop: '2px' }}>{coach.email}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ background: activeProfile.color }} />
            <span style={{ fontSize: '12px', opacity: 0.65 }}>{activeProfile.clubName}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-12">

        {/* ── Mis Clubes ── */}
        <Section title="MIS CLUBES" icon={<Building2 className="size-4" />}>
          {profiles.map((profile, idx) => (
            <div key={profile.id}>
              {idx > 0 && <Divider />}
              <div className="flex items-center px-3 py-3 gap-3 relative">
                {/* Color swatch */}
                <button
                  onClick={() => switchProfile(profile.id)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${profile.color}20` }}>
                    <Building2 className="size-4" style={{ color: profile.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ ...barlow, fontSize: '16px', fontWeight: 600, color: '#0D1F33' }} className="truncate">
                        {profile.clubName}
                      </span>
                      {profile.id === activeProfileId && (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ ...barlow, background: profile.color, letterSpacing: '0.5px' }}>
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="size-2.5 text-[#94A3B8]" />
                      <span style={{ fontSize: '12px', color: '#64748B' }}>{profile.city}</span>
                    </div>
                  </div>
                </button>

                {/* Action menu */}
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
                        <span style={{ fontSize: '14px' }}>Editar</span>
                      </button>
                      {profiles.length > 1 && (
                        <button
                          onClick={() => confirmDelete(profile)}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="size-4" />
                          <span style={{ fontSize: '14px' }}>Eliminar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Divider />
          <button
            onClick={openAddClub}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#1E6FD9]"
          >
            <div className="size-9 rounded-xl bg-[#1E6FD9]/10 flex items-center justify-center">
              <Plus className="size-4 text-[#1E6FD9]" />
            </div>
            <span style={{ ...barlow, fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px' }}>
              AGREGAR CLUB
            </span>
          </button>
        </Section>

        {/* ── Perfil del entrenador ── */}
        <Section title="PERFIL" icon={<User className="size-4" />}>
          <SettingRow label="Nombre" value={coach.name} onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true); }} />
          <Divider />
          <SettingRow label="Correo electrónico" value={coach.email} onPress={() => { setTempName(coach.name); setTempEmail(coach.email); setEditingProfile(true); }} />
        </Section>

        {/* ── Seguridad ── */}
        <Section title="SEGURIDAD" icon={<Shield className="size-4" />}>
          <div className="px-4 pt-3 pb-1">
            <p style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>NIVEL DE PROTECCIÓN</p>
          </div>
          <div className="px-3 pb-3 flex gap-2">
            {([
              { id: 'none' as SecurityLevel, label: 'Ninguna', icon: <Lock className="size-4" /> },
              { id: 'pin' as SecurityLevel, label: 'PIN', icon: <Lock className="size-4" /> },
              { id: 'biometric' as SecurityLevel, label: 'Biométrico', icon: <Fingerprint className="size-4" /> },
            ]).map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSecurityLevel(opt.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                  securityLevel === opt.id ? 'border-[#1E6FD9] bg-[#1E6FD9]/5' : 'border-[#E2E8F0] bg-white'
                }`}
              >
                <span style={{ color: securityLevel === opt.id ? '#1E6FD9' : '#64748B' }}>{opt.icon}</span>
                <span style={{ ...barlow, fontSize: '12px', color: securityLevel === opt.id ? '#1E6FD9' : '#0D1F33', fontWeight: securityLevel === opt.id ? 600 : 400 }}>
                  {opt.label}
                </span>
                {securityLevel === opt.id && (
                  <div className="size-4 bg-[#1E6FD9] rounded-full flex items-center justify-center">
                    <Check className="size-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {securityLevel === 'pin' && pin && (
            <>
              <Divider />
              <button onClick={() => { setPinStep('set'); setPinInput(''); setFirstPin(''); setPinError(''); setShowPinModal(true); }} className="w-full flex items-center justify-between px-4 py-3">
                <span style={{ fontSize: '15px', color: '#0D1F33' }}>Cambiar PIN</span>
                <ChevronRight className="size-4 text-[#CBD5E1]" />
              </button>
            </>
          )}

          <Divider />
          <button onClick={() => setShowRoleModal(true)} className="w-full flex items-center justify-between px-4 py-3">
            <div>
              <div style={{ fontSize: '15px', color: '#0D1F33' }}>Rol de acceso</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>{rolesConfig.find(r => r.id === accessRole)?.label}</div>
            </div>
            <div className="flex items-center gap-2">
              <RolePill role={accessRole} small />
              <ChevronRight className="size-4 text-[#CBD5E1]" />
            </div>
          </button>
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
            <span style={{ fontSize: '15px', color: '#0D1F33' }}>Cerrar sesión</span>
          </button>
          <Divider />
          <button className="w-full flex items-center gap-3 px-4 py-3">
            <Trash2 className="size-4 text-red-400" />
            <span style={{ fontSize: '15px', color: '#EF4444' }}>Eliminar cuenta</span>
          </button>
        </Section>

        <p className="text-center" style={{ fontSize: '12px', color: '#CBD5E1' }}>
          V-Stats · v1.0.0 · Hecho para entrenadores 🏐
        </p>
      </div>

      {/* ── Edit Coach Profile Modal ── */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33' }}>Editar Perfil</DialogTitle>
          <div className="space-y-4 mt-2">
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>NOMBRE</label>
              <Input value={tempName} onChange={e => setTempName(e.target.value)} className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]" />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>CORREO ELECTRÓNICO</label>
              <Input type="email" value={tempEmail} onChange={e => setTempEmail(e.target.value)} className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditingProfile(false)}>CANCELAR</Button>
              <Button className="flex-1 bg-[#1E6FD9] hover:bg-[#1557B0]" onClick={saveProfile} style={{ ...barlow, letterSpacing: '1px' }}>GUARDAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Club Modal ── */}
      <Dialog open={clubModal !== null} onOpenChange={() => setClubModal(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33' }}>
            {clubModal?.mode === 'add' ? 'Agregar Club' : 'Editar Club'}
          </DialogTitle>
          <div className="space-y-4 mt-2">
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>NOMBRE DEL CLUB</label>
              <Input
                placeholder="Ej: Club Atlético Vóley"
                value={clubForm.clubName}
                onChange={e => setClubForm(f => ({ ...f, clubName: e.target.value }))}
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
              />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B' }}>CIUDAD / SEDE</label>
              <Input
                placeholder="Ej: Buenos Aires"
                value={clubForm.city}
                onChange={e => setClubForm(f => ({ ...f, city: e.target.value }))}
                className="mt-1 border-[#E2E8F0] focus-visible:ring-[#1E6FD9]"
              />
            </div>
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B', display: 'block', marginBottom: '8px' }}>ROL EN ESTE CLUB</label>
              <div className="flex gap-2">
                {(['admin', 'coach', 'assistant'] as AccessRole[]).map(r => {
                  const labels = { admin: 'Admin', coach: 'Entrenador', assistant: 'Asistente' };
                  const colors = { admin: '#1E6FD9', coach: '#D97706', assistant: '#64748B' };
                  const selected = clubForm.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setClubForm(f => ({ ...f, role: r }))}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all ${selected ? 'border-[#1E6FD9] bg-[#1E6FD9]/5' : 'border-[#E2E8F0]'}`}
                      style={{ ...barlow, fontSize: '12px', color: selected ? colors[r] : '#64748B', fontWeight: selected ? 600 : 400 }}
                    >
                      {labels[r]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ ...barlow, fontSize: '12px', letterSpacing: '1px', color: '#64748B', display: 'block', marginBottom: '8px' }}>COLOR DE PERFIL</label>
              <div className="flex gap-2">
                {PROFILE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setClubForm(f => ({ ...f, color }))}
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
                style={{ background: clubForm.color, ...barlow, letterSpacing: '1px' }}
                onClick={saveClub}
                disabled={!clubForm.clubName.trim()}
              >
                {clubModal?.mode === 'add' ? 'AGREGAR' : 'GUARDAR'}
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
            <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33', marginBottom: '8px' }}>
              ¿Eliminar perfil?
            </DialogTitle>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              Se eliminará el perfil de <strong>{deleteConfirm?.clubName}</strong> y todos sus datos locales. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>CANCELAR</Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => { if (deleteConfirm) { deleteProfile(deleteConfirm.id); setDeleteConfirm(null); } }}
                style={{ ...barlow, letterSpacing: '1px' }}
              >
                ELIMINAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PIN Modal ── */}
      <Dialog open={showPinModal} onOpenChange={(o) => { if (!o) { setShowPinModal(false); setPinInput(''); } }}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <div className="flex flex-col items-center pt-2 pb-1">
            <div className="size-12 bg-[#1E6FD9]/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="size-5 text-[#1E6FD9]" />
            </div>
            <DialogTitle style={{ ...barlow, fontSize: '20px', fontWeight: 700, color: '#0D1F33', marginBottom: '4px' }}>
              {pinStep === 'set' ? 'Crear PIN' : 'Confirmar PIN'}
            </DialogTitle>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', textAlign: 'center' }}>
              {pinStep === 'set' ? 'Ingresá un PIN de 4 dígitos' : 'Ingresá el PIN nuevamente para confirmar'}
            </p>
            {pinError && <p className="text-red-500 mb-3 text-center" style={{ fontSize: '13px' }}>{pinError}</p>}
            <div className="flex gap-4 mb-6">
              {[0,1,2,3].map(i => (
                <div key={i} className={`size-4 rounded-full border-2 transition-all ${i < pinInput.length ? 'bg-[#1E6FD9] border-[#1E6FD9]' : 'bg-transparent border-[#CBD5E1]'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
                <button
                  key={i}
                  onClick={() => { if (key === '⌫') setPinInput(p => p.slice(0, -1)); else if (key) handlePinDigit(key); }}
                  disabled={key === ''}
                  className={`h-14 rounded-xl flex items-center justify-center transition-all ${key === '' ? 'invisible' : 'bg-[#F4F7FB] hover:bg-[#E2E8F0] active:bg-[#E2E8F0]'}`}
                  style={{ ...barlow, fontSize: '22px', fontWeight: 600, color: '#0D1F33' }}
                >
                  {key}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPinModal(false)} className="mt-5 text-[#64748B]" style={{ fontSize: '13px' }}>Cancelar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Role Modal ── */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33', marginBottom: '4px' }}>Rol de acceso</DialogTitle>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Define qué puede ver y hacer este usuario en la app.</p>
          <div className="space-y-3">
            {rolesConfig.map(role => (
              <button key={role.id} onClick={() => { setAccessRole(role.id); setShowRoleModal(false); }}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${accessRole === role.id ? 'border-[#1E6FD9] bg-[#1E6FD9]/5' : 'border-[#E2E8F0] bg-white'}`}
              >
                <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${role.color}18`, color: role.color }}>{role.icon}</div>
                <div className="flex-1">
                  <div style={{ ...barlow, fontSize: '17px', fontWeight: 600, color: '#0D1F33' }}>{role.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, marginTop: '2px' }}>{role.desc}</div>
                </div>
                {accessRole === role.id && (
                  <div className="size-5 bg-[#1E6FD9] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
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
            <DialogTitle style={{ ...barlow, fontSize: '22px', fontWeight: 700, color: '#0D1F33', marginBottom: '8px' }}>¿Cerrar sesión?</DialogTitle>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>Vas a salir de tu cuenta. Tus datos quedarán guardados.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>CANCELAR</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => navigate('/')} style={{ ...barlow, letterSpacing: '1px' }}>SALIR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Shared sub-components ── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[#64748B]">{icon}</span>
        <span style={{ ...barlow, fontSize: '12px', letterSpacing: '1.5px', color: '#64748B' }}>{title}</span>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0]">{children}</div>
    </div>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <button onClick={onPress} className="w-full flex items-center justify-between px-4 py-3.5">
      <span style={{ fontSize: '15px', color: '#0D1F33' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '14px', color: '#64748B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <ChevronRight className="size-4 text-[#CBD5E1] flex-shrink-0" />
      </div>
    </button>
  );
}

function SwitchRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 pr-3">
        <div style={{ fontSize: '15px', color: '#0D1F33' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#F4F7FB] mx-4" />;
}

function RolePill({ role, small }: { role: AccessRole; small?: boolean }) {
  const map: Record<AccessRole, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: '#1E6FD9', bg: '#1E6FD918' },
    coach: { label: 'Entrenador', color: '#D97706', bg: '#F59E0B18' },
    assistant: { label: 'Asistente', color: '#64748B', bg: '#64748B18' },
  };
  const { label, color, bg } = map[role];
  return (
    <span className="rounded-full px-2.5 py-0.5" style={{ ...barlow, fontSize: small ? '11px' : '12px', letterSpacing: '0.5px', color, background: bg, fontWeight: 600 }}>
      {label}
    </span>
  );
}
