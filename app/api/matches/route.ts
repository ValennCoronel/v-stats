import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/matches — List all matches for the user's team
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      return NextResponse.json({ matches: [] })
    }

    const matches = await prisma.match.findMany({
      where: { teamId: team.id },
      orderBy: { date: "desc" },
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
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
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

    // Get or create team
    let team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      team = await prisma.team.create({
        data: { name: "Mi Equipo", ownerId: authUser.userId },
      })
    }

    // Create match with stats in a transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create the match record
      const newMatch = await tx.match.create({
        data: {
          teamId: team!.id,
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
      if (actions && actions.length > 0 && allPlayers) {
        // Build stats map per player
        const statsMap = new Map<string, Record<string, number>>()

        for (const action of actions) {
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
        for (const action of actions) {
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
