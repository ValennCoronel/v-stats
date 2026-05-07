"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { VolleyballActionKey } from "@/lib/types/volleyball"

// ─── Types ────────────────────────────────────────────────────

export interface SetScore {
  us: number
  them: number
}

export interface RecordedAction {
  id: string
  playerId: string
  playerName: string
  playerNumber: number
  action: VolleyballActionKey
  set: number
  timestamp: number
}

export interface MatchPlayer {
  id: string
  name: string
  number: number
  position: string
  isLibero?: boolean
  avatarUrl?: string | null
}

// ─── State ────────────────────────────────────────────────────

interface MatchState {
  // Match info
  matchId: string | null
  opponent: string
  opponentId: string | null
  tournament: string
  tournamentId: string | null
  matchDate: string | null
  status: "idle" | "setup" | "live" | "finished"

  // Set configuration
  pointsPerSet: number        // default 25
  pointsLastSet: number       // default 15 (5th set)
  minDifference: number       // default 2

  // Score tracking
  sets: SetScore[]
  currentSet: number

  // Roster — court, bench, liberos
  allPlayers: MatchPlayer[]    // full roster for the match
  courtPlayers: MatchPlayer[]  // 6 on court (index 0-5 = positions)
  benchPlayers: MatchPlayer[]  // substitutes
  liberos: MatchPlayer[]       // max 2

  // Substitution mode
  substitutionMode: "none" | "bench" | "libero"
  substitutionSourceId: string | null

  // Action Pad state
  selectedPlayerId: string | null

  // Action log (append-only)
  actions: RecordedAction[]
}

interface MatchActions {
  // Match lifecycle
  startMatch: (config: {
    matchId: string
    opponent: string
    opponentId: string | null
    tournament: string
    tournamentId: string | null
    matchDate: string
    pointsPerSet: number
    pointsLastSet: number
    minDifference: number
    courtPlayers: MatchPlayer[]
    benchPlayers: MatchPlayer[]
    liberos: MatchPlayer[]
    allPlayers: MatchPlayer[]
  }) => void
  endMatch: () => void
  resetMatch: () => void

  // Action Pad
  selectPlayer: (playerId: string | null) => void
  recordAction: (action: VolleyballActionKey) => void

  // Score
  addPointUs: () => void
  addPointRival: () => void
  removePointUs: () => void
  removePointRival: () => void

  // Set
  nextSet: () => void

  // Substitutions
  startSubstitution: (benchPlayerId: string) => void
  executeSubstitution: (courtPlayerId: string) => void
  startLiberoSub: (liberoId: string) => void
  executeLiberoSub: (courtPlayerId: string) => void
  cancelSubstitution: () => void

  // Court reorder (drag-and-drop)
  reorderCourtPlayers: (fromIndex: number, toIndex: number) => void

  // Undo
  undoLastAction: () => void
}

type MatchStore = MatchState & MatchActions

const initialState: MatchState = {
  matchId: null,
  opponent: "",
  opponentId: null,
  tournament: "",
  tournamentId: null,
  matchDate: null,
  status: "idle",
  pointsPerSet: 25,
  pointsLastSet: 15,
  minDifference: 2,
  sets: [{ us: 0, them: 0 }],
  currentSet: 0,
  allPlayers: [],
  courtPlayers: [],
  benchPlayers: [],
  liberos: [],
  substitutionMode: "none",
  substitutionSourceId: null,
  selectedPlayerId: null,
  actions: [],
}

// ─── Helpers ──────────────────────────────────────────────────

function checkSetWon(
  score: SetScore,
  currentSet: number,
  pointsPerSet: number,
  pointsLastSet: number,
  minDifference: number,
  totalSets: number
): "us" | "them" | null {
  // 5th set (index 4) uses pointsLastSet
  const target = currentSet >= 4 ? pointsLastSet : pointsPerSet
  const diff = Math.abs(score.us - score.them)

  if (score.us >= target && diff >= minDifference && score.us > score.them) {
    return "us"
  }
  if (score.them >= target && diff >= minDifference && score.them > score.us) {
    return "them"
  }
  return null
}

// ─── Store ────────────────────────────────────────────────────

export const useMatchStore = create<MatchStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      startMatch: (config) => {
        set((state) => {
          state.matchId = config.matchId
          state.opponent = config.opponent
          state.opponentId = config.opponentId
          state.tournament = config.tournament
          state.tournamentId = config.tournamentId
          state.matchDate = config.matchDate
          state.pointsPerSet = config.pointsPerSet
          state.pointsLastSet = config.pointsLastSet
          state.minDifference = config.minDifference
          state.allPlayers = config.allPlayers
          state.courtPlayers = config.courtPlayers
          state.benchPlayers = config.benchPlayers
          state.liberos = config.liberos
          state.status = "live"
          state.sets = [{ us: 0, them: 0 }]
          state.currentSet = 0
          state.selectedPlayerId = null
          state.substitutionMode = "none"
          state.substitutionSourceId = null
          state.actions = []
        })
      },

      endMatch: () => {
        set((state) => {
          state.status = "finished"
          state.selectedPlayerId = null
          state.substitutionMode = "none"
          state.substitutionSourceId = null
        })
      },

      resetMatch: () => {
        set(initialState)
      },

      selectPlayer: (playerId) => {
        set((state) => {
          // Cancel substitution if selecting a court player normally
          if (state.substitutionMode !== "none" && playerId) return
          state.selectedPlayerId = playerId
        })
      },

      recordAction: (action) => {
        const state = get()
        if (!state.selectedPlayerId) return

        // Find player in court or liberos (active players can record actions)
        const player =
          state.courtPlayers.find((p) => p.id === state.selectedPlayerId) ||
          state.liberos.find((p) => p.id === state.selectedPlayerId)
        if (!player) return

        const newAction: RecordedAction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          playerId: state.selectedPlayerId,
          playerName: player.name,
          playerNumber: player.number,
          action,
          set: state.currentSet,
          timestamp: Date.now(),
        }

        set((draft) => {
          draft.actions.push(newAction)
          draft.selectedPlayerId = null

          // Auto-increment "us" score on "punto" or "ace"
          if (action === "punto" || action === "ace") {
            draft.sets[draft.currentSet].us++

            // Check if set is won
            const winner = checkSetWon(
              draft.sets[draft.currentSet],
              draft.currentSet,
              draft.pointsPerSet,
              draft.pointsLastSet,
              draft.minDifference,
              draft.sets.length
            )
            if (winner === "us") {
              // Auto-advance to next set
              draft.currentSet++
              if (!draft.sets[draft.currentSet]) {
                draft.sets.push({ us: 0, them: 0 })
              }
            }
          }
        })
      },

      addPointUs: () => {
        set((draft) => {
          draft.sets[draft.currentSet].us++

          // Check if set is won
          const winner = checkSetWon(
            draft.sets[draft.currentSet],
            draft.currentSet,
            draft.pointsPerSet,
            draft.pointsLastSet,
            draft.minDifference,
            draft.sets.length
          )
          if (winner === "us") {
            // Auto-advance to next set
            draft.currentSet++
            if (!draft.sets[draft.currentSet]) {
              draft.sets.push({ us: 0, them: 0 })
            }
          }
        })
      },

      addPointRival: () => {
        set((draft) => {
          draft.sets[draft.currentSet].them++

          // Check if set is won by rival
          const winner = checkSetWon(
            draft.sets[draft.currentSet],
            draft.currentSet,
            draft.pointsPerSet,
            draft.pointsLastSet,
            draft.minDifference,
            draft.sets.length
          )
          if (winner === "them") {
            draft.currentSet++
            if (!draft.sets[draft.currentSet]) {
              draft.sets.push({ us: 0, them: 0 })
            }
          }
        })
      },

      removePointUs: () => {
        set((draft) => {
          if (draft.sets[draft.currentSet].us > 0) {
            draft.sets[draft.currentSet].us--
          }
        })
      },

      removePointRival: () => {
        set((draft) => {
          if (draft.sets[draft.currentSet].them > 0) {
            draft.sets[draft.currentSet].them--
          }
        })
      },

      nextSet: () => {
        set((state) => {
          state.currentSet++
          if (!state.sets[state.currentSet]) {
            state.sets.push({ us: 0, them: 0 })
          }
        })
      },

      // ─── Substitutions ──────────────────────────────────────

      startSubstitution: (benchPlayerId) => {
        set((state) => {
          state.substitutionMode = "bench"
          state.substitutionSourceId = benchPlayerId
          state.selectedPlayerId = null
        })
      },

      executeSubstitution: (courtPlayerId) => {
        set((state) => {
          if (state.substitutionMode !== "bench" || !state.substitutionSourceId) return

          const benchIdx = state.benchPlayers.findIndex(
            (p) => p.id === state.substitutionSourceId
          )
          const courtIdx = state.courtPlayers.findIndex(
            (p) => p.id === courtPlayerId
          )

          if (benchIdx === -1 || courtIdx === -1) return

          // Swap
          const temp = state.courtPlayers[courtIdx]
          state.courtPlayers[courtIdx] = state.benchPlayers[benchIdx]
          state.benchPlayers[benchIdx] = temp

          state.substitutionMode = "none"
          state.substitutionSourceId = null
        })
      },

      startLiberoSub: (liberoId) => {
        set((state) => {
          state.substitutionMode = "libero"
          state.substitutionSourceId = liberoId
          state.selectedPlayerId = null
        })
      },

      executeLiberoSub: (courtPlayerId) => {
        set((state) => {
          if (state.substitutionMode !== "libero" || !state.substitutionSourceId) return

          // Libero can only replace back-row (positions 3, 4, 5 → indices 3, 4, 5)
          const courtIdx = state.courtPlayers.findIndex(
            (p) => p.id === courtPlayerId
          )

          // Back row = indices 3, 4, 5 (positions 4, 5, 6 in volleyball)
          if (courtIdx === -1 || courtIdx < 3) {
            // Can't substitute front-row
            state.substitutionMode = "none"
            state.substitutionSourceId = null
            return
          }

          const liberoIdx = state.liberos.findIndex(
            (p) => p.id === state.substitutionSourceId
          )
          if (liberoIdx === -1) return

          // Swap libero with court player
          const temp = state.courtPlayers[courtIdx]
          state.courtPlayers[courtIdx] = state.liberos[liberoIdx]
          state.liberos[liberoIdx] = temp

          state.substitutionMode = "none"
          state.substitutionSourceId = null
        })
      },

      cancelSubstitution: () => {
        set((state) => {
          state.substitutionMode = "none"
          state.substitutionSourceId = null
        })
      },

      // ─── Drag and Drop ─────────────────────────────────────

      reorderCourtPlayers: (fromIndex, toIndex) => {
        set((state) => {
          const players = [...state.courtPlayers]
          const [moved] = players.splice(fromIndex, 1)
          players.splice(toIndex, 0, moved)
          state.courtPlayers = players
        })
      },

      undoLastAction: () => {
        set((state) => {
          const lastAction = state.actions[state.actions.length - 1]
          if (!lastAction) return

          // If last action was "punto" or "ace", also decrement score
          if (lastAction.action === "punto" || lastAction.action === "ace") {
            // Check if we auto-advanced a set
            if (state.currentSet > 0 && state.sets[state.currentSet].us === 0 && state.sets[state.currentSet].them === 0) {
              // We're on a new set that was auto-advanced, go back
              state.sets.pop()
              state.currentSet--
            }
            if (state.sets[state.currentSet].us > 0) {
              state.sets[state.currentSet].us--
            }
          }

          state.actions.pop()
        })
      },
    })),
    {
      name: "vstats-match",
    }
  )
)
