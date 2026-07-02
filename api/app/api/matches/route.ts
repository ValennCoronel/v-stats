import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type IncomingAction = {
  playerId: string
  action: string
  set: number
  timestamp: string
  activePlayerIds?: string[]
}

// GET /api/matches — List matches for a team
// Query params: ?teamId=xxx (required), ?status=finished, ?limit=10
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    if (!teamId) {
      return NextResponse.json({ error: "teamId es requerido" }, { status: 400 })
    }

    // Verify user owns the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { club: true },
    })

    if (!team || team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const whereClause: any = { teamId }
    if (status) {
      whereClause.status = status
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
      include: {
        opponentTeam: { select: { id: true, name: true, logoUrl: true } },
        tournamentRef: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { playerStats: true, actions: true } },
      },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("Matches GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/matches — Create a finished match with stats
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      teamId,
      opponentTeamId,
      tournamentId,
      date,
      result,
      finalScore,
      setScores,
      actions,
      allPlayers,
      opponent,
      tournament,
    } = body

    const typedActions: IncomingAction[] = Array.isArray(actions) ? actions : []
    const rosterPlayerIds = new Set<string>(Array.isArray(allPlayers) ? allPlayers : [])

    if (!teamId) {
      return NextResponse.json({ error: "teamId es requerido" }, { status: 400 })
    }

    // Verify user owns the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { club: true },
    })

    if (!team || team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    for (const action of typedActions) {
      if (!action?.playerId || !rosterPlayerIds.has(action.playerId)) {
        return NextResponse.json(
          { error: "Hay acciones asociadas a jugadoras que no pertenecen al plantel del partido" },
          { status: 400 }
        )
      }

      const activePlayerIds = Array.isArray(action.activePlayerIds) ? action.activePlayerIds : []
      if (activePlayerIds.length === 0 || !activePlayerIds.includes(action.playerId)) {
        return NextResponse.json(
          { error: "Solo se pueden guardar estadísticas de jugadoras que estaban en cancha" },
          { status: 400 }
        )
      }

      if (!activePlayerIds.every((playerId) => rosterPlayerIds.has(playerId))) {
        return NextResponse.json(
          { error: "La formación activa contiene jugadoras fuera del plantel del partido" },
          { status: 400 }
        )
      }
    }

    // Create match with stats in a transaction
    const match = await prisma.$transaction(async (tx: any) => {
      // Create the match record
      const newMatch = await tx.match.create({
        data: {
          teamId: team.id,
          opponent: opponent || "Rival",
          opponentTeamId: opponentTeamId || null,
          tournament: tournament || null,
          tournamentId: tournamentId || null,
          date: new Date(date || new Date()),
          result: result || null,
          finalScore: finalScore || null,
          setScores: setScores || null,
          status: "finished",
        },
      })

      // Aggregate actions into PlayerMatchStats
      if (typedActions.length > 0 && allPlayers) {
        // Build stats map per player
        const statsMap = new Map<string, Record<string, number>>()

        for (const action of typedActions) {
          if (!statsMap.has(action.playerId)) {
            statsMap.set(action.playerId, {
              puntos: 0,
              ataquesPositivos: 0,
              ventajasTacticas: 0,
              defensasPositivas: 0,
              bloqueosPositivos: 0,
              aces: 0,
              bloqueosErrados: 0,
              erroresAtaque: 0,
              erroresRecepcion: 0,
              erroresSaque: 0,
              erroresTacticos: 0,
            })
          }

          const stats = statsMap.get(action.playerId)!
          switch (action.action) {
            case "punto": stats.puntos++; break
            case "ataque_positivo": stats.ataquesPositivos++; break
            case "ventaja_tactica": stats.ventajasTacticas++; break
            case "defensa_positiva": stats.defensasPositivas++; break
            case "bloqueo_positivo": stats.bloqueosPositivos++; break
            case "ace": stats.aces++; break
            case "bloqueo_errado": stats.bloqueosErrados++; break
            case "error_ataque": stats.erroresAtaque++; break
            case "error_recepcion": stats.erroresRecepcion++; break
            case "error_saque": stats.erroresSaque++; break
            case "error_tactico": stats.erroresTacticos++; break
          }
        }

        // Create PlayerMatchStats for each player who had actions
        for (const [playerId, stats] of statsMap.entries()) {
          // Check player exists in DB
          const playerExists = await tx.player.findUnique({ where: { id: playerId } })
          if (!playerExists) continue

          await tx.playerMatchStats.create({
            data: {
              matchId: newMatch.id,
              playerId,
              ...stats,
            },
          })
        }

        // Create raw action log entries
        for (const action of typedActions) {
          const playerExists = await tx.player.findUnique({ where: { id: action.playerId } })
          await tx.matchActionLog.create({
            data: {
              matchId: newMatch.id,
              playerId: playerExists ? action.playerId : null,
              action: action.action,
              set: action.set,
              timestamp: new Date(action.timestamp),
            },
          })
        }
      }

      // Update lastUsedAt on OpponentTeam and Tournament
      if (opponentTeamId) {
        await tx.opponentTeam.update({
          where: { id: opponentTeamId },
          data: { lastUsedAt: new Date() },
        }).catch(() => {})
      }
      if (tournamentId) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { lastUsedAt: new Date() },
        }).catch(() => {})
      }

      return newMatch
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error("Matches POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
