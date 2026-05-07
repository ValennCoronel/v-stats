import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      return NextResponse.json({
        totalMatches: 0,
        winRate: 0,
        setsWon: 0,
        topScorers: [],
        recentMatches: [],
      })
    }

    // 1. Matches statistics
    const matches = await prisma.match.findMany({
      where: { teamId: team.id, status: "finished" },
      orderBy: { date: "desc" },
    })

    const totalMatches = matches.length
    const wins = matches.filter(m => m.result === "WIN").length
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    let setsWon = 0
    for (const match of matches) {
      if (match.finalScore) {
        // "3-1" -> us: 3
        const parts = match.finalScore.split("-")
        if (parts.length === 2) {
          setsWon += parseInt(parts[0], 10) || 0
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
      },
      where: {
        match: { teamId: team.id }
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
      .map(stat => ({
        ...playerMap.get(stat.playerId),
        puntos: stat._sum.puntos || 0,
        ataques: stat._sum.ataquesPositivos || 0,
        bloqueos: stat._sum.bloqueosPositivos || 0,
        aces: stat._sum.aces || 0,
      }))
      .filter(p => p.name) // Ensure player info was found
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 5) // Top 5

    // 3. Recent matches (with details)
    const recentMatches = await prisma.match.findMany({
      where: { teamId: team.id, status: "finished" },
      orderBy: { date: "desc" },
      take: 3,
      include: {
        opponentTeam: { select: { id: true, name: true, logoUrl: true } },
        tournamentRef: { select: { id: true, name: true, logoUrl: true } },
      }
    })

    return NextResponse.json({
      totalMatches,
      winRate,
      setsWon,
      topScorers,
      recentMatches,
    })
  } catch (error) {
    console.error("Stats GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
