import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTeamDashboardStats } from "@/lib/team-stats"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")
    const teamId = searchParams.get("teamId")

    if (!clubId) {
      return NextResponse.json({ error: "El ID del club es requerido" }, { status: 400 })
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { ownerId: true, teams: { select: { id: true } } },
    })

    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (teamId && !club.teams.find((team) => team.id === teamId)) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const stats = await getTeamDashboardStats(clubId, teamId || undefined)
    if (!stats) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Stats GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
