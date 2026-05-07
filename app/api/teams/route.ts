import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/teams — Get the current user's team (auto-create if none)
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Find or create team for user
    let team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: "Mi Equipo",
          ownerId: authUser.userId,
        },
      })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Teams GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PUT /api/teams — Update team name and/or logo
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, logoUrl } = body

    // Find user's team
    const team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    // Build update data — only include fields that were provided
    const updateData: { name?: string; logoUrl?: string | null } = {}
    if (name !== undefined) updateData.name = name
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: updateData,
    })

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Teams PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
