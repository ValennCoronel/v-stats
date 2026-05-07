// Volleyball action types for V-Stats
// These are the specific actions used in the Action Pad

export const VOLLEYBALL_ACTIONS = {
  // Positive actions
  punto: { label: "Punto", shortLabel: "PTO", type: "positive" as const, color: "success" },
  ataque_positivo: { label: "Ataque +", shortLabel: "ATQ+", type: "positive" as const, color: "success" },
  ventaja_tactica: { label: "Ventaja Táctica", shortLabel: "VT", type: "positive" as const, color: "success" },
  defensa_positiva: { label: "Defensa +", shortLabel: "DEF+", type: "positive" as const, color: "success" },
  bloqueo_positivo: { label: "Bloqueo +", shortLabel: "BLQ+", type: "positive" as const, color: "success" },
  ace: { label: "Ace", shortLabel: "ACE", type: "positive" as const, color: "success" },
  // Negative actions
  bloqueo_errado: { label: "Bloqueo Errado", shortLabel: "BLQ-", type: "negative" as const, color: "destructive" },
  error_ataque: { label: "Error Ataque", shortLabel: "EA", type: "negative" as const, color: "destructive" },
  error_recepcion: { label: "Error Recepción", shortLabel: "ER", type: "negative" as const, color: "destructive" },
  error_saque: { label: "Error Saque", shortLabel: "ES", type: "negative" as const, color: "destructive" },
  error_tactico: { label: "Error Táctico", shortLabel: "ET", type: "negative" as const, color: "destructive" },
} as const

export type VolleyballActionKey = keyof typeof VOLLEYBALL_ACTIONS

export const POSITIVE_ACTIONS: VolleyballActionKey[] = [
  "punto",
  "ataque_positivo",
  "ventaja_tactica",
  "defensa_positiva",
  "bloqueo_positivo",
  "ace",
]

export const NEGATIVE_ACTIONS: VolleyballActionKey[] = [
  "bloqueo_errado",
  "error_ataque",
  "error_recepcion",
  "error_saque",
  "error_tactico",
]

export const POSITIONS = [
  "SETTER",
  "OUTSIDE_HITTER",
  "OPPOSITE_HITTER",
  "MIDDLE_BLOCKER",
  "LIBERO",
  "DEFENSIVE_SPECIALIST",
] as const

export type Position = (typeof POSITIONS)[number]

export const POSITION_LABELS: Record<Position, string> = {
  SETTER: "Armador",
  OUTSIDE_HITTER: "Punta Receptor",
  OPPOSITE_HITTER: "Opuesto",
  MIDDLE_BLOCKER: "Central",
  LIBERO: "Líbero",
  DEFENSIVE_SPECIALIST: "Defensor",
}
