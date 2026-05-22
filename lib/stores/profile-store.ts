"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export type AccessRole = "admin" | "coach" | "assistant"

export type Team = {
  id: string
  name: string
  clubId: string
  players: number // computed length
  matches: number // computed length
  record: string
}

export type ClubProfile = {
  id: string
  name: string
  city: string
  role: AccessRole
  color: string
  teams: Team[]
}

export type Coach = {
  name: string
  email: string
  avatarSrc: string | null
}

interface ProfileState {
  coach: Coach
  profiles: ClubProfile[]
  activeProfileId: string | null
  isLoading: boolean
}

interface ProfileActions {
  updateCoach: (data: Partial<Coach>) => void
  switchProfile: (id: string) => void
  fetchProfiles: () => Promise<void>
  addProfileLocal: (data: ClubProfile) => void
  updateProfileLocal: (id: string, data: Partial<ClubProfile>) => void
  deleteProfileLocal: (id: string) => void
  addTeamLocal: (profileId: string, team: Team) => void
  syncCoachFromAuth: (name: string, email: string) => void
}

type ProfileStore = ProfileState & ProfileActions & {
  activeProfile: ClubProfile | null
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    immer((set, get) => ({
      coach: {
        name: "",
        email: "",
        avatarSrc: null,
      },
      profiles: [],
      activeProfileId: null,
      isLoading: false,

      get activeProfile() {
        const state = get()
        if (!state.activeProfileId && state.profiles.length > 0) {
          return state.profiles[0]
        }
        return state.profiles.find((p) => p.id === state.activeProfileId) || (state.profiles.length > 0 ? state.profiles[0] : null)
      },

      fetchProfiles: async () => {
        set({ isLoading: true })
        try {
          console.log("Fetching profiles...")
          const res = await fetch("/api/clubs", { cache: "no-store" })
          if (res.ok) {
            const data = await res.json()
            console.log("Fetched clubs from API:", data.clubs)
            const clubs = data.clubs.map((c: any) => ({
              id: c.id,
              name: c.name,
              city: c.city,
              role: c.role,
              color: c.color,
              teams: c.teams?.map((t: any) => ({
                id: t.id,
                clubId: t.clubId,
                name: t.name,
                players: 0,
                matches: 0,
                record: "0-0",
              })) || [],
            }))
            
            set((state) => {
              console.log("Setting profiles in state:", clubs)
              state.profiles = clubs
              if (!state.activeProfileId && clubs.length > 0) {
                state.activeProfileId = clubs[0].id
              }
              state.isLoading = false
            })
          } else {
            console.error("API error fetching clubs:", res.status)
            set({ isLoading: false })
          }
        } catch (error) {
          console.error("Failed to fetch clubs:", error)
          set({ isLoading: false })
        }
      },

      updateCoach: (data) => {
        set((state) => {
          Object.assign(state.coach, data)
        })
      },

      syncCoachFromAuth: (name, email) => {
        set((state) => {
          if (name) state.coach.name = name
          if (email) state.coach.email = email
        })
      },

      switchProfile: (id) => {
        set((state) => {
          state.activeProfileId = id
        })
      },

      addProfileLocal: (club) => {
        set((state) => {
          state.profiles.push(club)
          state.activeProfileId = club.id
        })
      },

      updateProfileLocal: (id, data) => {
        set((state) => {
          const profile = state.profiles.find((p) => p.id === id)
          if (profile) {
            Object.assign(profile, data)
          }
        })
      },

      deleteProfileLocal: (id) => {
        set((state) => {
          state.profiles = state.profiles.filter((p) => p.id !== id)
          if (state.activeProfileId === id && state.profiles.length > 0) {
            state.activeProfileId = state.profiles[0].id
          } else if (state.profiles.length === 0) {
            state.activeProfileId = null
          }
        })
      },

      addTeamLocal: (profileId, team) => {
        set((state) => {
          const profile = state.profiles.find((p) => p.id === profileId)
          if (profile) {
            profile.teams.push(team)
          }
        })
      },
    })),
    {
      name: "vstats-profile-v2",
    }
  )
)
