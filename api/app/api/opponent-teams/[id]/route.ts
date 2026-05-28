import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/opponent-teams/[id] — Update opponent team
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, logoUrl } = body

    // Verify ownership
    const existing = await prisma.opponentTeam.findFirst({
      where: { id, ownerId: authUser.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updateData: { name?: string; logoUrl?: string | null } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const team = await prisma.opponentTeam.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ team })
  } catch (error) {
    console.error("OpponentTeams PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/opponent-teams/[id] — Delete opponent team
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.opponentTeam.findFirst({
      where: { id, ownerId: authUser.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    // Check if any matches reference this opponent by name
    const matchCount = await prisma.match.count({
      where: {
        opponent: existing.name,
        team: { ownerId: authUser.userId },
      },
    })

    if (matchCount > 0) {
      return NextResponse.json(
        {
          error: `Este equipo tiene ${matchCount} partido(s) asociado(s). Si lo eliminás, perderás acceso a esas estadísticas.`,
          matchCount,
          hasMatches: true,
        },
        { status: 409 }
      )
    }

    await prisma.opponentTeam.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("OpponentTeams DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
