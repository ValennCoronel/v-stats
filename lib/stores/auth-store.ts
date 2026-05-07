"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  isHydrated: boolean

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setHydrated: () => void

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: () => set({ isHydrated: true }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()

          if (!res.ok) {
            set({ isLoading: false })
            return { success: false, error: data.error || "Login failed" }
          }

          set({ user: data.user, isLoading: false })
          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: "Network error" }
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true })
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName }),
          })

          const data = await res.json()

          if (!res.ok) {
            set({ isLoading: false })
            return { success: false, error: data.error || "Registration failed" }
          }

          set({ user: data.user, isLoading: false })
          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: "Network error" }
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" })
        } catch {
          // Continue with local cleanup even if API fails
        }
        set({ user: null })
      },

      checkAuth: async () => {
        try {
          const res = await fetch("/api/auth/me")
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user })
          } else {
            set({ user: null })
          }
        } catch {
          // Offline — keep cached user
        }
      },
    }),
    {
      name: "vstats-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
