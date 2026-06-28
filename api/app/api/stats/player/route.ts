import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlayerDashboardStats } from "@/lib/player-stats"

export const dynamic = "force-dynamic"

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

    const stats = await getPlayerDashboardStats(clubId, playerId, teamId || undefined)
    if (!stats) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Player stats GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
