import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/matches/[id] — Get match detail with player stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        team: {
          include: { club: true }
        },
        opponentTeam: { select: { id: true, name: true, logoUrl: true } },
        tournamentRef: { select: { id: true, name: true, logoUrl: true } },
        playerStats: {
          include: {
            player: {
              select: { id: true, name: true, number: true, position: true, avatarUrl: true }
            }
          },
          orderBy: { puntos: "desc" }
        },
        actions: {
          orderBy: { timestamp: "asc" }
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
    }

    // Verify user owns the team
    if (match.team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Compute team aggregate stats
    const teamStats = {
      ataques: match.playerStats.reduce((sum, s) => sum + s.ataquesPositivos, 0),
      bloqueos: match.playerStats.reduce((sum, s) => sum + s.bloqueosPositivos, 0),
      aces: match.playerStats.reduce((sum, s) => sum + s.aces, 0),
      errores: match.playerStats.reduce((sum, s) =>
        sum + s.bloqueosErrados + s.erroresAtaque + s.erroresRecepcion + s.erroresSaque + s.erroresTacticos, 0),
      puntosTotales: match.playerStats.reduce((sum, s) => sum + s.puntos, 0),
    }

    // Top performers
    const topPerformers = []
    const byPuntos = [...match.playerStats].sort((a, b) => b.puntos - a.puntos)
    if (byPuntos[0] && byPuntos[0].puntos > 0) {
      topPerformers.push({
        name: byPuntos[0].player.name,
        stat: `${byPuntos[0].puntos} PTS`,
        type: "MVP",
      })
    }
    const byBloqueos = [...match.playerStats].sort((a, b) => b.bloqueosPositivos - a.bloqueosPositivos)
    if (byBloqueos[0] && byBloqueos[0].bloqueosPositivos > 0) {
      topPerformers.push({
        name: byBloqueos[0].player.name,
        stat: `${byBloqueos[0].bloqueosPositivos} BLQ`,
        type: "Muro",
      })
    }
    const byAces = [...match.playerStats].sort((a, b) => b.aces - a.aces)
    if (byAces[0] && byAces[0].aces > 0) {
      topPerformers.push({
        name: byAces[0].player.name,
        stat: `${byAces[0].aces} ACES`,
        type: "Saque",
      })
    }

    return NextResponse.json({
      match: {
        id: match.id,
        teamId: match.teamId,
        opponent: match.opponent,
        opponentTeam: match.opponentTeam,
        tournament: match.tournament,
        tournamentRef: match.tournamentRef,
        date: match.date,
        result: match.result,
        finalScore: match.finalScore,
        setScores: match.setScores,
        status: match.status,
        createdAt: match.createdAt,
      },
      playerStats: match.playerStats,
      teamStats,
      topPerformers,
    })
  } catch (error) {
    console.error("Match detail GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
