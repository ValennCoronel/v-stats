"use client"

import { BottomNav } from "@/components/v-stats/bottom-nav"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useProfileStore } from "@/lib/stores/profile-store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const syncCoachFromAuth = useProfileStore((s) => s.syncCoachFromAuth)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Sync auth user info to profile store
  useEffect(() => {
    if (user) {
      syncCoachFromAuth(user.displayName || "", user.email)
    }
  }, [user, syncCoachFromAuth])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/login")
    }
  }, [isHydrated, user, router])

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FB]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1E6FD9] border-t-transparent" />
          <p className="text-[#64748B]">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Hide bottom nav on live match pages
  const isLiveMatch = pathname.startsWith("/match/")
  const showBottomNav = !isLiveMatch

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
