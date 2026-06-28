import { prisma } from "@/lib/prisma"

type SelectedTeam = {
  id: string
  name: string
} | null

export type TeamDashboardStats = {
  totalMatches: number
  winRate: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  totalPoints: number
  selectedTeam: SelectedTeam
  teamBreakdown: {
    id: string
    name: string
    matches: number
    wins: number
    losses: number
    winRate: number
  }[]
  attacks: number
  defenses: number
  blocks: number
  aces: number
  errors: number
  attackErrors: number
  receptionErrors: number
  serveErrors: number
  positiveActions: number
  negativeActions: number
  totalActions: number
  avgActionsPerPoint: number
  pointsPerMatch: number
  topScorers: {
    id: string
    name: string
    number: number
    position: string
    avatarUrl: string | null
    puntos: number
    ataques: number
    bloqueos: number
    aces: number
    recepciones: number
    errores: number
    eficiencia: number
    matchesPlayed: number
    recentMatchesPlayed: number
    recentWins: number
    recentLosses: number
    recentPuntos: number
    recentBloqueos: number
    recentRecepciones: number
    recentErrores: number
    recentEficiencia: number
    recentForm: {
      matchId: string
      opponent: string
      date: Date
      result: string | null
      puntos: number
      eficiencia: number
    }[]
  }[]
  recentMatches: {
    id: string
    opponent: string
    date: Date
    result: string | null
    finalScore: string | null
    opponentTeam: { id: string; name: string; logoUrl: string | null } | null
    tournamentRef: { id: string; name: string; logoUrl: string | null } | null
  }[]
}

export async function getTeamDashboardStats(clubId: string, teamId?: string): Promise<TeamDashboardStats | null> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { teams: true },
  })

  if (!club) {
    return null
  }

  const requestedTeam = teamId ? club.teams.find((team) => team.id === teamId) : null
  if (teamId && !requestedTeam) {
    return null
  }

  const selectedTeam = requestedTeam ? { id: requestedTeam.id, name: requestedTeam.name } : null
  const teamIds = selectedTeam ? [selectedTeam.id] : club.teams.map((team) => team.id)

  if (teamIds.length === 0) {
    return {
      totalMatches: 0,
      winRate: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      totalPoints: 0,
      topScorers: [],
      recentMatches: [],
      teamBreakdown: club.teams.map((team) => ({
        id: team.id,
        name: team.name,
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      })),
      selectedTeam,
      attacks: 0,
      defenses: 0,
      blocks: 0,
      aces: 0,
      errors: 0,
      attackErrors: 0,
      receptionErrors: 0,
      serveErrors: 0,
      positiveActions: 0,
      negativeActions: 0,
      totalActions: 0,
      avgActionsPerPoint: 0,
      pointsPerMatch: 0,
    }
  }

  const matches = await prisma.match.findMany({
    where: { teamId: { in: teamIds }, status: "finished" },
    orderBy: { date: "desc" },
  })

  const totalMatches = matches.length
  const wins = matches.filter((match) => match.result === "WIN").length
  const losses = matches.filter((match) => match.result === "LOSS").length
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  let setsWon = 0
  let setsLost = 0
  for (const match of matches) {
    if (!match.finalScore) continue
    const parts = match.finalScore.split("-")
    if (parts.length !== 2) continue
    setsWon += parseInt(parts[0], 10) || 0
    setsLost += parseInt(parts[1], 10) || 0
  }

  const allClubMatches = await prisma.match.findMany({
    where: { teamId: { in: club.teams.map((team) => team.id) }, status: "finished" },
    select: { teamId: true, result: true },
  })

  const teamBreakdown = club.teams.map((team) => {
    const teamMatches = allClubMatches.filter((match) => match.teamId === team.id)
    const teamWins = teamMatches.filter((match) => match.result === "WIN").length
    const teamLosses = teamMatches.filter((match) => match.result === "LOSS").length

    return {
      id: team.id,
      name: team.name,
      matches: teamMatches.length,
      wins: teamWins,
      losses: teamLosses,
      winRate: teamMatches.length > 0 ? Math.round((teamWins / teamMatches.length) * 100) : 0,
    }
  })

  const playerStats = await prisma.playerMatchStats.groupBy({
    by: ["playerId"],
    _sum: {
      puntos: true,
      ataquesPositivos: true,
      bloqueosPositivos: true,
      aces: true,
      erroresAtaque: true,
      erroresRecepcion: true,
      erroresSaque: true,
      bloqueosErrados: true,
      erroresTacticos: true,
      defensasPositivas: true,
      ventajasTacticas: true,
    },
    _count: {
      matchId: true,
    },
    where: {
      match: { teamId: { in: teamIds }, status: "finished" },
    },
  })

  const playerMatchRows = await prisma.playerMatchStats.findMany({
    where: {
      match: { teamId: { in: teamIds }, status: "finished" },
    },
    include: {
      match: {
        select: {
          id: true,
          date: true,
          result: true,
          opponent: true,
          opponentTeam: { select: { name: true } },
        },
      },
    },
  })

  const playerIds = playerStats.map((stat) => stat.playerId)
  const playersInfo = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, name: true, number: true, position: true, avatarUrl: true },
  })

  const playerMap = new Map(playersInfo.map((player) => [player.id, player]))
  const recentRowsByPlayer = new Map<string, typeof playerMatchRows>()

  for (const row of [...playerMatchRows].sort((a, b) => b.match.date.getTime() - a.match.date.getTime())) {
    const currentRows = recentRowsByPlayer.get(row.playerId) || []
    if (currentRows.length < 3) {
      currentRows.push(row)
      recentRowsByPlayer.set(row.playerId, currentRows)
    }
  }

  const topScorers = playerStats
    .map((stat) => {
      const player = playerMap.get(stat.playerId)
      const totalPositive =
        (stat._sum.puntos || 0) +
        (stat._sum.ataquesPositivos || 0) +
        (stat._sum.bloqueosPositivos || 0) +
        (stat._sum.aces || 0) +
        (stat._sum.defensasPositivas || 0) +
        (stat._sum.ventajasTacticas || 0)
      const totalNegative =
        (stat._sum.erroresAtaque || 0) +
        (stat._sum.erroresRecepcion || 0) +
        (stat._sum.erroresSaque || 0) +
        (stat._sum.bloqueosErrados || 0) +
        (stat._sum.erroresTacticos || 0)
      const total = totalPositive + totalNegative
      const recentRows = recentRowsByPlayer.get(stat.playerId) || []
      const recentForm = recentRows.map((row) => {
        const recentPositive =
          row.puntos +
          row.ataquesPositivos +
          row.bloqueosPositivos +
          row.aces +
          row.defensasPositivas +
          row.ventajasTacticas
        const recentNegative =
          row.erroresAtaque +
          row.erroresRecepcion +
          row.erroresSaque +
          row.bloqueosErrados +
          row.erroresTacticos

        return {
          matchId: row.matchId,
          opponent: row.match.opponentTeam?.name || row.match.opponent,
          date: row.match.date,
          result: row.match.result,
          puntos: row.puntos,
          eficiencia: recentPositive + recentNegative > 0 ? Math.round((recentPositive / (recentPositive + recentNegative)) * 100) : 0,
        }
      })
      const recentWins = recentRows.filter((row) => row.match.result === "WIN").length
      const recentLosses = recentRows.filter((row) => row.match.result === "LOSS").length
      const recentPuntos = recentRows.reduce((sum, row) => sum + row.puntos, 0)
      const recentBloqueos = recentRows.reduce((sum, row) => sum + row.bloqueosPositivos, 0)
      const recentRecepciones = recentRows.reduce((sum, row) => sum + row.defensasPositivas, 0)
      const recentErrores = recentRows.reduce(
        (sum, row) =>
          sum + row.erroresAtaque + row.erroresRecepcion + row.erroresSaque + row.bloqueosErrados + row.erroresTacticos,
        0,
      )
      const recentPositiveActions = recentRows.reduce(
        (sum, row) =>
          sum + row.puntos + row.ataquesPositivos + row.bloqueosPositivos + row.aces + row.defensasPositivas + row.ventajasTacticas,
        0,
      )
      const recentEficiencia =
        recentPositiveActions + recentErrores > 0 ? Math.round((recentPositiveActions / (recentPositiveActions + recentErrores)) * 100) : 0

      return {
        id: player?.id || stat.playerId,
        name: player?.name || "",
        number: player?.number || 0,
        position: player?.position || "",
        avatarUrl: player?.avatarUrl || null,
        puntos: stat._sum.puntos || 0,
        ataques: stat._sum.ataquesPositivos || 0,
        bloqueos: stat._sum.bloqueosPositivos || 0,
        aces: stat._sum.aces || 0,
        recepciones: stat._sum.defensasPositivas || 0,
        errores: totalNegative,
        eficiencia: total > 0 ? Math.round((totalPositive / total) * 100) : 0,
        matchesPlayed: stat._count.matchId,
        recentMatchesPlayed: recentRows.length,
        recentWins,
        recentLosses,
        recentPuntos,
        recentBloqueos,
        recentRecepciones,
        recentErrores,
        recentEficiencia,
        recentForm,
      }
    })
    .filter((player) => player.name)
    .sort((a, b) => b.puntos - a.puntos)

  const attacks = playerStats.reduce((sum, stat) => sum + (stat._sum.ataquesPositivos || 0), 0)
  const defenses = playerStats.reduce((sum, stat) => sum + (stat._sum.defensasPositivas || 0), 0)
  const blocks = playerStats.reduce((sum, stat) => sum + (stat._sum.bloqueosPositivos || 0), 0)
  const aces = playerStats.reduce((sum, stat) => sum + (stat._sum.aces || 0), 0)
  const tacticalAdvantages = playerStats.reduce((sum, stat) => sum + (stat._sum.ventajasTacticas || 0), 0)

  const attackErrors = playerStats.reduce((sum, stat) => sum + (stat._sum.erroresAtaque || 0), 0)
  const receptionErrors = playerStats.reduce((sum, stat) => sum + (stat._sum.erroresRecepcion || 0), 0)
  const serveErrors = playerStats.reduce((sum, stat) => sum + (stat._sum.erroresSaque || 0), 0)

  const errors = playerStats.reduce(
    (sum, stat) =>
      sum +
      (stat._sum.erroresAtaque || 0) +
      (stat._sum.erroresRecepcion || 0) +
      (stat._sum.erroresSaque || 0) +
      (stat._sum.bloqueosErrados || 0) +
      (stat._sum.erroresTacticos || 0),
    0,
  )

  const positiveActions = attacks + defenses + blocks + aces + tacticalAdvantages
  const negativeActions = errors
  const totalActions = positiveActions + negativeActions
  const totalPoints = topScorers.reduce((sum, player) => sum + player.puntos, 0)
  const avgActionsPerPoint = totalPoints > 0 ? Number((totalActions / totalPoints).toFixed(1)) : 0
  const pointsPerMatch = totalMatches > 0 ? Number((totalPoints / totalMatches).toFixed(1)) : 0

  const recentMatchesRaw = await prisma.match.findMany({
    where: { teamId: { in: teamIds }, status: "finished" },
    orderBy: { date: "desc" },
    take: 5,
    include: {
      opponentTeam: { select: { id: true, name: true, logoUrl: true } },
      tournamentRef: { select: { id: true, name: true, logoUrl: true } },
    },
  })

  const recentMatches = recentMatchesRaw.map((match) => ({
    id: match.id,
    opponent: match.opponent,
    date: match.date,
    result: match.result,
    finalScore: match.finalScore,
    opponentTeam: match.opponentTeam,
    tournamentRef: match.tournamentRef,
  }))

  return {
    totalMatches,
    winRate,
    wins,
    losses,
    setsWon,
    setsLost,
    totalPoints,
    selectedTeam,
    teamBreakdown,
    attacks,
    defenses,
    blocks,
    aces,
    errors,
    attackErrors,
    receptionErrors,
    serveErrors,
    positiveActions,
    negativeActions,
    totalActions,
    avgActionsPerPoint,
    pointsPerMatch,
    topScorers,
    recentMatches,
  }
}
