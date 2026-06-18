import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type ActionTotals = {
  puntos: number
  ataques: number
  bloqueos: number
  aces: number
  defensas: number
  ventajas: number
  erroresAtaque: number
  erroresRecepcion: number
  erroresSaque: number
  bloqueosErrados: number
  erroresTacticos: number
}

const EMPTY_TOTALS: ActionTotals = {
  puntos: 0,
  ataques: 0,
  bloqueos: 0,
  aces: 0,
  defensas: 0,
  ventajas: 0,
  erroresAtaque: 0,
  erroresRecepcion: 0,
  erroresSaque: 0,
  bloqueosErrados: 0,
  erroresTacticos: 0,
}

function getNegativeActions(totals: ActionTotals) {
  return totals.erroresAtaque + totals.erroresRecepcion + totals.erroresSaque + totals.bloqueosErrados + totals.erroresTacticos
}

function getPositiveActions(totals: ActionTotals) {
  return totals.puntos + totals.ataques + totals.bloqueos + totals.aces + totals.defensas + totals.ventajas
}

function getEfficiency(positiveActions: number, negativeActions: number) {
  const totalActions = positiveActions + negativeActions
  return totalActions > 0 ? Math.round((positiveActions / totalActions) * 100) : 0
}

function readSetScore(finalScore: string | null) {
  if (!finalScore) return { setsWon: 0, setsLost: 0 }
  const [won, lost] = finalScore.split("-").map((value) => parseInt(value, 10))
  return {
    setsWon: Number.isFinite(won) ? won : 0,
    setsLost: Number.isFinite(lost) ? lost : 0,
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")
    const playerId = searchParams.get("playerId")
    const teamId = searchParams.get("teamId")

    if (!clubId || !playerId) {
      return NextResponse.json({ error: "clubId y playerId son requeridos" }, { status: 400 })
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: { teams: { select: { id: true, name: true } } },
    })

    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { teams: { select: { id: true, name: true } } },
    })

    if (!player || player.clubId !== clubId) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    const selectedTeam = teamId ? club.teams.find((team: any) => team.id === teamId) : null
    if (teamId && !selectedTeam) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const statsRows = await prisma.playerMatchStats.findMany({
      where: {
        playerId,
        match: teamId
          ? { teamId, status: "finished" }
          : { team: { clubId }, status: "finished" },
      },
      include: {
        match: {
          include: {
            team: { select: { id: true, name: true } },
            opponentTeam: { select: { id: true, name: true, logoUrl: true } },
            tournamentRef: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    })

    const orderedRows = [...statsRows].sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime())

    const totals = orderedRows.reduce<ActionTotals>((acc, row) => ({
      puntos: acc.puntos + row.puntos,
      ataques: acc.ataques + row.ataquesPositivos,
      bloqueos: acc.bloqueos + row.bloqueosPositivos,
      aces: acc.aces + row.aces,
      defensas: acc.defensas + row.defensasPositivas,
      ventajas: acc.ventajas + row.ventajasTacticas,
      erroresAtaque: acc.erroresAtaque + row.erroresAtaque,
      erroresRecepcion: acc.erroresRecepcion + row.erroresRecepcion,
      erroresSaque: acc.erroresSaque + row.erroresSaque,
      bloqueosErrados: acc.bloqueosErrados + row.bloqueosErrados,
      erroresTacticos: acc.erroresTacticos + row.erroresTacticos,
    }), { ...EMPTY_TOTALS })

    const totalMatches = orderedRows.length
    const wins = orderedRows.filter((row) => row.match.result === "WIN").length
    const losses = orderedRows.filter((row) => row.match.result === "LOSS").length
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    const setRecord = orderedRows.reduce((acc, row) => {
      const current = readSetScore(row.match.finalScore)
      return {
        setsWon: acc.setsWon + current.setsWon,
        setsLost: acc.setsLost + current.setsLost,
      }
    }, { setsWon: 0, setsLost: 0 })

    const negativeActions = getNegativeActions(totals)
    const positiveActions = getPositiveActions(totals)
    const totalActions = positiveActions + negativeActions
    const efficiency = getEfficiency(positiveActions, negativeActions)

    const matchTimeline = orderedRows.map((row) => {
      const rowTotals: ActionTotals = {
        puntos: row.puntos,
        ataques: row.ataquesPositivos,
        bloqueos: row.bloqueosPositivos,
        aces: row.aces,
        defensas: row.defensasPositivas,
        ventajas: row.ventajasTacticas,
        erroresAtaque: row.erroresAtaque,
        erroresRecepcion: row.erroresRecepcion,
        erroresSaque: row.erroresSaque,
        bloqueosErrados: row.bloqueosErrados,
        erroresTacticos: row.erroresTacticos,
      }
      const rowNegative = getNegativeActions(rowTotals)
      const rowPositive = getPositiveActions(rowTotals)

      return {
        matchId: row.matchId,
        teamId: row.match.teamId,
        teamName: row.match.team.name,
        opponent: row.match.opponentTeam?.name || row.match.opponent,
        tournament: row.match.tournamentRef?.name || row.match.tournament,
        date: row.match.date,
        result: row.match.result,
        finalScore: row.match.finalScore,
        puntos: row.puntos,
        ataques: row.ataquesPositivos,
        bloqueos: row.bloqueosPositivos,
        aces: row.aces,
        defensas: row.defensasPositivas,
        ventajas: row.ventajasTacticas,
        errores: rowNegative,
        eficiencia: getEfficiency(rowPositive, rowNegative),
        accionesTotales: rowPositive + rowNegative,
      }
    })

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        dni: player.dni,
        number: player.number,
        position: player.position,
        avatarUrl: player.avatarUrl,
        isActive: player.isActive,
        teams: player.teams.map((team: any) => ({
          id: team.id,
          name: team.name,
        })),
      },
      selectedTeam: selectedTeam ? { id: selectedTeam.id, name: selectedTeam.name } : null,
      totalMatches,
      wins,
      losses,
      winRate,
      setsWon: setRecord.setsWon,
      setsLost: setRecord.setsLost,
      totals,
      positiveActions,
      negativeActions,
      totalActions,
      efficiency,
      pointsPerMatch: totalMatches > 0 ? Number((totals.puntos / totalMatches).toFixed(1)) : 0,
      actionsPerMatch: totalMatches > 0 ? Number((totalActions / totalMatches).toFixed(1)) : 0,
      errorsPerMatch: totalMatches > 0 ? Number((negativeActions / totalMatches).toFixed(1)) : 0,
      matchTimeline,
    })
  } catch (error) {
    console.error("Player stats GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
