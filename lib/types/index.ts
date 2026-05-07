// Shared types for V-Stats

export type { VolleyballActionKey, Position } from "./volleyball"

export type Role = "ADMIN" | "COACH" | "PLAYER"

export interface User {
  id: string
  email: string
  role: Role
  displayName: string | null
}

export interface Team {
  id: string
  name: string
  logoUrl: string | null
  ownerId: string
}

export interface Player {
  id: string
  teamId: string
  name: string
  number: number
  position: string
  avatarUrl: string | null
  isActive: boolean
}

export interface MatchSetup {
  opponent: string
  tournament: string
  date: Date
}

export interface SetScore {
  us: number
  them: number
}

export interface MatchAction {
  id: string
  playerId: string
  action: string
  set: number
  timestamp: number
}

export interface LiveMatch {
  id: string
  opponent: string
  tournament: string
  date: string
  sets: SetScore[]
  currentSet: number
  status: "live" | "finished"
  actions: MatchAction[]
  selectedPlayerId: string | null
}
