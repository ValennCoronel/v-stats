import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")

    if (!clubId) {
      return NextResponse.json({ error: "El ID del club es requerido" }, { status: 400 })
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: { teams: true },
    })

    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const teamIds = club.teams.map(t => t.id)

    if (teamIds.length === 0) {
      return NextResponse.json({
        totalMatches: 0,
        winRate: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        totalPoints: 0,
        topScorers: [],
        recentMatches: [],
      })
    }

    // 1. Matches statistics (across all teams in the club)
    const matches = await prisma.match.findMany({
      where: { teamId: { in: teamIds }, status: "finished" },
      orderBy: { date: "desc" },
    })

    const totalMatches = matches.length
    const wins = matches.filter(m => m.result === "WIN").length
    const losses = matches.filter(m => m.result === "LOSS").length
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    let setsWon = 0
    let setsLost = 0
    for (const match of matches) {
      if (match.finalScore) {
        const parts = match.finalScore.split("-")
        if (parts.length === 2) {
          setsWon += parseInt(parts[0], 10) || 0
          setsLost += parseInt(parts[1], 10) || 0
        }
      }
    }

    // 2. Player statistics (aggregate all PlayerMatchStats)
    const playerStats = await prisma.playerMatchStats.groupBy({
      by: ['playerId'],
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
        match: { teamId: { in: teamIds } }
      }
    })

    // Fetch player names and avatars
    const playerIds = playerStats.map(s => s.playerId)
    const playersInfo = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, name: true, number: true, position: true, avatarUrl: true }
    })

    const playerMap = new Map(playersInfo.map(p => [p.id, p]))

    const topScorers = playerStats
      .map(stat => {
        const player = playerMap.get(stat.playerId)
        const totalPositive = (stat._sum.puntos || 0) + (stat._sum.ataquesPositivos || 0) + (stat._sum.bloqueosPositivos || 0) + (stat._sum.aces || 0) + (stat._sum.defensasPositivas || 0) + (stat._sum.ventajasTacticas || 0)
        const totalNegative = (stat._sum.erroresAtaque || 0) + (stat._sum.erroresRecepcion || 0) + (stat._sum.erroresSaque || 0) + (stat._sum.bloqueosErrados || 0) + (stat._sum.erroresTacticos || 0)
        const total = totalPositive + totalNegative
        const eficiencia = total > 0 ? Math.round((totalPositive / total) * 100) : 0

        return {
          ...player,
          puntos: stat._sum.puntos || 0,
          ataques: stat._sum.ataquesPositivos || 0,
          bloqueos: stat._sum.bloqueosPositivos || 0,
          aces: stat._sum.aces || 0,
          recepciones: stat._sum.defensasPositivas || 0,
          errores: totalNegative,
          eficiencia,
          matchesPlayed: stat._count.matchId,
        }
      })
      .filter(p => p.name)
      .sort((a, b) => b.puntos - a.puntos)

    // Compute total points
    const totalPoints = topScorers.reduce((sum, p) => sum + p.puntos, 0)

    // 3. Recent matches (with details)
    const recentMatches = await prisma.match.findMany({
      where: { teamId: { in: teamIds }, status: "finished" },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        opponentTeam: { select: { id: true, name: true, logoUrl: true } },
        tournamentRef: { select: { id: true, name: true, logoUrl: true } },
      }
    })

    return NextResponse.json({
      totalMatches,
      winRate,
      wins,
      losses,
      setsWon,
      setsLost,
      totalPoints,
      topScorers,
      recentMatches,
    })
  } catch (error) {
    console.error("Stats GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
